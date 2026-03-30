/**
 * @file `CalcdexBootstrappable.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.3.0
 */

/* eslint-disable max-classes-per-file */

import { NIL as NIL_UUID } from 'uuid';
import { type GenerationNum } from '@smogon/calc';
import {
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { syncBattle } from '@showdex/redux/actions';
import { calcdexSlice, hellodexSlice } from '@showdex/redux/store';
import {
  clonePlayerSideConditions,
  sanitizePlayerSide,
  similarPokemon,
  usedDynamax,
  usedTerastallization,
} from '@showdex/utils/battle';
import { calcBattleCalcdexNonce } from '@showdex/utils/calc';
import { clamp, formatId } from '@showdex/utils/core';
import { logger, wtf } from '@showdex/utils/debug';
import { detectGenFromFormat } from '@showdex/utils/dex';
import { detectClassicHost } from '@showdex/utils/host';
import { BootdexBootstrappable } from '../Bootdex/BootdexBootstrappable';

export type CalcdexBootstrappableLike =
  & Omit<typeof CalcdexBootstrappable, 'constructor'>
  & (new (battleId: string) => CalcdexBootstrappable);

type BattleRecordResult = 'win' | 'loss';

const l = logger('@showdex/pages/Calcdex/CalcdexBootstrappable');

const winStepRegex = () => /^\|?\s*\|win\|/i;
const battleRecordReducerNameFor = (
  result?: BattleRecordResult | boolean,
) => (
  result === true || result === 'win'
    ? 'recordWin'
    : 'recordLoss'
);

/**
 * putting the *java* in *java*script
 *
 * * note-to-self: all this complex js fukery is just multi-inheritence that js just like java doesn't have
 *   - (... maybe for the better tbh LOL)
 *
 * @example
 * ```ts
 * // serving suggestions:
 * class ClassicBootstrapper extends MixinCalcdexBootstrappable(BootdexClassicBootstrappable) { ... }
 * class PreactBootstrapper extends MixinCalcdexBootstrappable(BootdexPreactBootstrappable) { ... }
 *
 * // functional (but JavaScript-ly illegal) equivalents:
 * class ClassicBootstrapper extends CalcdexBootstrappable, BootdexClassicBootstrappble { ... }
 * class PreactBootstrapper extends CalcdexBootstrappable, BootdexPreactBootstrappble { ... }
 * // where:
 * abstract class CalcdexBootstrappble extends BootdexBootstrappable { ... }
 * abstract class BootdexClassicBootstrapple extends BootdexBootstrappable { ... }
 * abstract class BootdexPreactBootstrapple extends BootdexBootstrappable { ... }
 * abstract class BootdexBootstrappable { ... }
 * ```
 * @since 1.3.0
 */
export const MixinCalcdexBootstrappable = <
  TBootstrappable extends typeof BootdexBootstrappable,
>(
  Bootstrappable: TBootstrappable,
) => {
  // abstract class CalcdexBootstrappableMixin extends (Bootstrappable as (new (...args) => TBootstrappable)) {
  abstract class CalcdexBootstrappableMixin extends (Bootstrappable as typeof BootdexBootstrappable & InstanceType<TBootstrappable>) {
    public readonly battleId: Showdown.ID;

    // note: battle.subscribe() internally sets its `subscription` property to the `listener` arg,
    // i.e., (in src/battle.ts) subscribe(listener) { this.subscription = listener; }
    // (also note: there's only 1 battle.subscription [i.e., not an array!], hence the whole prevBattleSubscription() thing lolol)
    protected prevBattleSubscription?: Showdown.Battle['subscription'] = null;
    protected battleSubscription: Showdown.Battle['subscription'] = (
      state,
    ) => {
      l.debug(
        'battle.subscribe()', state, 'for', this.battle?.id || this.battleId,
        '\n', 'battle', this.battle,
        '\n', 'request', this.battleRequest,
      );

      // call the original subscription() first, if any, so we don't break anything we don't mean to!
      this.prevBattleSubscription?.(state);
      this.syncCalcdex();
    };

    public constructor(battleId: string) {
      super();

      this.battleId = (battleId || null) as Showdown.ID;
    }

    protected abstract get battle(): Showdown.Battle;
    protected abstract get battleRequest(): Showdown.BattleRequest;

    protected get battleState() {
      return CalcdexBootstrappableMixin.Adapter?.rootState?.calcdex?.[this.battle?.id || this.battleId];
    }

    protected get calcdexSettings() { // eslint-disable-line class-methods-use-this
      return CalcdexBootstrappableMixin.Adapter?.rootState?.showdex?.settings?.calcdex;
    }

    // update (2023/07/27): check for '|noinit|nonexistent|' in the `data` & if present, ignore initializing this battle,
    // e.g., '|noinit|nonexistent|The room "battle-gen1ubers-1911645170-ygxif0uoljetvrkksj6dcge3w43xx8wpw" does not exist.'
    // (typically occurs when you AFK in a BattleRoom, your computer sleeps, you come back later & select "Reconnect",
    // refreshing the page)
    protected get initDisabled(): boolean {
      return (this.battle?.stepQueue || []).some((s) => s?.startsWith('|noinit|nonexistent|'));
    }

    protected initCalcdexState(): void {
      const battleId = this.battle?.id || this.battleId;

      this.startTimer();

      if (!battleId) {
        return void this.endTimer('(bad battle.id)');
      }

      const { Adapter } = CalcdexBootstrappableMixin;

      if (this.battle.calcdexStateInit) {
        l.debug(
          'Calcdex state has already been initialized for', battleId,
          '\n', 'calcdexStateInit', this.battle.calcdexStateInit,
          '\n', 'battle', this.battle,
          '\n', 'state', Adapter.rootState?.calcdex?.[battleId],
        );

        return void this.endTimer('(init lock)');
      }

      const { authUsername, settings } = Adapter.rootState?.showdex || {};
      const initNonce = NIL_UUID;

      l.debug(
        'Initializing Calcdex state for', battleId,
        '\n', 'nonce', '(init)', initNonce,
        '\n', 'battle', this.battle,
      );

      Adapter.store.dispatch(calcdexSlice.actions.init({
        scope: `${l.scope}:initCalcdexState()`,

        operatingMode: 'battle',
        battleId,
        battleNonce: initNonce,
        gen: this.battle.gen as GenerationNum,
        // format: battleId.split('-')?.[1], // update (2024/01/22): on smogtours, it's 'battle-smogtours-gen9ou-...' lmao
        format: battleId.split('-').find((p) => detectGenFromFormat(p)),
        gameType: this.battle.gameType === 'doubles' ? 'Doubles' : 'Singles',
        turn: clamp(0, this.battle.turn || 0),
        active: !this.battle.ended,
        renderMode: this.battle.calcdexAsOverlay ? 'overlay' : 'panel',
        switchPlayers: this.battle.viewpointSwitched ?? this.battle.sidesSwitched,

        ...AllPlayerKeys.reduce((prev, playerKey) => {
          const player = this.battle[playerKey];

          prev[playerKey] = {
            active: !!player?.id,
            name: player?.name || null,
            rating: player?.rating || null,

            autoSelect: settings?.calcdex?.defaultAutoSelect
              ?.[(!!authUsername && player?.name === authUsername && 'auth') || playerKey],

            usedMax: usedDynamax(playerKey, this.battle.stepQueue),
            usedTera: usedTerastallization(playerKey, this.battle.stepQueue),
          };

          // note: sanitizePlayerSide() needs the updated side.conditions, so we're initializing it like this here first
          prev[playerKey].side = { conditions: clonePlayerSideConditions(player?.sideConditions) };
          prev[playerKey].side = {
            conditions: prev[playerKey].side.conditions,
            ...sanitizePlayerSide(
              this.battle.gen as GenerationNum,
              prev[playerKey],
              player,
            ),
          };

          return prev;
        }, {} as Record<CalcdexPlayerKey, CalcdexPlayer>),
      }));

      this.battle.calcdexStateInit = true;
    }

    protected syncCalcdex(): void {
      this.startTimer();

      if (!this.battle?.id) {
        return void this.endTimer('(bad battle)', this.battle);
      }

      // don't render if we've already destroyed the calcdex state
      if (this.battle.calcdexDestroyed) {
        l.debug(
          'Calcdex state has been destroyed for', this.battle.id,
          '\n', 'calcdexDestroyed', this.battle.calcdexDestroyed,
          '\n', 'battle', this.battle,
        );

        return void this.endTimer('(calcdex is rektdex)');
      }

      // ignore any freshly created battle objects with missing players
      if (AllPlayerKeys.every((k) => !this.battle[k]?.id)) {
        l.debug(
          'Not all players exist yet in the battle!',
          '\n', 'players', AllPlayerKeys.map((k) => this.battle[k]?.id),
          '\n', 'stepQueue[]', this.battle.stepQueue,
          '\n', 'battle.id', this.battle.id,
        );

        return void this.endTimer('(no peeps)');
      }

      const { Adapter } = CalcdexBootstrappableMixin;

      if (detectClassicHost(window) && !this.battle.calcdexStateInit) {
        const authUserId = (!!Adapter?.authUsername && formatId(Adapter.authUsername)) || null;

        this.initCalcdexState();

        // don't continue processing until the next subscription() callback
        // update (2023/01/31): nvm, init state could be available on the store.getState() call below,
        // but since we're checking for a battleNonce before syncing, it's ok if it doesn't exist yet either
        // (if a NIL as battleNonce is present, even if NIL_UUID, then we know the state has initialized)
        // update (2023/02/06): now preventing the first battle sync if the logged-in user is also player
        // since myPokemon[] could be empty here; the callback in the overridden updateSide() should trigger
        // the battle sync once myPokemon[] is populated; but if we're just spectating here, we can continue
        // syncing after init as normal; also, checking if the battle ended since we could be watching a replay,
        // in which case the authUserId check could pass without myPokemon[] being populated
        if (!this.battle.ended && AllPlayerKeys.some((k) => formatId(this.battle[k]?.name) === authUserId)) {
          return void this.endTimer('(auth player delay)');
        }
      }

      if (!this.battle.calcdexStateInit) {
        return void this.endTimer('(state uninit)', this.battle);
      }

      // make sure the battle was active on the previous sync, but now has ended
      if (this.battleState?.active && this.battle.ended) {
        l.debug(
          'Battle', this.battle.id, 'ended; updating active state...',
          '\n', 'calcdexRoomId', this.battle.calcdexRoomId,
          '\n', 'battle', this.battle,
        );

        Adapter.store.dispatch(calcdexSlice.actions.update({
          scope: `${l.scope}:syncCalcdex()`,
          battleId: this.battle.id,
          battleNonce: this.battle.nonce,
          active: false,
          paused: true,
        }));

        this.updateBattleRecord();

        // only close the calcdexRoom if configured to
        // (here, it's only on 'battle-end' since we're specifically handling that scenario rn)
        if (this.calcdexSettings?.closeOn === 'battle-end' && this.battle.calcdexRoomId) {
          l.debug(
            'Leaving the Calcdex panel', this.battle.calcdexRoomId, 'due to user settings...',
            '\n', 'closeOn', this.calcdexSettings.closeOn, '(in)', 'settings.calcdex', this.calcdexSettings,
            '\n', 'battle', '(id)', this.battle.id, this.battle,
            '\n', 'state', '(prev)', this.battleState,
          );

          this.close();
        }

        return void this.endTimer('(game over)');
      }

      // note: since we're filtering the subscription() callback to avoid UI spamming (based on its `state` arg value),
      // we get the value of battleRoom.request right before it updates on the next callback.
      // not a big deal tho, but it's usually first `null`, then becomes populated on the next Calcdex render.
      this.battle.nonce = calcBattleCalcdexNonce(this.battle, this.battleRequest);

      // this check is to make sure the state has been initialized before attempting to sync
      // update (2023/07/24): ok this is what I get for not using 'strict' mode butt fuck it
      // (it's a good habit to always check your inputs anyways, especially cause things can go wrong during runtime!)
      if (!this.battleState?.battleNonce) {
        return void this.endTimer('(bad state nonce)', this.battleState?.battleNonce);
      }

      // dispatch a battle sync if the nonces are different (i.e., something changed)
      if (this.battle.nonce === this.battleState.battleNonce) {
        /* l.debug(
          'Ignoring battle sync due to same nonce for', this.battle.id,
          '\n', 'nonce', '(prev)', this.battleState.battleNonce, '(now)', this.battle.nonce,
          '\n', 'battle', this.battle,
        ); */

        return void this.endTimer('(same nonce)', this.battle.nonce);
      }

      l.debug(
        'Syncing battle for', this.battle.id,
        '\n', 'nonce', '(prev)', this.battleState.battleNonce, '(now)', this.battle.nonce,
        '\n', 'request', this.battleRequest,
        '\n', 'battle', this.battle,
        '\n', 'state', '(prev)', this.battleState,
      );

      // note: syncBattle() is no longer async, but since it's still wrapped in an async thunky,
      // we're keeping the `void` to keep TypeScript happy lol (`void` does nothing here btw)
      void Adapter.store.dispatch(syncBattle({
        battle: this.battle,
        request: this.battleRequest,
        onAcceptOts: (id) => void CalcdexBootstrappableMixin.acceptBattleOts(id),
      }));

      this.endTimer('(sync ok)');
    }

    // patches in the calcdexId to client Showdown.Pokemon
    protected patchClientCalcdexIdentifier(
      playerKey: CalcdexPlayerKey,
      addPokemon: Showdown.Side['addPokemon'],
      addPokemonArgv: Parameters<Showdown.Side['addPokemon']>,
    ): ReturnType<Showdown.Side['addPokemon']> {
      this.startTimer();

      if (!playerKey || typeof addPokemon !== 'function' || !addPokemonArgv?.length) {
        this.endTimer('(bad patch args)');

        return null;
      }

      const execAddPokemon = () => addPokemon(...addPokemonArgv);

      if (!this.battle?.id || !this.battle.calcdexStateInit) {
        this.endTimer('(bad battle)', this.battle?.id, this.battle);

        return execAddPokemon();
      }

      /* if (this.battle.calcdexIdPatched) {
        this.endTimer('(already patched)');

        return execAddPokemon();
      } */

      const side = this.battle[playerKey];

      if (!side?.sideid) {
        this.endTimer('(bad side)', side);

        return execAddPokemon();
      }

      // we'll collect potential candidates to assemble the final search list below
      const pokemonSearchCandidates: (Showdown.Pokemon | CalcdexPokemon)[] = [];

      // make sure this comes first before `pokemonState` in case `replaceSlot` is specified
      if (side.pokemon?.length) {
        pokemonSearchCandidates.push(...side.pokemon);
      }

      // update (2024/01/03): someone encountered a strange case in Gen 9 VGC 2024 Reg F when after using Parting Shot,
      // accessing battleState.format in the similarPokemon() call below would result in a TypeError, causing their
      // Showdown to break (spitting the runMajor() stack trace into the BattleRoom chat)... which means battleState was
      // undefined for some reason o_O (apparently this doesn't happen often tho)
      if (!this.battleState?.battleId) {
        // we'll just let the client deal with whatever this is
        return addPokemon(...addPokemonArgv);
      }

      const { pokemon: pokemonFromState } = this.battleState[playerKey] || {};

      if (pokemonFromState?.length) {
        pokemonSearchCandidates.push(...pokemonFromState);
      }

      // don't filter this in case `replaceSlot` is specified
      const pokemonSearchList = pokemonSearchCandidates.map((p) => ({
        calcdexId: p.calcdexId,
        ident: p.ident,
        // name: p.name,
        speciesForme: p.speciesForme,
        gender: p.gender,
        details: p.details,
        searchid: p.searchid,
      }));

      const [
        , // unused; i.e., name
        ident,
        details,
        replaceSlot = -1,
      ] = addPokemonArgv;

      // just js things uwu
      const prevPokemon = (replaceSlot > -1 && pokemonSearchList[replaceSlot])
        || pokemonSearchList.filter((p) => !!p.calcdexId).find((p) => (
          // e.g., ident = 'p1: CalcdexDemolisher' (nicknamed) or 'p1: Ditto' (unnamed default)
          // update (2023/07/30): while `ident` is mostly available, when viewing a replay (i.e., an old saved battle), it's not!
          (!ident || (
            (!!p?.ident && p.ident === ident)
              // e.g., searchid = 'p1: CalcdexDemolisher|Ditto'
              // nickname case: pass; default case: fail ('p1: CalcdexDemolisher' !== 'p1: Ditto')
              // note: not doing startsWith() since 'p1: Mewtwo|Mewtwo' will pass when given ident 'p1: Mew'
              || (!!p?.searchid?.includes('|') && p.searchid.split('|')[0] === ident)
          ))
            && similarPokemon({ details }, p, {
              format: this.battleState.format,
              normalizeFormes: 'wildcard',
              ignoreMega: true,
            })
        ));

      /* l.debug(
        'side.addPokemon()', 'for', ident || name || details?.split(',')?.[0], 'for player', side.sideid,
        '\n', 'ident', ident,
        '\n', 'details', details,
        '\n', 'replaceSlot', replaceSlot,
        '\n', 'prevPokemon[]', prevPokemon,
        '\n', 'pokemonSearchList[]', pokemonSearchList,
        // '\n', 'side', side,
        // '\n', 'battle', this.battle,
      ); */

      const newPokemon = execAddPokemon();

      if (!newPokemon?.speciesForme) {
        this.endTimer('(bad newPokemon)', newPokemon);

        return newPokemon;
      }

      if (!prevPokemon?.calcdexId) {
        this.endTimer('(bad prevPokemon)', prevPokemon);

        return newPokemon;
      }

      newPokemon.calcdexId = prevPokemon.calcdexId;

      l.debug(
        'Restored calcdexId', newPokemon.calcdexId,
        'from prevPokemon', prevPokemon.ident || prevPokemon.speciesForme,
        'to newPokemon', newPokemon.ident || newPokemon.speciesForme,
        'for player', side.sideid,
        '\n', 'prevPokemon[]', prevPokemon,
        '\n', 'newPokemon[]', newPokemon,
      );

      return newPokemon;
    }

    // patches in the calcdexId to Showdown.ServerPokemon (i.e., battle.myPokemon[])
    // note: the myPokemon[] arg should be from the freshest source, e.g., (request as Showdown.BattleRequest).side.pokemon[],
    // & preferably not from the battle state, e.g., battle.myPokemon[], since it would've already been mutated by that point
    protected patchServerCalcdexIdentifier(myPokemon: Showdown.ServerPokemon[]): void {
      this.startTimer();

      if (!this.battle?.id) {
        return void this.endTimer('(bad battle)', this.battle?.id, this.battle);
      }

      /* if (this.battle.calcdexIdPatched) {
        return void this.endTimer('(already patched)');
      } */

      if (!myPokemon?.length) {
        return void this.endTimer('(no server mon)', myPokemon, this.battle);
      }

      const format = this.battle.id.split('-').find((part) => detectGenFromFormat(part));

      if (!format) {
        return void this.endTimer('(bad format)', format, this.battle);
      }

      l.debug(
        'patchServerCalcdexIdentifier()', 'myPokemon[]', myPokemon,
        '\n', 'battle', this.battle,
        '\n', 'battle.myPokemon[]', this.battle.myPokemon,
      );

      if (!Array.isArray(this.battle.myPokemon)) {
        return void this.endTimer('(bad server mon)', this.battle.myPokemon, this.battle);
      }

      let didUpdate = !myPokemon?.length && !!this.battle.myPokemon?.length;

      // with each updated myPokemon[], see if we find a match to restore its calcdexId
      this.battle.myPokemon.forEach((pokemon) => {
        if (!pokemon?.ident || pokemon.calcdexId) {
          return;
        }

        // note (2023/07/30): leave the `ident` check as is here since viewing a replay wouldn't trigger this function
        // (there are no myPokemon[] when viewing a replay, even if you were viewing your own battle!)
        const prevMyPokemon = myPokemon.find((p) => !!p?.ident && (
          p.ident === pokemon.ident
            || p.speciesForme === pokemon.speciesForme
            || p.details === pokemon.details
            // update (2023/07/27): this check breaks when p.details is 'Mewtwo' & pokemon.speciesForme is 'Mew',
            // resulting in the Mewtwo's calcdexId being assigned to the Mew o_O
            // || p.details.includes(pokemon.speciesForme)
            // update (2023/07/30): `details` can include the gender, if applicable (e.g., 'Reuniclus, M')
            /* || p.details === [
              pokemon.speciesForme.replace('-*', ''),
              pokemon.gender !== 'N' && pokemon.gender,
            ].filter(Boolean).join(', ') */
            || similarPokemon(pokemon, p, {
              format,
              normalizeFormes: 'wildcard',
              ignoreMega: true,
            })
        ));

        if (!prevMyPokemon?.calcdexId) {
          return;
        }

        pokemon.calcdexId = prevMyPokemon.calcdexId;
        didUpdate = true;

        /* l.debug(
          'Restored previous calcdexId for', pokemon.speciesForme, 'in battle.myPokemon[]',
          '\n', 'calcdexId', prevMyPokemon.calcdexId,
          '\n', 'pokemon', '(prev)', prevMyPokemon, '(now)', pokemon,
        ); */
      });

      if (!didUpdate || !this.battle.calcdexInit) {
        return void this.endTimer('(no updates)');
      }

      const { nonce: prevNonce } = this.battle;

      this.battle.nonce = calcBattleCalcdexNonce(this.battle, this.battleRequest);

      l.debug(
        'Restored previous calcdexId\'s in battle.myPokemon[]',
        '\n', 'nonce', '(prev)', prevNonce, '(now)', this.battle.nonce,
        '\n', 'myPokemon[]', '(prev)', myPokemon, '(now)', this.battle.myPokemon,
      );

      // since myPokemon[] could be available now, forcibly fire a battle sync
      // (should we check if myPokemon[] is actually populated? maybe... but I'll leave it like this for now)
      this.battle.subscription('callback');
    }

    // needs to be uniquely implemented in each __SHOWDEX_HOST bootstrapper
    // (should make use of both the patchClientCalcdexIdentifier() & patchServerCalcdexIdentifier() methods)
    protected abstract patchCalcdexIdentifier(): void;

    /**
     * Determines if the auth user has won/loss, then increments the win/loss counter.
     *
     * * Specify the `forceResult` argument when you know the `battle` object might not be available.
     *   - `battle` wouldn't be typically available in a `ForfeitPopup` used in the `'classic'` Showdown client, for instance.
     *
     * @since 1.0.6
     */
    protected updateBattleRecord(forceResult?: BattleRecordResult): void {
      const { authUsername, store } = CalcdexBootstrappableMixin.Adapter;

      if (typeof store?.dispatch !== 'function' || this.battle?.calcdexBattleRecorded) {
        return;
      }

      if (forceResult && ['win', 'loss'].includes(forceResult)) {
        const reducerName = battleRecordReducerNameFor(forceResult);

        l.debug(
          'updateBattleRecord()', 'forcing', forceResult, 'for', authUsername, 'in', this.battleId,
          // '\n', 'forceResult', forceResult,
          // '\n', 'authUsername', authUsername,
          '\n', '->', `hellodexSlice.actions.${reducerName}(`, this.battleId, ')',
          '\n', 'battle', '(typeof)', wtf(this.battle), this.battle,
        );

        return void store.dispatch(hellodexSlice.actions[reducerName](this.battleId));
      }

      if (!authUsername || !this.battleId) {
        return;
      }

      const authUsernameId = formatId(authUsername);
      const playerNames = AllPlayerKeys.map((k) => this.battle?.[k]?.name).filter(Boolean);
      const playerNameIds = playerNames.map(formatId).filter(Boolean);

      if (playerNameIds.length && !playerNameIds.includes(authUsernameId)) {
        return;
      }

      // note: winStep might be '|win|showdex_testee' or '|\n|win|showdex_testee'
      const winStep = this.battle.stepQueue?.find((s) => winStepRegex().test(s));
      const winnerName = winStep?.replace?.(winStepRegex(), ''); // e.g., '|win|showdex_testee' -> 'showdex_testee'
      const winnerNameId = (!!winnerName && formatId(winnerName)) || null; // e.g., -> 'showdextestee'

      if (!winnerNameId) {
        return;
      }

      const didWin = winnerNameId === authUsernameId;
      const reducerName = battleRecordReducerNameFor(didWin);

      l.debug(
        'updateBattleRecord()', 'for', this.battleId,
        '\n', 'authUsername', authUsername, '->', 'authUsernameId', authUsernameId,
        '\n', 'playerNames[]', playerNames,
        '\n', '->', 'playerNameIds[]', playerNameIds,
        '\n', 'winStep', winStep,
        '\n', '->', 'winnerName', winnerName, '->', 'winnerNameId', winnerNameId,
        '\n', 'didWin?', didWin, '->', `hellodexSlice.actions.${reducerName}(`, this.battleId, ')',
        '\n', 'battle', '(typeof)', wtf(this.battle), this.battle,
      );

      store.dispatch(hellodexSlice.actions[reducerName](this.battleId));
      this.battle.calcdexBattleRecorded = true;
    }

    /**
     * Opens an existing Calcdex tab (or battle if overlayed) or creates a new one.
     *
     * * Extracted from the Hellodex bootstrapper in v1.2.0.
     *
     * @since 1.0.3
     */
    public abstract open(): void;

    /**
     * Closes the Calcdex (& its associated client battle room, if applicable).
     *
     * @since 1.3.0
     */
    public abstract close(): void;

    /**
     * Removes all traces of (& also `close()`'s) the Calcdex.
     *
     * @since 1.3.0
     */
    public abstract destroy(): void;
  }

  return CalcdexBootstrappableMixin;
};

export abstract class CalcdexBootstrappable extends MixinCalcdexBootstrappable(BootdexBootstrappable) {
  public static override readonly scope = l.scope;
}
