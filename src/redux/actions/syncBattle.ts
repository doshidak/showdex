import { createAsyncThunk } from '@reduxjs/toolkit';
import { type GenerationNum } from '@smogon/calc';
import { AllPlayerKeys } from '@showdex/consts/battle';
import { PokemonNatures, PokemonTypes } from '@showdex/consts/dex';
import {
  type CalcdexBattleState,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  type RootState,
} from '@showdex/redux/store';
import {
  cloneBattleState,
  clonePlayerSideConditions,
  countActivePlayers,
  detectAuthPlayerKeyFromBattle,
  detectBattleRules,
  detectPlayerKeyFromBattle,
  detectPlayerKeyFromPokemon,
  mergeRevealedMoves,
  sanitizePlayerSide,
  sanitizePokemon,
  sanitizeVolatiles,
  toggleRuinAbilities,
  usedDynamax,
  usedTerastallization,
} from '@showdex/utils/battle';
import { calcCalcdexId, calcPokemonCalcdexId } from '@showdex/utils/calc';
import { clamp, env, formatId } from '@showdex/utils/core';
import { detectLegacyGen, legalLockedFormat } from '@showdex/utils/dex';
import { logger, runtimer } from '@showdex/utils/debug';
import {
  appliedPreset,
  getPresetFormes,
  getTeamSheetPresets,
} from '@showdex/utils/presets';
import { syncField } from './syncField';
import { syncPokemon } from './syncPokemon';

export interface SyncBattlePayload {
  battle: Showdown.Battle;
  request?: Showdown.BattleRequest;
}

export const SyncBattleActionType = 'calcdex:sync';

const l = logger('@showdex/redux/actions/syncBattle()');

/**
 * Syncs the Showdown `battle` state with an existing `CalcdexBattleState`.
 *
 * @since 0.1.3
 */
export const syncBattle = createAsyncThunk<CalcdexBattleState, SyncBattlePayload>(
  SyncBattleActionType,

  (payload, api) => {
    const {
      battle,
      request,
    } = payload || {};

    const endTimer = runtimer(l.scope, l);

    const rootState = api.getState() as RootState;
    const settings = rootState?.showdex?.settings?.calcdex;
    const state = rootState?.calcdex;

    // moved from calcdexSlice since the syncBattle.pending case does not provide the payload
    l.debug(
      'RECV', SyncBattleActionType, 'for', battle?.id || '(missing battle.id)',
      '\n', 'payload', payload,
      '\n', 'settings', settings,
      '\n', 'state', state,
    );

    const {
      id: battleId,
      nonce: battleNonce,
      gen,
      turn,
      ended,
      myPokemon,
      speciesClause,
      stepQueue,
    } = battle || {};

    if (!battleId) {
      throw new Error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');
    }

    if (!(battleId in state)) {
      throw new Error(`Could not find a CalcdexBattleState with battleId ${battleId}`);
    }

    // yooo native deep-copying lessgo baby
    // update (2023/07/17): turns out structuredClone() is the slowest thing ever (no surprises there tbh)
    // & therefore most be eradicated from the codebase effective immediately >:(
    // const battleState: CalcdexBattleState = structuredClone(state[battleId]);
    const battleState = cloneBattleState(state[battleId]);

    // l.debug(
    //   '\n', 'pre-copied battleState', state[battleId],
    //   '\n', 'deep-copied battleState', battleState,
    // );

    if (battleState.battleNonce && battleState.battleNonce === battleNonce) {
      if (__DEV__) {
        l.debug(
          'Skipping this round of syncing due to same battleNonce from before',
          '\n', 'battleNonce', battleNonce,
          '\n', 'battle', battle,
          '\n', 'battleState', battleState,
          '\n', '(You will only see this message on development.)',
        );
      }

      return;
    }

    // update the gen, if provided
    if (typeof gen === 'number' && gen > 0) {
      battleState.gen = gen as GenerationNum;
    }

    // detect the battle's rules
    if (stepQueue?.length) {
      battleState.rules = detectBattleRules(stepQueue);
    }

    // update the current turn number
    battleState.turn = turn || 0;

    // update the battle's active state, but only allow it to go from true -> false
    // as to avoid updating the HellodexBattleRecord from replays and battle re-inits)
    if (battleState.active && typeof ended === 'boolean' && ended) {
      battleState.active = !ended;
    }

    // update the authPlayerKey (if any)
    battleState.authPlayerKey = detectAuthPlayerKeyFromBattle(battle);

    // find out which side myPokemon belongs to
    const detectedPlayerKey = battleState.authPlayerKey || detectPlayerKeyFromBattle(battle);

    if (detectedPlayerKey && !battleState.playerKey) {
      battleState.playerKey = detectedPlayerKey;
    }

    if (!battleState.opponentKey) {
      battleState.opponentKey = battleState.playerKey === 'p2' ? 'p1' : 'p2';
    }

    // update the sidesSwitched from the battle
    battleState.switchPlayers = battle.sidesSwitched;

    // determine if we should include Teambuilder presets
    // (should be already pre-converted in the teamdexSlice)
    const teambuilderPresets = (
      !!settings?.includeTeambuilder
        && settings.includeTeambuilder !== 'never'
        && !battleState.format.includes('random')
        && rootState?.teamdex?.presets?.filter((p) => p?.gen === battleState.gen)
    ) || [];

    // determine if we should look for team sheets
    const sheetStepQueues = (
      !!settings?.autoImportTeamSheets
        && battle.stepQueue?.filter((q) => (q.startsWith('|c|') && q.includes('/raw')) || q.startsWith('|uhtml|ots|'))
    ) || [];

    const sheetsNonce = sheetStepQueues.length
      ? calcCalcdexId(sheetStepQueues.join(';'))
      : null;

    // l.debug(
    //   '\n', 'sheetsNonce', sheetsNonce,
    //   '\n', 'sheetStepQueues', sheetStepQueues,
    //   '\n', 'battle.stepQueue', battle.stepQueue,
    // );

    if (sheetsNonce && battleState.sheetsNonce !== sheetsNonce) {
      battleState.sheetsNonce = sheetsNonce;
      battleState.sheets = sheetStepQueues.flatMap((sheetStepQueue) => getTeamSheetPresets(
        battleState.format,
        sheetStepQueue,
      ));
    }

    // keep track of CalcdexPokemon mutations from one player to another
    // (e.g., revealed properties of the transform target Pokemon from the current player's transformed Pokemon)
    const futureMutations = AllPlayerKeys.reduce<Record<CalcdexPlayerKey, DeepPartial<CalcdexPokemon>[]>>((prev, key) => {
      prev[key] = [];

      return prev;
    }, {
      p1: null,
      p2: null,
      p3: null,
      p4: null,
    });

    for (const playerKey of AllPlayerKeys) {
      // l.debug('Processing player', playerKey);

      if (!(playerKey in battle) || battle[playerKey]?.sideid !== playerKey) {
        // if (__DEV__) {
        //   l.warn(
        //     'Ignoring player updates for', playerKey, 'since it doesn\'t exist in the battle state.',
        //     '\n', `battle.${playerKey}`, battle[playerKey],
        //     '\n', '(You will only see this warning on development.)',
        //   );
        // }

        continue;
      }

      const player = battle[playerKey];
      const playerState = battleState[playerKey];

      if (player.name && playerState.name !== player.name) {
        playerState.name = player.name;
      }

      if (player.rating && playerState.rating !== player.rating) {
        playerState.rating = player.rating;
      }

      if (!playerState.active) {
        playerState.active = true;
      }

      // l.debug(
      //   'Updated name to', playerState.name, 'and rating to', playerState.rating || '(unrated)', 'for player', playerKey,
      //   '\n', 'battleId', battleId,
      //   '\n', 'player', player,
      //   '\n', 'playerState', playerState,
      //   '\n', 'battle', battle,
      //   '\n', 'battleState', battleState,
      // );

      if (!Array.isArray(player.pokemon) || !player.pokemon.length) {
        if (__DEV__) {
          l.warn(
            'Ignoring Pokemon updates for', playerKey, 'since they don\'t have any pokemon.',
            '\n', 'player.pokemon', player.pokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
            '\n', '(You will only see this warning on development.)',
          );
        }

        continue;
      }

      // determine the max amount of Pokemon
      const maxPokemon = Math.max(
        player?.totalPokemon || 0,
        env.int('calcdex-player-min-pokemon', 0),
      );

      if (playerState.maxPokemon !== maxPokemon) {
        playerState.maxPokemon = maxPokemon;
      }

      // determine if `myPokemon` belongs to the current player
      const isMyPokemonSide = !!battleState.playerKey
        && playerKey === battleState.playerKey;
        // && !!myPokemon?.length;

      const hasMyPokemon = !!myPokemon?.length;

      // if we're in an active battle and the logged-in user is also a player,
      // but did not receieve myPokemon from the server yet, don't process any Pokemon!
      // (we need the calcdexId to be assigned to myPokemon first, then mapped to the clientPokemon)
      const initialPokemon = battleState.active
        && isMyPokemonSide
        && battleState.authPlayerKey === playerKey
        ? myPokemon || []
        : player.pokemon;

      const currentOrder = initialPokemon?.map((
        pokemon: Showdown.ServerPokemon | Showdown.Pokemon,
      ) => {
        // l.debug(
        //   'Ordering Pokemon', pokemon.speciesForme, 'for player', playerKey,
        //   '\n', 'battleId', battleId,
        //   '\n', 'pokemon.calcdexId', pokemon.calcdexId,
        //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        //   '\n', 'source', 'getIdent' in pokemon ? 'client' : 'server',
        //   '\n', 'pokemon', pokemon,
        // );

        if (!pokemon.calcdexId) {
          // update (2022/10/18): found a case where the client Pokemon was given before
          // the ServerPokemon for the myPokemon side rip lol
          pokemon.calcdexId = (
            isMyPokemonSide
              && !!pokemon.ident
              && !!pokemon.details // update (2023/07/27): might be guaranteed to exist actually :o
              && player.pokemon.find((p) => (
                !!p?.calcdexId
                  && !!p.ident
                  && !!p.details
                  && p.ident === pokemon.ident
                  // update (2023/07/30): `details` can include the gender, if applicable (e.g., 'Reuniclus, M')
                  // && p.details === (pokemon.details || pokemon.speciesForme)
                  && (
                    p.details === pokemon.details
                      || p.details === [
                        pokemon.speciesForme,
                        pokemon.gender !== 'N' && pokemon.gender,
                      ].filter(Boolean).join(', ')
                  )
              ))?.calcdexId
          ) || calcPokemonCalcdexId(pokemon, playerKey);

          // l.debug(
          //   'Assigned calcdexId', pokemon.calcdexId, 'to', pokemon.speciesForme,
          //   'for player', playerKey,
          //   '\n', 'battleId', battleId,
          //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
          //   '\n', 'source', 'getIdent' in pokemon ? 'client' : 'server',
          //   '\n', 'pokemon', pokemon,
          // );
        }

        if (isMyPokemonSide && hasMyPokemon && !('getIdent' in pokemon)) {
          const clientPokemon = player.pokemon
            .find((p) => !p.calcdexId && (
              !!p.ident
                && !!p.speciesForme
                && !!p.details
                && !!p.searchid
                && p.ident === pokemon.ident
            ) && (
              p.details === pokemon.details
                || p.searchid === pokemon.searchid
                || p.speciesForme === pokemon.speciesForme
                // || pokemon.searchid.includes(p.ident)
                // update (2023/07/27): this speciesForme check breaks in the case where you have a 'Mewtwo',
                // but we come across a 'Mew' to initialize, so it'll pass this check! (it shouldn't)
                // || pokemon.speciesForme.includes(p.speciesForme.replace('-*', ''))
                || pokemon.speciesForme.replace('-*', '') === p.speciesForme.replace('-*', '')
            ));

          if (clientPokemon) {
            clientPokemon.calcdexId = pokemon.calcdexId;

            // l.debug(
            //   'Assigned calcdexId', pokemon.calcdexId,
            //   'to matched clientPokemon', clientPokemon.speciesForme,
            //   'for player', playerKey,
            //   '\n', 'battleId', battleId,
            //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
            //   '\n', 'clientPokemon', clientPokemon,
            //   '\n', 'serverPokemon', pokemon,
            // );
          }
        }

        return pokemon.calcdexId;
      }) ?? [];

      if (currentOrder.length >= playerState.pokemonOrder.length) {
        playerState.pokemonOrder = currentOrder;

        // l.debug(
        //   'Set Pokemon ordering for player', playerKey,
        //   '\n', 'pokemonOrder', playerState.pokemonOrder,
        //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        //   '\n', 'initialPokemon', initialPokemon,
        //   '\n', 'battle', battle,
        //   '\n', 'battleState', battleState,
        // );
      }

      // reconstruct a full list of the current player's Pokemon, whether revealed or not
      // (but if we don't have the relevant info [i.e., !isMyPokemonSide], then just access the player's `pokemon`)
      const playerPokemon = playerState.pokemonOrder.map((calcdexId) => {
        // try to find a matching clientPokemon that has already been revealed using the ident,
        // which is seemingly consistent between the player's `pokemon` (Pokemon[]) and `myPokemon` (ServerPokemon[])
        const clientPokemonIndex = player.pokemon.findIndex((p) => p.calcdexId === calcdexId);

        if (clientPokemonIndex > -1) {
          return player.pokemon[clientPokemonIndex];
        }

        const serverPokemon = isMyPokemonSide && hasMyPokemon
          ? myPokemon.find((p) => p.calcdexId === calcdexId)
          : null;

        if (!serverPokemon) {
          return null;
        }

        if (!serverPokemon.calcdexId) {
          serverPokemon.calcdexId = calcdexId;
        }

        // at this point, most likely means that the Pokemon is not yet revealed,
        // so convert the ServerPokemon into a partially-filled Pokemon object
        return {
          calcdexId: serverPokemon.calcdexId,
          ident: serverPokemon.ident,
          searchid: serverPokemon.searchid,
          name: serverPokemon.name,
          speciesForme: serverPokemon.speciesForme,
          details: serverPokemon.details,
          gender: serverPokemon.gender,
          level: serverPokemon.level,
          hp: serverPokemon.hp,
          maxhp: serverPokemon.maxhp,
        } as DeepPartial<Showdown.Pokemon>;
      });

      l.debug(
        'Preparing to process', playerPokemon.length, 'of', '(max)', maxPokemon, 'Pokemon',
        'for player', playerKey,
        '\n', 'battleId', battleId,
        '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        '\n', 'playerPokemon', playerPokemon,
        '\n', 'pokemonOrder', playerState.pokemonOrder,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      // update each pokemon
      // (note that the index `i` should be relatively consistent between turns)
      for (let i = 0; i < playerPokemon.length; i++) {
        const clientPokemon = playerPokemon[i];

        if (!clientPokemon?.calcdexId) {
          l.debug(
            'Ignoring untagged Pokemon w/o calcdexId for player', playerKey, 'at index', i,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'playerPokemon', playerPokemon,
            '\n', 'pokemonOrder', playerState.pokemonOrder,
            '\n', 'battle', battle,
            '\n', 'battleState', battleState,
          );

          continue;
        }

        const serverPokemon = isMyPokemonSide && hasMyPokemon
          ? myPokemon.find((p) => p.calcdexId === clientPokemon.calcdexId)
          : null;

        const matchedPokemonIndex = playerState.pokemon
          .findIndex((p) => p.calcdexId === clientPokemon.calcdexId);

        const matchedPokemon = matchedPokemonIndex > -1
          ? playerState.pokemon[matchedPokemonIndex]
          : null;

        // this is our starting point for the current clientPokemon
        const basePokemon = matchedPokemon || sanitizePokemon(
          clientPokemon,
          battleState.format,
          // settings?.showAllFormes, // update (2023/01/05): no longer a setting
          true,
        );

        // in case the volatiles aren't sanitized yet lol
        if ('transform' in basePokemon.volatiles && typeof basePokemon.volatiles.transform[1] !== 'string') {
          basePokemon.volatiles = sanitizeVolatiles(basePokemon);
        }

        // and then from here on out, we just directly modify syncedPokemon
        // (serverPokemon and dex are optional, which will add additional known properties)
        const syncedPokemon = syncPokemon(
          basePokemon,
          clientPokemon,
          serverPokemon,
          battleState,
          (!isMyPokemonSide || !hasMyPokemon)
            // update (2023/02/03): defaultAutoMoves.auth is always false since we'd normally have myPokemon,
            // but in cases of old replays, myPokemon won't be available, so we'd want to respect the user's setting
            // using the playerKey instead of 'auth'
            && settings?.defaultAutoMoves[battleState.authPlayerKey === playerKey && hasMyPokemon ? 'auth' : playerKey],
          teambuilderPresets,
        );

        // update the syncedPokemon's playerKey, if falsy or mismatched
        if (!syncedPokemon.playerKey || syncedPokemon.playerKey !== playerKey) {
          syncedPokemon.playerKey = playerKey;
        }

        const formes = getPresetFormes(
          syncedPokemon.transformedForme || syncedPokemon.speciesForme,
          battleState.format,
        );

        // attach Teambuilder presets for the specific Pokemon, if available
        // (this should only happen once per battle)
        const shouldAddTeambuilder = !!teambuilderPresets.length
          && !syncedPokemon.presets.some((p) => ['storage', 'storage-box'].includes(p.source));

        if (shouldAddTeambuilder) {
          const matchedPresets = teambuilderPresets.filter((p) => (
            formes.includes(p.speciesForme) && (
              settings.includeTeambuilder === 'always'
                || (settings.includeTeambuilder === 'teams' && p.source === 'storage')
                || (settings.includeTeambuilder === 'boxes' && p.source === 'storage-box')
                || syncedPokemon.presetId === p.calcdexId // include the matched Teambuilder team if 'boxes'
            )
          ));

          if (matchedPresets.length) {
            syncedPokemon.presets.push(...matchedPresets);
          }
        }

        // attach presets derived from team sheets matching the specific player AND Pokemon, if available
        if (battleState.sheets.length) {
          // filter for matching sheet presets, then sort them with the highest allocated EVs first
          // (handles case where open team sheets are available, which has no EVs, then !showteam is invoked, which has EVs)
          const matchedPresets = battleState.sheets.filter((p) => (
            formes.includes(p.speciesForme)
              && formatId(p.playerName) === formatId(playerState.name)
          )).sort((a, b) => {
            // note: both would be 0 for legacy gens, obviously, so no sorting will happen
            const evsA = Object.values(a?.evs || {}).reduce((sum, value) => sum + value, 0);
            const evsB = Object.values(b?.evs || {}).reduce((sum, value) => sum + value, 0);

            if (evsA > evsB) {
              return -1;
            }

            if (evsB > evsA) {
              return 1;
            }

            return 0;
          });

          // don't add sheets for the auth player's Pokemon since we should already know its exact preset!
          const shouldAddPresets = !!matchedPresets.length
            && !syncedPokemon.serverSourced
            && !syncedPokemon.presets.some((p) => p.source === 'sheet' && formes.includes(p.speciesForme));

          if (shouldAddPresets) {
            syncedPokemon.presets.splice(
              syncedPokemon.presets[0]?.source === 'server' ? 1 : 0, // 'Yours' preset is always first (index 0)
              0, // don't remove any presets!
              ...matchedPresets.filter((p) => (
                battleState.legacy
                  || Object.values(p.evs || {}).reduce((sum, value) => sum + value, 0) > 0
              )), // only include valid presets with EVs, if not legacy (nature will be Hardy if not provided btw)
            );

            // auto-apply the first team sheet preset if the current one applied isn't the matchedPreset
            const [matchedPreset] = matchedPresets;

            const shouldApplyPreset = !!matchedPreset?.calcdexId
              && !appliedPreset(battleState.format, syncedPokemon, matchedPreset);

            if (shouldApplyPreset) {
              const defaultIv = battleState.legacy ? 30 : 31;

              if (!battleState.legacy) {
                // note: since team sheets contain the Pokemon's actual ability and items, we're setting them as
                // ability and item, respectively, instead of dirtyAbility and dirtyItem, also respectively
                if (matchedPreset.ability) {
                  syncedPokemon.ability = matchedPreset.ability;
                  syncedPokemon.dirtyAbility = null; // in case applyPreset() already applied one before this point
                }

                // don't apply the default neutral nature from importPokePaste()
                // (sets the nature to 'Hardy' by default if a nature couldn't be parsed from the PokePaste)
                // update (2023/02/07): allow 'Hardy' natures if we're in Randoms
                if (PokemonNatures.includes(matchedPreset.nature) && (battleState.format.includes('random') || matchedPreset.nature !== 'Hardy')) {
                  syncedPokemon.nature = matchedPreset.nature;
                }

                // update (2023/02/07): only apply EVs from the team sheet if the sum of all of them is > 0
                // (this prevents open team sheets, which doesn't include EVs, from overwriting existing EVs from another preset)
                if (Object.values(matchedPreset.evs || {}).reduce((sum, value) => sum + (value || 0), 0)) {
                  syncedPokemon.evs = {
                    hp: matchedPreset.evs.hp ?? 0,
                    atk: matchedPreset.evs.atk ?? 0,
                    def: matchedPreset.evs.def ?? 0,
                    spa: matchedPreset.evs.spa ?? 0,
                    spd: matchedPreset.evs.spd ?? 0,
                    spe: matchedPreset.evs.spe ?? 0,
                  };
                }
              }

              // checking prevItem to make sure to not apply the item if their actual item was knocked off, for instance
              // (in which case prevItem would be 'Focus Sash' and prevItemEffect would be 'knocked off')
              if (battleState.gen > 1 && matchedPreset.item && !syncedPokemon.prevItem) {
                syncedPokemon.item = matchedPreset.item;
                syncedPokemon.dirtyItem = null;
              }

              if (matchedPreset.teraTypes?.length && PokemonTypes.includes(matchedPreset.teraTypes[0] as Showdown.TypeName)) {
                [syncedPokemon.revealedTeraType] = matchedPreset.teraTypes as Showdown.TypeName[];
                syncedPokemon.teraType = syncedPokemon.revealedTeraType;
              }

              if (matchedPreset.moves?.length) {
                syncedPokemon.revealedMoves = [...matchedPreset.moves];
                syncedPokemon.moves = mergeRevealedMoves(syncedPokemon);
              }

              // update (2023/02/07): perform the same treatment for IVs as we did for EVs earlier
              if (Object.values(matchedPreset.ivs || {}).reduce((sum, value) => sum + (value || 0), 0)) {
                syncedPokemon.ivs = {
                  hp: matchedPreset.ivs.hp ?? defaultIv,
                  atk: matchedPreset.ivs.atk ?? defaultIv,
                  def: matchedPreset.ivs.def ?? defaultIv,
                  spa: matchedPreset.ivs.spa ?? defaultIv,
                  spd: matchedPreset.ivs.spd ?? defaultIv,
                  spe: matchedPreset.ivs.spe ?? defaultIv,
                };
              }

              // only set this if the matchedPreset is a complete preset, typically from !showteam, but not open team sheets,
              // which omits EVs, IVs, and nature (in which case, we didn't add incomplete presets to the Pokemon's presets
              // in the first place, so the some() call would return false)
              if (syncedPokemon.presets.some((p) => p?.calcdexId === matchedPreset.calcdexId)) {
                syncedPokemon.presetId = matchedPreset.calcdexId;
              }
            } // end shouldApplyPreset
          } // end shouldAddPresets
        } // end battleState.sheets.length

        // detect if Pokemon is transformed and to which player & which Pokemon,
        // so we can apply those known properties to that Pokemon in that player's state
        // (note: we'd only know these properties from the server, i.e., the auth user is also a player)
        if (syncedPokemon.serverSourced && syncedPokemon.transformedForme && clientPokemon?.volatiles?.transform?.length) {
          // since we sanitized the volatiles earlier, we actually need the pointer to the target pokemon
          // from the original Showdown.Pokemon (i.e., the clientPokemon) to retrieve its ident
          const targetClientPokemon = clientPokemon.volatiles.transform[1] as unknown as Showdown.Pokemon;
          const targetPlayerKey = (!!targetClientPokemon?.ident && detectPlayerKeyFromPokemon(targetClientPokemon)) || null;

          // update: this isn't fool-proof since the corresponding state of the targetClientPokemon
          // may not have initialized fully yet! (e.g., we're p1, transformed Pokemon belongs to p2, but p2 isn't init'd yet)
          // const targetPokemonState = (
          //   AllPlayerKeys.includes(targetPlayerKey)
          //     && battleState[targetPlayerKey].pokemon?.find((p) => (
          //       (!!targetClientPokemon.calcdexId && p?.calcdexId === targetClientPokemon.calcdexId)
          //         || p?.ident === targetClientPokemon.ident
          //     ))
          // ) || null;

          // at this point, we'd know both targetClientPokemon & targetPlayerKey are valid
          if (AllPlayerKeys.includes(targetPlayerKey)) {
            l.debug(
              'Adding revealed info for', targetClientPokemon.ident, 'from transformed', syncedPokemon.ident,
              '\n', 'targetPlayerKey', targetPlayerKey,
              '\n', 'targetClientPokemon', targetClientPokemon,
              // '\n', 'targetPokemonState', targetPokemonState,
              '\n', 'syncedPokemon', syncedPokemon,
              '\n', 'battle', battle,
              '\n', 'battleState', battleState,
            );

            const mutations: DeepPartial<CalcdexPokemon> = {
              calcdexId: targetClientPokemon.calcdexId, // may not exist
              ident: targetClientPokemon.ident, // using this as a fallback
            };

            if (syncedPokemon.ability) {
              // targetPokemonState.ability = syncedPokemon.ability;
              mutations.ability = syncedPokemon.ability;

              // l.debug(
              //   'Set ability of', targetClientPokemon.ident, 'from transformed', syncedPokemon.ident,
              //   '\n', 'ability', syncedPokemon.ability,
              //   '\n', 'mutations', mutations,
              //   '\n', 'targetClientPokemon', targetClientPokemon,
              //   // '\n', 'targetPokemonState', targetPokemonState,
              //   '\n', 'syncedPokemon', syncedPokemon,
              // );
            }

            if (syncedPokemon.transformedMoves.length) {
              // targetPokemonState.revealedMoves = [...syncedPokemon.transformedMoves];
              mutations.revealedMoves = [...syncedPokemon.transformedMoves];

              // if (!targetPokemonState.moves?.length) {
              //   targetPokemonState.moves = [...syncedPokemon.transformedMoves];
              // }

              // l.debug(
              //   'Set revealedMoves of', targetClientPokemon.ident, 'from transformed', syncedPokemon.ident,
              //   '\n', 'revealedMoves', syncedPokemon.transformedMoves,
              //   '\n', 'mutations', mutations,
              //   '\n', 'targetClientPokemon', targetClientPokemon,
              //   // '\n', 'targetPokemonState', targetPokemonState,
              //   '\n', 'syncedPokemon', syncedPokemon,
              // );
            }

            futureMutations[targetPlayerKey].push(mutations);
          } // end targetPokemonState?.speciesForme
        } // end syncedPokemon.serverSourced && syncedPokemon.transformedForme && ...

        // apply any applicable futureMutations
        const pendingMutations = futureMutations[playerKey]?.filter((m) => (
          (!!m?.calcdexId && syncedPokemon.calcdexId === m.calcdexId)
            || (!!m?.ident && syncedPokemon.ident === m.ident)
        )).map(({
          // we're removing calcdexId & ident since we know they're for this Pokemon at this point
          calcdexId, // removed
          ident, // removed
          ...mutations
        }) => ({ ...mutations }));

        if (pendingMutations?.length) {
          pendingMutations.forEach((mutation) => Object.entries(mutation).forEach(([
            key,
            value,
          ]) => {
            syncedPokemon[key] = value;

            if (key === 'ability') {
              syncedPokemon.dirtyAbility = null;
            }

            if (key === 'revealedMoves') {
              syncedPokemon.moves = mergeRevealedMoves(syncedPokemon);
            }
          }));

          l.debug(
            'Applied pendingMutations for', syncedPokemon.ident,
            '\n', 'pendingMutations', pendingMutations,
            '\n', 'futureMutations', futureMutations,
            '\n', 'syncedPokemon', syncedPokemon,
          );
        }

        // extract Gmax/Tera info from the BattleRoom's `request` object, if available
        if (request?.requestType === 'move' && request.side?.id === playerKey) {
          const {
            active,
            side,
          } = request;

          for (let j = 0; j < (active?.length ?? 0); j++) {
            const moveData = active[j];

            const {
              calcdexId: reqCalcdexId, // probably won't have a calcdexId
              ident: reqIdent,
              details: reqDetails,
            } = side.pokemon?.[j] || {};

            const hasGmaxData = !!moveData?.maxMoves?.gigantamax;
            const hasTeraData = !!moveData?.canTerastallize && moveData.canTerastallize !== '???';

            const shouldIgnore = (!hasGmaxData && !hasTeraData)
              || (!reqIdent && !reqDetails)
              || (!!reqCalcdexId && syncedPokemon.calcdexId !== reqCalcdexId)
              || (syncedPokemon.ident !== reqIdent && syncedPokemon.details !== reqDetails);
              // || !syncedPokemon.altFormes.some((f) => f.endsWith('-Gmax'));

            // l.debug(
            //   'Processing move request for', reqIdent || reqDetails,
            //   '\n', 'battleId', battleId,
            //   '\n', 'shouldIgnore?', shouldIgnore,
            //   '\n', 'moveData', moveData,
            //   '\n', 'Gmax?', moveData?.maxMoves?.gigantamax, // ? = partial, i.e., could be null/undefined
            //   '\n', 'Tera?', moveData?.canTerastallize,
            //   '\n', 'sidePokemon', side.pokemon?.[j],
            //   '\n', 'request', request,
            //   '\n', 'battle', battle,
            // );

            if (shouldIgnore) {
              continue;
            }

            if (hasGmaxData) {
              syncedPokemon.dmaxable = true; // if not already
              syncedPokemon.gmaxable = true;

              if (!syncedPokemon.speciesForme.endsWith('-Gmax')) {
                syncedPokemon.speciesForme += '-Gmax';
              }
            }

            if (hasTeraData && syncedPokemon.revealedTeraType !== moveData.canTerastallize) {
              syncedPokemon.revealedTeraType = moveData.canTerastallize;
              syncedPokemon.teraType = syncedPokemon.revealedTeraType;
            }

            break;
          }
        }

        // reset any dirtyBoosts if the user enabled the setting
        const shouldResetDirtyBoosts = settings?.resetDirtyBoosts
          && Object.values(syncedPokemon.dirtyBoosts || {}).some((v) => typeof v === 'number' && !Number.isNaN(v));

        if (shouldResetDirtyBoosts) {
          syncedPokemon.dirtyBoosts = {
            atk: null,
            def: null,
            spa: null,
            spd: null,
            spe: null,
          };
        }

        // reset any additional dirty fields
        if (typeof syncedPokemon.dirtyHp === 'number') {
          syncedPokemon.dirtyHp = null;
        }

        if (typeof syncedPokemon.dirtyStatus === 'string') {
          syncedPokemon.dirtyStatus = null;
        }

        l.debug(
          'Synced Pokemon', syncedPokemon.speciesForme, 'for player', playerKey,
          '\n', 'battleId', battleId,
          '\n', 'slot', i, 'calcdexId', clientPokemon.calcdexId,
          '\n', 'clientPokemon', clientPokemon,
          '\n', 'serverPokemon', serverPokemon,
          '\n', 'syncedPokemon', syncedPokemon,
          '\n', 'pokemonOrder', playerState.pokemonOrder,
          '\n', 'battle', battle,
          '\n', 'battleState', battleState,
        );

        // add the pokemon to the player's Calcdex state (if not maxed already)
        if (!matchedPokemon) {
          // first check if we got Zoroark'd (i.e., Illusion)
          // (this typically only applies for opponent Pokemon in Randoms, where the Pokemon are revealed as they're switched-in;
          // duplicate mimicked Pokemon don't exist for myPokemon and formats like OU, where the entire team is already revealed)
          // see: https://github.com/smogon/pokemon-showdown-client/blob/4e5002411cc80ff8044fd586bd0db2f80979b8f6/src/battle.ts#L747-L808
          if (playerState.pokemon.length >= playerState.maxPokemon || speciesClause) {
            const existingTable: Record<string, number> = {};
            let removalId: string = null;

            const {
              // calcdexId: syncedCalcdexId,
              searchid: syncedSearchId,
            } = syncedPokemon;

            for (let j = 0; j < player.pokemon.length; j++) {
              const pokemon1 = player.pokemon[j];

              const {
                // calcdexId: pokemon1CalcdexId,
                searchid: pokemon1SearchId,
              } = pokemon1 || {};

              if (!pokemon1SearchId) {
                continue;
              }

              if (!(pokemon1SearchId in existingTable)) {
                existingTable[pokemon1SearchId] = j;

                continue;
              }

              const pokemon2Index = existingTable[pokemon1SearchId];
              const pokemon2 = player.pokemon[pokemon2Index];

              const {
                // calcdexId: pokemon2CalcdexId,
                searchid: pokemon2SearchId,
              } = pokemon2 || {};

              if (!pokemon2SearchId) {
                continue;
              }

              if (syncedSearchId === pokemon1SearchId) {
                removalId = pokemon2SearchId;
              } else if (syncedSearchId === pokemon2SearchId) {
                removalId = pokemon1SearchId;
              } else if (player.active.includes(pokemon1)) {
                removalId = pokemon2SearchId;
              } else if (player.active.includes(pokemon2)) {
                removalId = pokemon1SearchId;
              } else if (pokemon1.fainted && !pokemon2.fainted) {
                removalId = pokemon2SearchId;
              } else {
                removalId = pokemon1SearchId;
              }

              break;
            }

            // note: unlike in addPokemon() of Showdown.Side, we don't care about updating the Illusion Pokemon,
            // only removing it so that the real Pokemon can be tracked in the Calcdex
            const removalIndex = playerState.pokemon
              .findIndex((p) => !!p.searchid && p.searchid === removalId);

            const removalPokemon = removalIndex > -1
              ? playerState.pokemon[removalIndex]
              : null;

            if (removalPokemon?.speciesForme) {
              playerState.pokemon.splice(removalIndex, 1);

              l.debug(
                'Removed Illusion Pokemon', removalPokemon.speciesForme, 'for player', playerKey,
                '\n', 'battleId', battleId,
                '\n', 'removalIndex', removalIndex, 'removalId', removalId,
                '\n', 'length', '(prev)', playerState.pokemon.length + 1,
                '(now)', playerState.pokemon.length,
                '(max)', playerState.maxPokemon,
                '\n', 'removalPokemon', removalPokemon,
                '\n', 'clientPokemon', clientPokemon,
                '\n', 'serverPokemon', serverPokemon,
                '\n', 'syncedPokemon', syncedPokemon,
                '\n', 'player.pokemon', player.pokemon,
                '\n', 'playerState.pokemon', playerState.pokemon,
                '\n', 'battle', battle,
                '\n', 'battleState', battleState,
              );
            }
          }

          if (playerState.pokemon.length >= playerState.maxPokemon) {
            if (__DEV__) {
              l.warn(
                'Ignoring', syncedPokemon.speciesForme, 'for player', playerKey,
                'since they have the max number of Pokemon.',
                '\n', 'battleId', battleId,
                '\n', 'calcdexId', clientPokemon.calcdexId,
                '\n', 'length', '(now)', playerState.pokemon.length, '(max)', playerState.maxPokemon,
                '\n', 'clientPokemon', clientPokemon,
                '\n', 'serverPokemon', serverPokemon,
                '\n', 'syncedPokemon', syncedPokemon,
                '\n', 'player.pokemon', player.pokemon,
                '\n', 'playerState.pokemon', playerState.pokemon,
                '\n', 'battle', battle,
                '\n', 'battleState', battleState,
                '\n', '(You will only see this warning on development.)',
              );
            }

            continue;
          }

          // set the initial showGenetics value from the settings if this is serverSourced
          const geneticsKey = playerKey === battleState.authPlayerKey ? 'auth' : playerKey;

          // update (2022/11/14): defaultShowGenetics has been deprecated in favor of lockGeneticsVisibility
          // syncedPokemon.showGenetics = settings?.defaultShowGenetics?.[geneticsKey] ?? true;

          const showBaseStats = settings?.showBaseStats === 'always'
            || (settings?.showBaseStats === 'meta' && !legalLockedFormat(battleState.format));

          // handles 3 cases:
          // (1) user selected all stats, so we should set this to true to initially show all rows, then allow them to be hidden
          // (2) user selected only some stats, so this becomes initially false so PokeStats can show the rows they've selected
          // (3) user selected no stats, so this becomes initially false, then allow them to all be shown
          // (note: hydrator may rehydrate an empty array as `false`, hence why we're checking if the value is an array first!)
          syncedPokemon.showGenetics = Array.isArray(settings?.lockGeneticsVisibility?.[geneticsKey]) && [
            showBaseStats && 'base',
            'iv',
            !detectLegacyGen(battleState.gen) && 'ev',
          ].filter(Boolean).every((
            k: 'base' | 'iv' | 'ev',
          ) => settings.lockGeneticsVisibility[geneticsKey].includes(k));

          playerState.pokemon.push(syncedPokemon);

          // l.debug(
          //   'Added new Pokemon', syncedPokemon.speciesForme, 'to player', playerKey,
          //   '\n', 'battleId', battleId,
          //   '\n', 'calcdexId', clientPokemon.calcdexId,
          //   '\n', 'length', '(now)', playerState.pokemon.length, '(max)', playerState.maxPokemon,
          //   '\n', 'clientPokemon', clientPokemon,
          //   '\n', 'serverPokemon', serverPokemon,
          //   '\n', 'syncedPokemon', syncedPokemon,
          //   '\n', 'playerState.pokemon', playerState.pokemon,
          //   '\n', 'pokemonOrder', playerState.pokemonOrder,
          //   '\n', 'battle', battle,
          //   '\n', 'battleState', battleState,
          // );
        } else {
          playerState.pokemon[matchedPokemonIndex] = syncedPokemon;

          // l.debug(
          //   'Updated existing Pokemon', syncedPokemon.speciesForme,
          //   'at index', matchedPokemonIndex, 'for player', playerKey,
          //   '\n', 'battleId', battleId,
          //   '\n', 'calcdexId', clientPokemon.calcdexId,
          //   '\n', 'clientPokemon', clientPokemon,
          //   '\n', 'serverPokemon', serverPokemon,
          //   '\n', 'syncedPokemon', syncedPokemon,
          //   '\n', 'playerState.pokemon', playerState.pokemon,
          //   '\n', 'pokemonOrder', playerState.pokemonOrder,
          //   '\n', 'battle', battle,
          //   '\n', 'battleState', battleState,
          // );
        }
      }

      // keep track of which calcdexId's we've added so far (for myPokemon in Doubles)
      const processedIds: string[] = [];

      playerState.activeIndices = player.active?.map((activePokemon) => {
        // particularly in FFA, there may be a Pokemon belonging to another player in active[]
        if (!activePokemon || detectPlayerKeyFromPokemon(activePokemon) !== playerKey) {
          return null;
        }

        // checking myPokemon first (if it's available) for Illusion/Zoroark
        const activeId = (
          isMyPokemonSide
            && hasMyPokemon
            // update (2023/07/26): had to update this logic for Supreme Overlord in Doubles;
            // without checking the calcdexId (& solely checking `p.active`), the resulting activeIndices
            // may only include the first active Pokemon in myPokemon[] for this specific case
            // (also, while active[] in Showdown.Side will set the Showdown.Pokemon to `null` if dead, e.g.,
            // [null, { speciesForme: 'Kingambit', ... }], the dead Showdown.ServerPokemon in myPokemon[]
            // will still be `active` !!)
            && myPokemon.find((p) => (
              p?.active
                && p.hp > 0
                && (
                  (!p.calcdexId && !activePokemon.calcdexId)
                    || p.calcdexId === activePokemon.calcdexId
                )
                && !processedIds.includes(p?.calcdexId)
            ))?.calcdexId
        )
          || activePokemon?.calcdexId
          || player.pokemon.find((p) => p === activePokemon)?.calcdexId;

        // update the activeIndex (& the selectionIndex if autoSelect is enabled)
        const activeIndex = activeId
          ? playerState.pokemon.findIndex((p) => p.calcdexId === activeId)
          : -1;

        l.debug(
          'Building activeIndices for player', playerKey,
          '\n', 'activeId', activeId,
          '\n', 'activeIndex', activeIndex,
          '\n', 'activePokemon', activePokemon,
          '\n', 'player.active', player.active,
          '\n', `${playerKey}.pokemon`, playerState.pokemon,
        );

        if (activeIndex > -1 && !processedIds.includes(activeId)) {
          processedIds.push(activeId);

          return activeIndex;
        }

        if (activePokemon && __DEV__) {
          l.warn(
            ...(activeId && processedIds.includes(activeId) ? [
              'Attempted to add existing activeId', activeId, 'for player', playerKey,
              '\n', 'processedIds', processedIds,
            ] : [
              'Could not find activeIndex with activeId', activeId, 'for player', playerKey,
            ]),
            '\n', 'battleId', battleId,
            '\n', 'activePokemon', activePokemon,
            '\n', 'playerPokemon', playerPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
            '\n', 'pokemonOrder', playerState.pokemonOrder,
            '\n', 'battle', battle,
            '\n', 'battleState', battleState,
            '\n', '(You will only see this warning on development.)',
          );
        }

        return null;
      }).filter((n) => typeof n === 'number' && n > -1) || [];

      if (playerState.activeIndices.length) {
        // surprisingly encountered a race-condition with player.faintCounter not being the most up-to-date value,
        // so we'll just count it ourselves LOL
        const faintCounter = playerState.pokemon.filter((p) => !p.hp).length;

        // update the faintCounter from the player side if not active on the field & not fainted
        // OR the Pokemon's current faintCounter is 0 when the battle is inactive (probably from a page reload)
        if (faintCounter > 0) {
          const pendingPokemon = playerState.pokemon.filter((p, i) => (
            // note: Pokemon can have a `/^fallen\d$/` volatile (e.g., `'fallen1'`), which is the server reporting
            // the actual faintCounter essentially, so if present, we'll assume syncPokemon() has already applied it
            !Object.keys(p.volatiles || {})
              .some((k) => k?.startsWith('fallen'))
          ) && (
            (!playerState.activeIndices.includes(i) && p.hp > 0)
              || (!battleState.active && !p.faintCounter)
          ));

          pendingPokemon.forEach((pokemon) => {
            // if the current `pokemon` is dedge & its faintCounter is 0, remove 1 to not include itself
            const reloadOffset = !pokemon.hp && !pokemon.faintCounter ? 1 : 0;

            pokemon.faintCounter = clamp(0, faintCounter - reloadOffset, maxPokemon);

            // auto-clear the dirtyFaintCounter if the user previously set one
            if (typeof pokemon.dirtyFaintCounter === 'number') {
              pokemon.dirtyFaintCounter = null;
            }
          });

          // l.debug(
          //   'Updated faintCounter for some pokemon of player', playerKey,
          //   '\n', 'faintCounter', '(calc)', faintCounter, '(host)', player.faintCounter,
          //   '\n', 'playerState.activeIndices', playerState.activeIndices,
          //   '\n', 'pendingPokemon', pendingPokemon,
          // );
        }

        if (playerState.autoSelect) {
          // check for Dondozo & commanding Tatsugiri in Gen 9, selecting the Dondozo if that's the case
          // (while there is a `commanding` property, it's only available in Showdown.ServerPokemon for some reason)
          // -- though, just in case, I'm specifically not checking if we're in Gen 9, but rather, only the activePokemon
          const activePokemon = playerState.pokemon.filter((_, i) => playerState.activeIndices.includes(i));

          // note: since this happens during sync, we don't care about Tatsugiri's dirtyAbility
          // (Commander should be revealed in-battle)
          // also, using startsWith() here since Tatsugiri has cosmetic formes, like Tatsugiri-Stretchy lol
          const selectTatsugiri = activePokemon?.length > 1
            && !!activePokemon.find((p) => p.speciesForme.startsWith('Dondozo'))
            && activePokemon.find((p) => p.speciesForme.startsWith('Tatsugiri'))?.ability === 'Commander';

          if (selectTatsugiri) {
            const dondozoIndex = playerState.pokemon.findIndex((p) => p.speciesForme.startsWith('Dondozo'));

            if (dondozoIndex > -1) {
              playerState.selectionIndex = dondozoIndex;
            }
          } else if (!playerState.activeIndices.includes(playerState.selectionIndex)) {
            // update (2023/01/30): only update the selectionIndex if it's not one of the activeIndices
            [playerState.selectionIndex] = playerState.activeIndices;
          }
        }
      }

      // determine if the player used Max/Tera to disable it within PokeMoves
      // (will be re-enabled once the battle is over)
      playerState.usedMax = usedDynamax(playerKey, battle?.stepQueue);
      playerState.usedTera = usedTerastallization(playerKey, battle?.stepQueue);

      // resync Max (gen 8)/Tera (gen 9) states
      // note: while syncPokemon() will reset the values, this only occurs when a client Pokemon has been found,
      // i.e., if the Pokemon isn't revealed yet (such as in Randoms), there would be no corresponding client Pokemon
      if (battleState.gen > 7) {
        // note: despite using filter(), which would normally create a new array, the elements inside of pokemon[]
        // are objects, so elements in the filtered array are still referencing the original objects
        playerState.pokemon
          .filter((p) => p.useMax && !('dynamax' in p.volatiles))
          .forEach((p) => { p.useMax = false; });
      }

      if (battleState.gen > 8) {
        // find the name of the Pokemon that Terastallized
        const teraStep = battle.stepQueue.find((q) => q.startsWith('|-terastallize|') && q.includes(`|${playerKey}`));
        const [, name] = /p\d+[a-z]:\x20(.+)\|/.exec(teraStep) || [];

        // if we found a name (e.g., 'p2a: Walking Wake' -> name = 'Walking Wake'), then toggle off
        // `terastallized` for any *other* *Terastallized* Pokemon (not the one referenced in `name`)
        // (note: `name` is not guaranteed to be the species forme since it also could be a given nickname!)
        // (also, multiple Terastallized Pokemon could exist when the user manually toggles them on,
        // but probably will forget to turn it off, so that's where this bit comes in)
        if (name) {
          // see note in playerState.usedMax for why this still mutates the pokemon `p`, despite using filter()
          playerState.pokemon
            .filter((p) => p.terastallized && !p.name.includes(name) && !p.speciesForme.includes(name))
            .forEach((p) => { p.terastallized = false; });
        }
      }

      // update Ruin abilities (gen 9), if any, before syncing the field
      if (battleState.gen > 8) {
        toggleRuinAbilities(
          playerState,
          null,
          battleState.field?.gameType,
          true, // update the selected Pokemon's abilityToggled value too
        );
      }

      // sync player side
      if (playerState.active) {
        // sync the sideConditions from the battle
        // (this is first so that it'll be available in sanitizePlayerSide(), just in case)
        // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
        // playerState.side.conditions = structuredClone(player.sideConditions || {});
        playerState.side.conditions = clonePlayerSideConditions(player);

        playerState.side = {
          conditions: playerState.side.conditions,
          ...sanitizePlayerSide(
            battleState.gen,
            playerState,
            battle[playerKey],
          ),
        };
      }
    }

    // now that all players were processed, recount the number of players
    // (typically required for FFA, when players 3 & 4 need to be invited, so the playerCount never updates)
    battleState.playerCount = countActivePlayers(battleState);

    const syncedField = syncField(
      battleState,
      battle,
    );

    if (!syncedField?.gameType) {
      if (__DEV__) {
        l.warn(
          'Failed to sync the field state from the battle.',
          '\n', 'syncedField', syncedField,
          '\n', 'battleState.field', battleState.field,
          // '\n', 'attackerIndex', battleState.p1.activeIndex, 'defenderIndex', battleState.p2.activeIndex,
          '\n', 'battle', battle,
          '\n', 'battleState', battleState,
          '\n', '(You will only see this warning on development.)',
        );
      }

      // return;
    } else {
      battleState.field = syncedField;
    }

    // this is important, otherwise we can't ignore re-renders of the same battle state
    // (which may result in reaching React's maximum update depth)
    if (battleNonce) {
      battleState.battleNonce = battleNonce;
    }

    endTimer();

    l.debug(
      'Dispatching synced battleState for', battleState.battleId || '???',
      '\n', 'battle', battle,
      '\n', 'state', battleState,
    );

    return battleState;
  },
);
