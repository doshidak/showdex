import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  type AbilityName,
  type GenerationNum,
  type ItemName,
  type MoveName,
  type Terrain,
  type Weather,
} from '@smogon/calc';
import { PokemonBoosterAbilities } from '@showdex/consts/dex';
import {
  type CalcdexBattleState,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { type RootState } from '@showdex/redux/store';
import {
  cloneBattleState,
  clonePlayerSideConditions,
  countActivePlayers,
  detectAuthPlayerKeyFromBattle,
  detectBattleRules,
  detectPlayerKeyFromBattle,
  detectPlayerKeyFromPokemon,
  detectPokemonDetails,
  detectToggledAbility,
  mapAutoBoosts,
  mapStellarMoves,
  mergeRevealedMoves,
  parsePokemonDetails,
  sanitizePlayerSide,
  sanitizePokemon,
  sanitizeVolatiles,
  similarPokemon,
  toggleRuinAbilities,
  usedDynamax,
  usedTerastallization,
} from '@showdex/utils/battle';
import { calcCalcdexId, calcPokemonCalcdexId } from '@showdex/utils/calc';
import {
  clamp,
  diffArrays,
  env,
  formatId,
} from '@showdex/utils/core';
import { detectLegacyGen, legalLockedFormat } from '@showdex/utils/dex';
import { logger, runtimer } from '@showdex/utils/debug';
import { getAuthUsername } from '@showdex/utils/host';
import {
  flattenAlts,
  getPresetFormes,
  getTeamSheetPresets,
  // selectPokemonPresets,
} from '@showdex/utils/presets';
import { syncField } from './syncField';
import { syncPokemon } from './syncPokemon';

export interface SyncBattlePayload {
  battle: Showdown.Battle;
  request?: Showdown.BattleRequest;
}

export const SyncBattleActionType = 'calcdex:sync' as const;

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
    const showdownSettings = rootState?.showdex?.settings?.showdown;
    const state = rootState?.calcdex;

    // moved from calcdexSlice since the syncBattle.pending case does not provide the payload
    // l.debug(
    //   'RECV', SyncBattleActionType, 'for', battle?.id || '(missing battle.id)',
    //   '\n', 'payload', payload,
    //   '\n', 'settings', settings,
    //   '\n', 'state', state,
    // );

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
          'Skipping this round of syncing due to same nonce from before',
          '\n', 'nonce', battleNonce,
          '\n', 'battle', battleId, battle,
          '\n', 'state', battleState,
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
    battleState.rules = detectBattleRules(battle);

    // update the battle's active state, but only allow it to go from true -> false
    // as to avoid updating the HellodexBattleRecord from replays and battle re-inits)
    if (battleState.active && typeof ended === 'boolean' && ended) {
      battleState.active = !ended;
    }

    // check if the user hit the replay button
    // (we'll use this value later to reset the Pokemon back to full health, kinda like a Pokemon Center,
    // but not as exciting when you realize it's just `pokemon.hp = pokemon.maxhp` lol)
    const startedReplay = !battleState.active
      && battleState.turn > 1
      && !turn;

    // update the current turn number
    battleState.turn = turn || 0;

    // update the authPlayerKey (if any)
    battleState.authPlayerKey = detectAuthPlayerKeyFromBattle(battle);

    // determine if we should auto-accept any active OTS request
    const authUsername = getAuthUsername();

    const sheetsRequested = !!battleState.authPlayerKey
      && stepQueue?.some((q) => q?.includes('|uhtml|otsrequest'))
      && stepQueue.some((q) => q?.includes('acceptopenteamsheets'));

    const sheetsAccepted = sheetsRequested
      && !!authUsername
      && (
        battle.calcdexSheetsAccepted
          || stepQueue.some((q) => q?.includes(`${authUsername} has agreed`))
      );

    const shouldAcceptSheets = sheetsRequested
      && !sheetsAccepted
      && showdownSettings?.autoAcceptSheets;

    if (shouldAcceptSheets) {
      l.debug(
        'Auto-accepting detected OTS request for', authUsername,
        '\n', 'battle', battleId, battle,
        '\n', 'state', state,
      );

      // this is essentially the command that gets run when you click on the SSR'd button
      app.send('/acceptopenteamsheets', battleId);
      battle.calcdexSheetsAccepted = true;
    }

    // find out which side myPokemon belongs to
    const detectedPlayerKey = battleState.authPlayerKey || detectPlayerKeyFromBattle(battle);

    if (detectedPlayerKey && !battleState.playerKey) {
      battleState.playerKey = detectedPlayerKey;
    }

    if (!battleState.opponentKey) {
      battleState.opponentKey = battleState.playerKey === 'p2' ? 'p1' : 'p2';
    }

    // update the sidesSwitched from the battle
    battleState.switchPlayers = battle.viewpointSwitched ?? battle.sidesSwitched;

    // sync the field first cause we'll need the updated values for some calculations later
    const syncedField = syncField(
      battleState,
      battle,
    );

    if (!syncedField) {
      if (__DEV__) {
        l.warn(
          'Failed to sync the field state from the battle',
          '\n', 'synced', syncedField,
          '\n', 'field', '(state)', battleState.field,
          '\n', 'battle', battleId, battle,
          '\n', 'state', battleState,
          '\n', '(You will only see this warning on development.)',
        );
      }

      // return;
    } else {
      battleState.field = syncedField;
    }

    // determine if we should include Teambuilder presets
    // (should be already pre-converted in the teamdexSlice)
    // const teambuilderPresets = (
    //   !!settings?.includeTeambuilder
    //     && settings.includeTeambuilder !== 'never'
    //     && !battleState.format.includes('random')
    //     && rootState?.teamdex?.presets?.filter((p) => p?.gen === battleState.gen)
    // ) || [];

    // determine if we should look for team sheets
    const sheetStepQueues = (
      !!settings?.autoImportTeamSheets
        && battle.stepQueue?.filter((q) => (
          (q.startsWith('|c|') && q.includes('/raw'))
            || q.startsWith('|uhtml|ots|')
            || (q.includes('|raw|') && q.includes('infobox'))
            || (q.includes('|showteam|'))
        ))
    ) || [];

    const sheetsNonce = sheetStepQueues.length
      ? calcCalcdexId(sheetStepQueues.join(';'))
      : null;

    // l.debug(
    //   '\n', 'sheetsNonce', sheetsNonce,
    //   '\n', 'sheetStepQueues', sheetStepQueues,
    //   '\n', 'stepQueue', battle.stepQueue,
    // );

    if (sheetsNonce && battleState.sheetsNonce !== sheetsNonce) {
      const playerNames = AllPlayerKeys.reduce((prev, key) => {
        const { name: playerName } = battle[key] || {};

        if (!playerName) {
          return prev;
        }

        prev[key] = playerName;

        return prev;
      }, {} as Partial<Record<CalcdexPlayerKey, string>>);

      battleState.sheetsNonce = sheetsNonce;
      battleState.sheets = sheetStepQueues.flatMap((sheetStepQueue) => getTeamSheetPresets(
        battleState.format,
        sheetStepQueue,
        playerNames,
      ));
    }

    // keep track of CalcdexPokemon mutations from one player to another
    // (e.g., revealed properties of the transform target Pokemon from the current player's transformed Pokemon)
    const futureMutations = AllPlayerKeys.reduce<Record<CalcdexPlayerKey, Partial<CalcdexPokemon>[]>>((prev, key) => {
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
        //     'Ignoring updates for player', playerKey, 'since they don\'t exist in the battle state',
        //     '\n', 'battle', battleId, battle,
        //     '\n', 'state', battleState,
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
      //   'Updated name to', playerState.name, '& rating to', playerState.rating || '(unrated)', 'for player', playerKey,
      //   '\n', 'player', '(battle)' player,
      //   '\n', 'player', '(state)', playerState,
      //   '\n', 'battle', battleId, battle,
      //   '\n', 'state', battleState,
      // );

      if (!Array.isArray(player.pokemon) || !player.pokemon.length) {
        if (__DEV__) {
          l.warn(
            'Ignoring Pokemon updates for', playerKey, 'since they don\'t have any pokemon.',
            '\n', 'pokemon', '(battle)', player.pokemon,
            '\n', 'pokemon', '(state)', playerState.pokemon,
            '\n', 'battle', battleId, battle,
            '\n', 'state', battleState,
            '\n', '(You will only see this warning on development.)',
          );
        }

        // reset this Pokemon back to full if this is the first turn of the replay
        // (should only happen once per replay, during this specific edge case)
        if (!startedReplay) {
          continue;
        }

        playerState.pokemon.forEach((pokemon) => {
          pokemon.hp = pokemon.maxhp;
          pokemon.dirtyHp = null;
          pokemon.fainted = false;
          pokemon.faintCounter = 0;
          pokemon.dirtyFaintCounter = null;
          pokemon.hitCounter = 0;
          pokemon.status = null;
          pokemon.dirtyStatus = null;

          if (pokemon.ability) {
            pokemon.dirtyAbility = null;
          }

          if (pokemon.item && !pokemon.prevItem) {
            pokemon.dirtyItem = null;
          }

          if (!pokemon.item && pokemon.prevItem) {
            pokemon.item = pokemon.prevItem;
            pokemon.prevItem = null;
            pokemon.prevItemEffect = null;
          }
        });

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

      const hasMyPokemon = !!myPokemon?.length;

      // if we're in an active battle and the logged-in user is also a player,
      // but did not receieve myPokemon from the server yet, don't process any Pokemon!
      // (we need the calcdexId to be assigned to myPokemon first, then mapped to the clientPokemon)
      const initialPokemon = (
        battleState.active
          && isMyPokemonSide
          && battleState.authPlayerKey === playerKey
          ? myPokemon
          : player.pokemon
      ) || [];

      const currentOrder = initialPokemon.map((
        pokemon: Showdown.ServerPokemon | Showdown.Pokemon,
      ) => {
        const clientSourced = 'getIdent' in pokemon;

        // l.debug(
        //   'Ordering', pokemon.speciesForme, 'for player', playerKey,
        //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        //   '\n', clientSourced ? 'client' : 'server', pokemon.calcdexId, pokemon,
        //   '\n', 'battle', battleId, battle,
        //   '\n', 'state', battleState,
        // );

        if (!pokemon.calcdexId) {
          // update (2022/10/18): found a case where the client Pokemon was given before
          // the ServerPokemon for the myPokemon side rip lol
          pokemon.calcdexId = (
            isMyPokemonSide
              && !!pokemon.details // update (2023/07/27): might be guaranteed to exist actually :o
              && player.pokemon.find((p) => (
                !!p?.calcdexId
                  && !!p.details
                  && similarPokemon(pokemon, p, {
                    format: battleState.format,
                    normalizeFormes: 'fucked',
                    // ignoreMega: true,
                  })
              ))?.calcdexId
          ) || calcPokemonCalcdexId(pokemon, playerKey);

          l.debug(
            'Assigned calcdexId to the', clientSourced ? 'client' : 'server', pokemon.speciesForme, 'for player', playerKey,
            '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
            // '\n', 'details', '(detected)', details,
            '\n', clientSourced ? 'client' : 'server', pokemon.calcdexId, pokemon,
            '\n', 'battle', battleId, battle,
            '\n', 'state', battleState,
          );
        }

        if (isMyPokemonSide && hasMyPokemon && !clientSourced) {
          const clientPokemon = player.pokemon
            .find((p) => !p.calcdexId && !!p.details && (
              similarPokemon(pokemon, p, {
                format: battleState.format,
                normalizeFormes: 'fucked',
                // ignoreMega: true,
              })
            ));

          if (clientPokemon) {
            clientPokemon.calcdexId = pokemon.calcdexId;

            // l.debug(
            //   'Assigned calcdexId to the server', pokemon.speciesForme,
            //   'from a matching client', clientPokemon.speciesForme, 'for player', playerKey,
            //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
            //   '\n', 'client', clientPokemon.calcdexId, clientPokemon,
            //   '\n', 'server', pokemon.calcdexId, pokemon,
            //   '\n', 'battle', battleId, battle,
            //   '\n', 'state', battleState,
            // );
          }
        }

        return pokemon.calcdexId;
      });

      // reconstruct a full list of the current player's Pokemon, whether revealed or not
      // (but if we don't have the relevant info [i.e., !isMyPokemonSide], then just access the player's `pokemon`)
      const playerPokemon = currentOrder.map((calcdexId) => {
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
        } as Partial<Showdown.Pokemon>;
      });

      // check if we got Zoroark'd right off the bat
      // (covering the case where you replay an old battle, so the full battle state is available)
      // update (2023/10/18): bad idea actually; this might remove the actual Pokemon from syncing if an Illusion of it
      // (aka our boi Zoroark) was out on the field first
      /*
      if (playerPokemon.length > maxPokemon) {
        const existingDetails: string[] = [];

        const removalIndices: number[] = playerPokemon.map((pokemon, i) => {
          // note: purposefully not passing in the level here cause of formats like Randoms & LC,
          // so a 'Cinderace, L77, M' & 'Cinderace, L84, M' would go undetected !! :o
          // (we want something like 'Cinderace, M' & 'Cinderace, M', respectively, instead)
          const details = detectPokemonDetails(pokemon, {
            format: battleState.format,
            ignoreLevel: true,
          });

          if (!details || !existingDetails.includes(details)) {
            if (details) {
              existingDetails.push(details);
            }

            return null;
          }

          // just double-checking the indices line-up lol
          if (currentOrder[i] !== pokemon.calcdexId) {
            return null;
          }

          return i;
        }).filter((v) => typeof v === 'number');

        // l.debug(
        //   'Detected', removalIndices.length, '(probably) Illusion Pokemon', 'from player', playerKey,
        //   '\n', 'existingDetails', existingDetails,
        //   '\n', 'removalIndices', removalIndices,
        //   '\n', 'pokemon', '(built)', playerPokemon,
        //   '\n', 'order', '(current)', currentOrder,
        //   '\n', 'battle', battleId, battle,
        //   '\n', 'state', battleState,
        // );

        if (removalIndices.length) {
          removalIndices.forEach((index) => {
            currentOrder.splice(index, 1);
            playerPokemon.splice(index, 1);
          });

          // l.debug(
          //   'Removed', removalIndices.length, '(probably) Illusion Pokemon', 'from player', playerKey,
          //   '\n', 'existingDetails', existingDetails,
          //   '\n', 'removalIndices', removalIndices,
          //   '\n', 'pokemon', '(built)', playerPokemon,
          //   '\n', 'order', '(now)', currentOrder,
          //   '\n', 'battle', battleId, battle,
          //   '\n', 'state', battleState,
          // );
        }
      }
      */

      if (diffArrays(currentOrder, playerState.pokemonOrder || []).length) {
        playerState.pokemonOrder = currentOrder;

        // l.debug(
        //   'Set Pokemon ordering for player', playerKey,
        //   '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        //   '\n', 'order', playerState.pokemonOrder,
        //   '\n', 'pokemon', '(initial)', initialPokemon,
        //   '\n', 'battle', battleId, battle,
        //   '\n', 'state', battleState,
        // );
      }

      l.debug(
        'Preparing to process', playerPokemon.length, 'of', '(max)', maxPokemon, 'Pokemon',
        'for player', playerKey,
        '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        '\n', 'order', playerState.pokemonOrder,
        '\n', 'pokemon', '(built)', playerPokemon,
        '\n', 'pokemon', '(battle)', player.pokemon,
        '\n', 'battle', battleId, battle,
        '\n', 'state', battleState,
      );

      // update each pokemon
      // (note that the index `i` should be relatively consistent between turns)
      for (let i = 0; i < playerPokemon.length; i++) {
        const clientPokemon = playerPokemon[i];

        if (!clientPokemon?.calcdexId) {
          l.debug(
            'Ignoring untagged Pokemon w/o calcdexId for player', playerKey, 'at index', i,
            '\n', 'client', clientPokemon?.calcdexId, clientPokemon,
            '\n', 'order', playerState.pokemonOrder,
            '\n', 'pokemon', '(built)', playerPokemon,
            '\n', 'pokemon', '(battle)', player.pokemon,
            '\n', 'battle', battleId, battle,
            '\n', 'state', battleState,
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
        );

        // in case the volatiles aren't sanitized yet lol
        if ('transform' in basePokemon.volatiles && typeof basePokemon.volatiles.transform[1] !== 'string') {
          basePokemon.volatiles = sanitizeVolatiles(basePokemon);
        }

        // and then from here on out, we just directly modify syncedPokemon
        // (serverPokemon and dex are optional, which will add additional known properties)
        // update (2023/10/13): syncPokemon() still handles server field populations like serverMoves[],
        // but the teambuilderPresets & serverStats guessing routines have been moved to useAutoPresets()
        const syncedPokemon = syncPokemon(basePokemon, {
          format: battleState.format,
          // gameType: battleState.gameType,
          clientPokemon,
          serverPokemon,
          weather: syncedField.weather,
          terrain: syncedField.terrain,
          // state: battleState,
          // teambuilderPresets,

          autoMoves: (!isMyPokemonSide || !hasMyPokemon)
            // update (2023/02/03): defaultAutoMoves.auth is always false since we'd normally have myPokemon,
            // but in cases of old replays, myPokemon won't be available, so we'd want to respect the user's setting
            // using the playerKey instead of 'auth'
            && settings?.defaultAutoMoves[battleState.authPlayerKey === playerKey && hasMyPokemon ? 'auth' : playerKey],

          // for Randoms, if downloads are enabled, we'll want to wait for the React.useEffect() hook that auto-applies
          // the preset to look for the matching role preset from the serverMoves[] & serverStats
          // disableGuessing: battleState.format.includes('random') && settings?.downloadRandomsPresets,
        });

        // update (2023/10/18): not really using `slot` at all, so yolo ?
        syncedPokemon.slot = i;

        // update the syncedPokemon's playerKey, if falsy or mismatched
        if (!syncedPokemon.playerKey || syncedPokemon.playerKey !== playerKey) {
          syncedPokemon.playerKey = playerKey;
        }

        // attach Teambuilder presets for the specific Pokemon, if available
        // (this should only happen once per battle)
        /*
        const shouldAddTeambuilder = !!teambuilderPresets.length
          && !syncedPokemon.presets.some((p) => ['storage', 'storage-box'].includes(p.source));

        if (shouldAddTeambuilder) {
          // const matchedPresets = teambuilderPresets.filter((p) => (
          //   formes.includes(p.speciesForme) && (
          //     settings.includeTeambuilder === 'always'
          //       || (settings.includeTeambuilder === 'teams' && p.source === 'storage')
          //       || (settings.includeTeambuilder === 'boxes' && p.source === 'storage-box')
          //       || syncedPokemon.presetId === p.calcdexId
          //   )
          // ));

          // update: (2023/11/15): since the guessing is now done in useCalcdexPresets(), we can't include guessed
          // matches from omitted Teambuilder presets (depending on the user's setting) as the guessing happens *after*
          // the Teambuilder presets are added !! (in other words, oh well rip)
          const matchedPresets = [
            ...(settings.includeTeambuilder !== 'boxes' ? selectPokemonPresets(
              teambuilderPresets,
              syncedPokemon,
              {
                format: battleState.format,
                source: 'storage',
                // ignoreSource: true,
                // include the matched Teambuilder team if includeTeambuilder is 'boxes'
                // filter: (p) => (
                //   settings.includeTeambuilder !== 'boxes'
                //     || p.calcdexId === syncedPokemon.presetId
                // ),
              },
            ) : []),

            ...(settings.includeTeambuilder !== 'teams' ? selectPokemonPresets(
              teambuilderPresets,
              syncedPokemon,
              {
                format: battleState.format,
                source: 'storage-box',
                // ignoreSource: true,
                // include the matched Teambuilder box if includeTeambuilder is 'teams'
                // filter: (p) => (
                //   settings.includeTeambuilder !== 'teams'
                //     || p.calcdexId === syncedPokemon.presetId
                // ),
              },
            ) : []),
          ];

          if (matchedPresets.length) {
            syncedPokemon.presets.push(...matchedPresets);
          }
        }
        */

        // if the Pokemon is transformed, see which one it's transformed as
        if (syncedPokemon.transformedForme && clientPokemon?.volatiles?.transform?.length) {
          // since we sanitized the volatiles earlier, we actually need the pointer to the target Pokemon
          // from the original Showdown.Pokemon (i.e., the clientPokemon) to retrieve its ident
          const targetClientPokemon = clientPokemon.volatiles.transform[1] as unknown as Showdown.Pokemon;

          const targetPlayerKey = (
            !!targetClientPokemon?.ident
              && detectPlayerKeyFromPokemon(targetClientPokemon)
          ) || null;

          const mutations: Partial<CalcdexPokemon> = {
            calcdexId: targetClientPokemon.calcdexId, // may not exist
            ident: targetClientPokemon.ident, // using this as a fallback
          };

          // if the Pokemon is also server-sourced, we can apply some known info as revealed info of the target Pokemon
          if (syncedPokemon.source === 'server' && AllPlayerKeys.includes(targetPlayerKey)) {
            l.debug(
              'Adding revealed info to', targetClientPokemon.speciesForme, 'of player', targetPlayerKey,
              'from transformed', syncedPokemon.speciesForme, 'of player', playerKey,
              '\n', 'target', targetClientPokemon.calcdexId, targetClientPokemon,
              '\n', 'synced', syncedPokemon.calcdexId, syncedPokemon,
              '\n', 'battle', battleId, battle,
              '\n', 'state', battleState,
            );

            if (syncedPokemon.ability) {
              // targetPokemonState.ability = syncedPokemon.ability;
              mutations.ability = syncedPokemon.ability;
            }

            if (syncedPokemon.transformedMoves.length) {
              // targetPokemonState.revealedMoves = [...syncedPokemon.transformedMoves];
              mutations.revealedMoves = [...syncedPokemon.transformedMoves];

              // if (!targetPokemonState.moves?.length) {
              //   targetPokemonState.moves = [...syncedPokemon.transformedMoves];
              // }
            }
          }

          // if the target Pokemon has any presets[], copy them over to the transformed Pokemon
          // (this would typically only apply to 'sheet'/'import'-sourced presets)
          // (also note: this doesn't affect futureMutations at all, pretty much hijacking this if-statement,
          // which makes you a bad programmer for increasing the code's spaghetti... or a badass one for optimizing hehehe)
          const syncedPokemonPresetIds = syncedPokemon.presets.map((p) => p.calcdexId);
          const targetPokemonPresets = !!mutations.calcdexId
            && battleState[targetPlayerKey]?.pokemon?.find((p) => p.calcdexId === mutations.calcdexId)?.presets
              ?.filter((p) => !syncedPokemonPresetIds.includes(p.calcdexId));

          if (targetPokemonPresets?.length) {
            syncedPokemon.presets.push(...targetPokemonPresets);
          }

          // the `2` includes the initial calcdexId & ident properties earlier
          // (so if we only have 2 still, then we know there aren't any mutations to add to futureMutations)
          if (Object.keys(mutations).length > 2) {
            futureMutations[targetPlayerKey].push(mutations);
          }
        } // end syncedPokemon.transformedForme && ...

        // if the Pokemon isn't transformed, yeet any of its presets[] that don't belong to it
        // (possibly added from when it was transformed)
        const checkTransformedPresets = !!syncedPokemon.presets.length
          && !syncedPokemon.transformedForme
          && (
            (syncedPokemon.dirtyAbility || syncedPokemon.ability) === 'Imposter' as AbilityName
              || syncedPokemon.moves.includes('Transform' as MoveName)
          );

        if (checkTransformedPresets) {
          const validFormes = getPresetFormes(syncedPokemon.speciesForme, {
            format: battleState.format,
            source: 'server', // this is to get presets of all of the possible formes for the speciesForme
          });

          syncedPokemon.presets = syncedPokemon.presets.filter((p) => (
            validFormes.includes(p.speciesForme)
              && (!p.playerName || formatId(p.playerName) === formatId(playerState.name))
          ));
        }

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

          // l.debug(
          //   'Applied pendingMutations for', syncedPokemon.ident,
          //   '\n', 'pendingMutations', pendingMutations,
          //   '\n', 'futureMutations', futureMutations,
          //   '\n', 'syncedPokemon', syncedPokemon,
          // );
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

            // l.debug(
            //   'Processing move request for', reqIdent || reqDetails,
            //   '\n', 'shouldIgnore?', shouldIgnore,
            //   '\n', 'moveData', moveData,
            //   '\n', 'Gmax?', moveData?.maxMoves?.gigantamax, // ? = partial, i.e., could be null/undefined
            //   '\n', 'Tera?', moveData?.canTerastallize,
            //   '\n', 'client', side.pokemon?.[j],
            //   '\n', 'request', request,
            //   '\n', 'battle', battleId, battle,
            //   '\n', 'state', battleState,
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

            if (hasTeraData && syncedPokemon.teraType !== moveData.canTerastallize) {
              syncedPokemon.teraType = moveData.canTerastallize;
              syncedPokemon.dirtyTeraType = null;
            }

            break;
          }
        }

        // reset any dirtyBoosts if the user enabled the setting
        const shouldResetDirtyBoosts = settings?.resetDirtyBoosts
          && Object.values(syncedPokemon.dirtyBoosts || {})
            .some((v) => typeof v === 'number' && !Number.isNaN(v));

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

        // if revealed to have a Stellar teraType, update the stellarMoveMap for the Stellar STAB mechanic
        if (syncedPokemon.teraType === 'Stellar') {
          syncedPokemon.stellarMoveMap = mapStellarMoves(syncedPokemon, battle.stepQueue, {
            format: battleState.format,
            field: syncedField,
          });
        }

        // l.debug(
        //   'Synced', syncedPokemon.speciesForme, 'for player', playerKey,
        //   '\n', 'synced', syncedPokemon.calcdexId, syncedPokemon,
        //   '\n', 'client', clientPokemon.calcdexId, clientPokemon,
        //   '\n', 'server', serverPokemon?.calcdexId, serverPokemon,
        //   '\n', 'order', playerState.pokemonOrder,
        //   '\n', 'battle', battleId, battle,
        //   '\n', 'state', battleState,
        // );

        // add the pokemon to the player's Calcdex state (if not maxed already)
        if (!matchedPokemon) {
          // first check if we got Zoroark'd (i.e., Illusion)
          // (this typically only applies for opponent Pokemon in Randoms, where the Pokemon are revealed as they're switched-in;
          // duplicate mimicked Pokemon don't exist for myPokemon and formats like OU, where the entire team is already revealed)
          // see: https://github.com/smogon/pokemon-showdown-client/blob/4e5002411cc80ff8044fd586bd0db2f80979b8f6/src/battle.ts#L747-L808
          if (playerState.pokemon.length >= playerState.maxPokemon || speciesClause) {
            const existingTable: Record<string, number> = {};
            let removalId: string = null;

            // update (2023/10/08): if not level 100, the searchid will include the level (e.g., 'p1: Zikachu|Zoroark, L84, M'),
            // which is commonly a thing in Randoms, where Zoroark also runs rampant lmao
            // const {
            //   calcdexId: syncedId,
            //   // searchid: syncedSearchId,
            // } = syncedPokemon;

            // note: purposefully ignoring level here
            // update (2023/10/18): doing so might be yeeting
            const syncedId = detectPokemonDetails(syncedPokemon, {
              format: battleState.format,
              normalizeForme: true,
              // ignoreLevel: true,
            });

            for (let j = 0; j < player.pokemon.length; j++) {
              const pokemonA = player.pokemon[j];

              // const {
              //   calcdexId: idA,
              //   // searchid: pokemon1SearchId,
              // } = pokemonA || {};

              const idA = detectPokemonDetails(pokemonA, {
                format: battleState.format,
                normalizeForme: true,
                // ignoreLevel: true,
              });

              if (!idA || !(idA in existingTable)) {
                if (idA) {
                  existingTable[idA] = j;
                }

                continue;
              }

              const indexB = existingTable[idA];
              const pokemonB = player.pokemon[indexB];

              // const {
              //   calcdexId: idB,
              //   // searchid: pokemon2SearchId,
              // } = pokemonB || {};

              const idB = detectPokemonDetails(pokemonB, {
                format: battleState.format,
                normalizeForme: true,
                // ignoreLevel: true,
              });

              if (!idB) {
                continue;
              }

              // if (syncedSearchId === pokemon1SearchId) {
              //   removalId = pokemon2SearchId;
              // } else if (syncedSearchId === pokemon2SearchId) {
              //   removalId = pokemon1SearchId;
              // } else if (player.active.includes(pokemon1)) {
              //   removalId = pokemon2SearchId;
              // } else if (player.active.includes(pokemon2)) {
              //   removalId = pokemon1SearchId;
              // } else if (pokemon1.fainted && !pokemon2.fainted) {
              //   removalId = pokemon2SearchId;
              // } else {
              //   removalId = pokemon1SearchId;
              // }

              // check if we should remove pokemonB
              const targetB = syncedId === idA
                || player.active.includes(pokemonA)
                || (!pokemonA.hp && (pokemonB.hp || 0) > 0);

              removalId = targetB ? idB : idA;

              break;
            }

            // note: unlike in addPokemon() of Showdown.Side, we don't care about updating the Illusion Pokemon,
            // only removing it so that the real Pokemon can be tracked in the Calcdex
            const removalIndex = playerState.pokemon
              .findIndex((p) => detectPokemonDetails(p, {
                format: battleState.format,
                normalizeForme: true,
                ignoreLevel: true,
              }) === removalId);

            const removalPokemon = removalIndex > -1
              ? playerState.pokemon[removalIndex]
              : null;

            if (removalPokemon?.speciesForme) {
              playerState.pokemon.splice(removalIndex, 1);

              l.debug(
                'Removed Illusory', removalPokemon.speciesForme, 'from player', playerKey,
                '\n', 'length', '(prev)', playerState.pokemon.length + 1,
                '(now)', playerState.pokemon.length,
                '(max)', playerState.maxPokemon,
                '\n', 'removalIndex', removalIndex, 'removalId', removalId,
                '\n', 'removal', removalPokemon.calcdexId, removalPokemon,
                '\n', 'synced', syncedPokemon.calcdexId, syncedPokemon,
                '\n', 'client', clientPokemon.calcdexId, clientPokemon,
                '\n', 'server', serverPokemon?.calcdexId, serverPokemon,
                '\n', 'pokemon', '(battle)', player.pokemon,
                '\n', 'pokemon', '(state)', playerState.pokemon,
                '\n', 'battle', battleId, battle,
                '\n', 'state', battleState,
              );
            }
          }

          if (playerState.pokemon.length >= playerState.maxPokemon) {
            if (__DEV__) {
              l.warn(
                'Ignoring', syncedPokemon.speciesForme, 'for player', playerKey,
                'since they have the max number of Pokemon',
                '\n', 'length', '(now)', playerState.pokemon.length, '(max)', playerState.maxPokemon,
                '\n', 'synced', syncedPokemon.calcdexId, syncedPokemon,
                '\n', 'client', clientPokemon.calcdexId, clientPokemon,
                '\n', 'server', serverPokemon?.calcdexId, serverPokemon,
                '\n', 'pokemon', '(battle)', player.pokemon,
                '\n', 'pokemon', '(state)', playerState.pokemon,
                '\n', 'battle', battleId, battle,
                '\n', 'state', battleState,
                '\n', '(You will only see this warning on development.)',
              );
            }

            continue;
          }

          // note: this won't do anything if the Pokemon has no spreads available
          syncedPokemon.showPresetSpreads = settings?.showSpreadsFirst || false;

          // set the initial showGenetics value from the settings if this is server-sourced
          const geneticsKey = playerKey === battleState.authPlayerKey ? 'auth' : playerKey;
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

          const size = playerState.pokemon.push(syncedPokemon);

          l.debug(
            'Added', syncedPokemon.speciesForme, 'to index', size - 1, 'for player', playerKey,
            '\n', 'length', '(now)', playerState.pokemon.length, '(max)', playerState.maxPokemon,
            '\n', 'synced', syncedPokemon.calcdexId, syncedPokemon,
            '\n', 'client', clientPokemon.calcdexId, clientPokemon,
            '\n', 'server', serverPokemon?.calcdexId, serverPokemon,
            '\n', 'pokemon', '(battle)', player.pokemon,
            '\n', 'pokemon', '(state)', playerState.pokemon,
            '\n', 'battle', battleId, battle,
            '\n', 'state', battleState,
          );
        } else {
          playerState.pokemon[matchedPokemonIndex] = syncedPokemon;

          l.debug(
            'Updated', syncedPokemon.speciesForme, 'at index', matchedPokemonIndex, 'for player', playerKey,
            '\n', 'synced', syncedPokemon.calcdexId, syncedPokemon,
            '\n', 'client', clientPokemon.calcdexId, clientPokemon,
            '\n', 'server', serverPokemon?.calcdexId, serverPokemon,
            '\n', 'pokemon', '(battle)', player.pokemon,
            '\n', 'pokemon', '(state)', playerState.pokemon,
            '\n', 'battle', battleId, battle,
            '\n', 'state', battleState,
          );
        }
      }

      // keep track of which calcdexId's we've added so far (for myPokemon in Doubles)
      const processedIds: string[] = [];

      playerState.activeIndices = player.active?.map((activePokemon) => {
        // particularly in FFA, there may be a Pokemon belonging to another player in active[]
        if (!activePokemon?.details || detectPlayerKeyFromPokemon(activePokemon) !== playerKey) {
          return null;
        }

        // checking myPokemon first (if it's available) for Illusion/Zoroark
        let activeId = (
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
                    // update (2023/10/09): you know who it is baby
                    || formatId(p.ability || p.baseAbility) === 'illusion'
                    || p.calcdexId === activePokemon.calcdexId
                )
                && !processedIds.includes(p?.calcdexId)
            ))?.calcdexId
        )
          || activePokemon?.calcdexId
          || player.pokemon.find((p) => p === activePokemon)?.calcdexId;

        // note: leave as `let` for those dank console logs
        let activeIndex = -1;

        if (activeId) {
          activeIndex = playerState.pokemon.findIndex((p) => p.calcdexId === activeId);
        }

        // update (2023/10/08): hey there demons, it's me, ya boy
        const illusionIndex = activeIndex < 0
          ? playerState.pokemon.findIndex((p) => formatId(p.dirtyAbility || p.ability) === 'illusion')
          : -1;

        if (illusionIndex > -1) {
          const illusionPokemon = playerState.pokemon[illusionIndex];

          // note: purposefully not implementing Illusion detection for activePokemon beyond checking their levels,
          // which wouldn't be always present in formats like OU where every Pokemon is level 100 unless you're temp6t
          // (i.e., too much handholding if we check if this "Cinderace" could legally learn Dark Pulse lol)
          const parsedDetails = parsePokemonDetails(activePokemon.details);

          // e.g., activePokemon.details = 'Cinderace, L84, M' (but actually 'Zoroark, L84, M' tho)
          // suspect.details = 'Cinderace, L77, M' (actual Cinderace)
          const suspect = (
            !!parsedDetails?.speciesForme
              && (parsedDetails.level || 0) > 0
              && playerState.pokemon.find((p) => p.speciesForme === parsedDetails.speciesForme)
          ) || null;

          // e.g., suspect.level = 77,
          // activePokemon.level (as parsedDetails.level) = 84
          const sus = !!illusionPokemon?.calcdexId
            && (suspect?.level || 0) > 0
            && suspect.level !== parsedDetails.level;

          if (sus) {
            activeId = illusionPokemon.calcdexId;
            activeIndex = illusionIndex;
          }
        }

        // l.debug(
        //   'Building activeIndices for player', playerKey,
        //   '\n', 'activeId', activeId,
        //   '\n', 'activeIndex', activeIndex,
        //   '\n', 'activePokemon', activePokemon,
        //   '\n', 'player.active', player.active,
        //   '\n', `${playerKey}.pokemon`, playerState.pokemon,
        // );

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
            '\n', 'active', '(client)', activePokemon,
            '\n', 'player', '(battle)', player,
            '\n', 'player', '(state)', playerState.pokemon,
            '\n', 'order', playerState.pokemonOrder,
            '\n', 'battle', battleId, battle,
            '\n', 'state', battleState,
            '\n', '(You will only see this warning on development.)',
          );
        }

        return null;
      }).filter((n) => typeof n === 'number' && n > -1) || [];

      // repopulate the active property of each pokemon now that we have the actual indices
      playerState.pokemon.forEach((pokemon, i) => {
        pokemon.active = playerState.activeIndices.includes(i);
      });

      if (playerState.activeIndices.length) {
        // surprisingly encountered a race-condition with player.faintCounter not being the most up-to-date value,
        // so we'll just count it ourselves LOL
        const faintCounter = playerState.pokemon.filter((p) => !p.hp).length;

        // update the faintCounter from the player side if not active on the field & not fainted
        // OR the Pokemon's current faintCounter is 0 when the battle is inactive (probably from a page reload)
        if (faintCounter > 0) {
          const pendingPokemon = playerState.pokemon.filter((p) => (
            // note: Pokemon can have a `/^fallen\d$/` volatile (e.g., `'fallen1'`), which is the server reporting
            // the actual faintCounter essentially, so if present, we'll assume syncPokemon() has already applied it
            !Object.keys(p.volatiles || {}).some((k) => k?.startsWith('fallen'))
          ) && (
            // update (2023/10/07): apparently the "only-update-the-faintCounter-when-switched-out" mechanic only
            // applies to Supreme Overlord, so everything else (like Last Respects on Houndstone) should always sync
            // (as long as the Pokemon isn't dedge, of course) ... LOL ty gam frek
            (((p.dirtyAbility || p.ability) !== 'Supreme Overlord' as AbilityName || !p.active) && p.hp > 0)
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

        // exhibit the big smart sync technology by utilizing the power of hardcoded game sense for Protosynthesis/Quark Drive,
        // i.e., remove the Booster Energy **dirtyItem** & select the next item in altItems[] if the Pokemon doesn't have an
        // active booster volatile (e.g., 'protosynthesisatk') & field conditions aren't met, which is to say they're probably
        // not running Booster Energy on that Pokemon
        // update (2023/11/14): moved this from syncPokemon() since this should only trigger for active Pokemon
        if (gen > 8) {
          const pendingPokemon = playerState.pokemon.filter((p) => (
            p.active
              && PokemonBoosterAbilities.includes(p.dirtyAbility || p.ability)
              && p.dirtyItem === 'Booster Energy' as ItemName
              && !Object.keys(p.volatiles).some((k) => k.startsWith(formatId(p.dirtyAbility || p.ability)))
              && (
                (p.dirtyAbility || p.ability) !== 'Protosynthesis' as AbilityName
                  || syncedField.weather !== 'Sun' as Weather
              )
              && (
                (p.dirtyAbility || p.ability) !== 'Quark Drive' as AbilityName
                  || syncedField.terrain !== 'Electric' as Terrain
              )
          ));

          pendingPokemon.forEach((pokemon) => {
            // altItems could be potentially sorted by usage stats from the Calcdex
            pokemon.dirtyItem = (
              !!pokemon.altItems?.length
                && flattenAlts(pokemon.altItems)
                  .find((item) => item !== 'Booster Energy' as ItemName)
            ) || null;

            // could've been previously toggled, so make sure the ability is toggled off
            pokemon.abilityToggled = false;
          });
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

      // update abilityToggled for all of the player's pokemon now that they're all synced up
      if (!battleState.legacy) {
        playerState.pokemon.forEach((p, i) => {
          // pretty much used for Stakeout ya lol
          const opponentState = battleState[battleState.opponentKey];
          const opponentIndex = opponentState?.selectionIndex;
          const opponentPokemon = opponentState?.pokemon?.[opponentIndex];

          /**
           * @todo there's an edge case where if you're p1 w/ a Stakeout Pokemon, since you sync first, the active state
           * of p2 isn't available yet, so Stakeout could potentially remain active, but I reeaaallly don't feel like
           * addressing that atm :o (Stakeout was a lot more work an initially anticipated lol)
           */
          p.abilityToggled = detectToggledAbility(p, {
            gameType: battleState.gameType,
            pokemonIndex: i,
            opponentPokemon,
            selectionIndex: playerState.selectionIndex,
            activeIndices: playerState.activeIndices,
            weather: battleState.field.weather,
            terrain: battleState.field.terrain,
          });
        });

        // update (2023/10/14): this is kinda dumb but don't want to go too balls deep on this refactor
        // (for 'Singles', detectToggledAbility() already does the toggling based on the provided selectionIndex)
        if (battleState.gameType === 'Doubles') {
          toggleRuinAbilities(
            playerState,
            battleState.gameType,
            true, // update the selected Pokemon's abilityToggled value too
          );
        }
      }

      // sync player side
      if (playerState.active) {
        // sync the sideConditions from the battle
        // (this is first so that it'll be available in sanitizePlayerSide(), just in case)
        // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
        // playerState.side.conditions = structuredClone(player.sideConditions || {});
        playerState.side.conditions = clonePlayerSideConditions(player.sideConditions);

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

    // also now is the perfect time to populate each Pokemon's autoBoostMap of each player
    AllPlayerKeys.forEach((playerKey) => {
      if (!battleState[playerKey]?.pokemon?.length) {
        return;
      }

      battleState[playerKey].pokemon.forEach((pokemon) => {
        pokemon.autoBoostMap = mapAutoBoosts(pokemon, battle.stepQueue, {
          format: battleState.format,
          players: battleState,
          field: battleState.field,
        });
      });
    });

    // this is important, otherwise we can't ignore re-renders of the same battle state
    // (which may result in reaching React's maximum update depth)
    if (battleNonce) {
      battleState.battleNonce = battleNonce;
    }

    endTimer(
      '(dispatched)',
      '\n', 'battleId', battleId,
    );

    // l.debug(
    //   'Dispatching synced state for', battleState.battleId || '???',
    //   '\n', 'battle', battleId, battle,
    //   '\n', 'state', battleState,
    // );

    return battleState;
  },
);
