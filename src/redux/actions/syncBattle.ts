import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  detectAuthPlayerKeyFromBattle,
  detectBattleRules,
  detectLegacyGen,
  detectPlayerKeyFromBattle,
  legalLockedFormat,
  sanitizePokemon,
  sanitizeVolatiles,
  syncField,
  syncPokemon,
  toggleRuinAbilities,
} from '@showdex/utils/battle';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexBattleState, CalcdexPlayerKey, RootState } from '@showdex/redux/store';

export interface SyncBattlePayload {
  battle: Showdown.Battle;
  request?: Showdown.BattleRequest;
}

export const SyncBattleActionType = 'calcdex:sync';

const defaultMinPokemon = env.int('calcdex-player-min-pokemon', 0);
const l = logger('@showdex/redux/actions/syncBattle');

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

    const rootState = <RootState> api.getState();
    const settings = rootState?.showdex?.settings?.calcdex;
    const state = rootState?.calcdex;

    // moved from calcdexSlice since the syncBattle.pending case does not provide the payload
    l.debug(
      'RECV', SyncBattleActionType, 'for', battle?.id || '(missing battle.id)',
      '\n', 'payload', payload,
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
    const battleState: CalcdexBattleState = structuredClone(state[battleId]);

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
      battleState.gen = <GenerationNum> gen;
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

    // find out which side myPokemon belongs to
    const detectedPlayerKey = detectPlayerKeyFromBattle(battle);

    if (detectedPlayerKey && battleState.playerKey !== detectedPlayerKey) {
      battleState.playerKey = detectedPlayerKey;
    }

    // also, while we're here, update the authPlayerKey (if any) and opponentKey
    battleState.authPlayerKey = detectAuthPlayerKeyFromBattle(battle);
    battleState.opponentKey = battleState.playerKey === 'p2' ? 'p1' : 'p2';

    for (const playerKey of <CalcdexPlayerKey[]> ['p1', 'p2']) {
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
      const maxPokemon = Math.max(player?.totalPokemon || 0, defaultMinPokemon);

      if (playerState.maxPokemon !== maxPokemon) {
        playerState.maxPokemon = maxPokemon;
      }

      // determine if `myPokemon` belongs to the current player
      const isMyPokemonSide = !!battleState.playerKey
        && playerKey === battleState.playerKey;
        // && !!myPokemon?.length;

      const hasMyPokemon = !!myPokemon?.length;

      // preserve the initial ordering of myPokemon since it's subject to change its indices
      // (battle state may move the most recent active Pokemon to the front of the array)
      // if (isMyPokemonSide && !playerState.pokemonOrder?.length) {
      //   playerState.pokemonOrder = myPokemon.map((p, i) => searchId(p, playerKey, i));
      // }
      // if (playerState.pokemonOrder.length < env.int('calcdex-player-max-pokemon')) {
      //   const useMyPokemon = isMyPokemonSide && hasMyPokemon;

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
              && player.pokemon.find((p) => !!p?.calcdexId && (
                !!p.ident
                  && p.ident === pokemon.ident
              ))?.calcdexId
          )
            || calcPokemonCalcdexId(pokemon, playerKey);

          l.debug(
            'Assigned calcdexId', pokemon.calcdexId, 'to', pokemon.speciesForme,
            'for player', playerKey,
            '\n', 'battleId', battleId,
            '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
            '\n', 'source', 'getIdent' in pokemon ? 'client' : 'server',
            '\n', 'pokemon', pokemon,
          );
        }

        if (isMyPokemonSide && hasMyPokemon && !('getIdent' in pokemon)) {
          const clientPokemon = player.pokemon
            .find((p) => !p.calcdexId && (
              !!p.ident
                && !!p.speciesForme
                && !!p.details
                && !!p.searchid
            ) && (
              p.ident === pokemon.ident
                || p.details === pokemon.details
                || p.searchid === pokemon.searchid
                || p.speciesForme === pokemon.speciesForme
                || pokemon.searchid.includes(p.ident)
                || pokemon.speciesForme.includes(p.speciesForme.replace('-*', ''))
            ));

          if (clientPokemon) {
            clientPokemon.calcdexId = pokemon.calcdexId;

            l.debug(
              'Assigned calcdexId', pokemon.calcdexId,
              'to matched clientPokemon', clientPokemon.speciesForme,
              'for player', playerKey,
              '\n', 'battleId', battleId,
              '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
              '\n', 'clientPokemon', clientPokemon,
              '\n', 'serverPokemon', pokemon,
            );
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
        return <DeepPartial<Showdown.Pokemon>> {
          calcdexId: serverPokemon.calcdexId,
          // slot: i,
          ident: serverPokemon.ident,
          searchid: serverPokemon.searchid,
          name: serverPokemon.name,
          speciesForme: serverPokemon.speciesForme,
          details: serverPokemon.details,
          gender: serverPokemon.gender,
          level: serverPokemon.level,
          hp: serverPokemon.hp,
          maxhp: serverPokemon.maxhp,
        };
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
        const basePokemon = matchedPokemon
          || sanitizePokemon(clientPokemon, battleState.format, settings?.showAllFormes);

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
          // battleState.field,
          // battleState.format,
          settings?.showAllFormes,
          (!isMyPokemonSide || !hasMyPokemon)
            && settings?.defaultAutoMoves[battleState.authPlayerKey === playerKey ? 'auth' : playerKey],
        );

        // update the syncedPokemon's playerKey, if falsy or mismatched
        if (!syncedPokemon.playerKey || syncedPokemon.playerKey !== playerKey) {
          syncedPokemon.playerKey = playerKey;
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

            l.debug(
              'Processing move request for', reqIdent || reqDetails,
              '\n', 'battleId', battleId,
              '\n', 'shouldIgnore?', shouldIgnore,
              '\n', 'moveData', moveData,
              '\n', 'Gmax?', moveData?.maxMoves?.gigantamax, // ? = partial, i.e., could be null/undefined
              '\n', 'Tera?', moveData?.canTerastallize,
              '\n', 'sidePokemon', side.pokemon?.[j],
              '\n', 'request', request,
              '\n', 'battle', battle,
            );

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

            if (hasTeraData) {
              syncedPokemon.teraType = moveData.canTerastallize;
            }

            break;
          }
        }

        // update the faintCounter from the player side if not fainted (or prev value is 0)
        if (player.faintCounter > -1 && (syncedPokemon.hp > 0 || !syncedPokemon.faintCounter)) {
          const reloadOffset = !syncedPokemon.hp && !syncedPokemon.faintCounter ? 1 : 0;
          const value = Math.max(player.faintCounter - reloadOffset);

          syncedPokemon.faintCounter = value;
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
                '\n', 'slot', i, 'calcdexId', clientPokemon.calcdexId,
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

          l.debug(
            'Added new Pokemon', syncedPokemon.speciesForme, 'to player', playerKey,
            '\n', 'battleId', battleId,
            '\n', 'slot', i, 'calcdexId', clientPokemon.calcdexId,
            '\n', 'length', '(now)', playerState.pokemon.length, '(max)', playerState.maxPokemon,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'serverPokemon', serverPokemon,
            '\n', 'syncedPokemon', syncedPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
            '\n', 'pokemonOrder', playerState.pokemonOrder,
            '\n', 'battle', battle,
            '\n', 'battleState', battleState,
          );
        } else {
          playerState.pokemon[matchedPokemonIndex] = syncedPokemon;

          l.debug(
            'Updated existing Pokemon', syncedPokemon.speciesForme,
            'at index', matchedPokemonIndex, 'for player', playerKey,
            '\n', 'battleId', battleId,
            '\n', 'slot', i, 'calcdexId', clientPokemon.calcdexId,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'serverPokemon', serverPokemon,
            '\n', 'syncedPokemon', syncedPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
            '\n', 'pokemonOrder', playerState.pokemonOrder,
            '\n', 'battle', battle,
            '\n', 'battleState', battleState,
          );
        }
      }

      // keep track of which calcdexId's we've added so far (for myPokemon in Doubles)
      const processedIds: string[] = [];

      playerState.activeIndices = player.active?.map((activePokemon) => {
        // checking myPokemon first (if it's available) for Illusion/Zoroark
        const activeId = (
          isMyPokemonSide
            && hasMyPokemon
            && myPokemon.find((p) => p?.active && !processedIds.includes(p?.calcdexId))?.calcdexId
        )
          || activePokemon?.calcdexId
          || player.pokemon.find((p) => p === activePokemon)?.calcdexId;

        // update activeIndex (and selectionIndex if autoSelect is enabled)
        // (hopefully the `ident` exists here!)
        const activeIndex = activeId
          // ? playerPokemon.findIndex((p, i) => searchId(p, playerKey, i) === activeSearchId)
          ? playerState.pokemon.findIndex((p) => p.calcdexId === activeId)
          : -1;

        // l.debug(
        //   'Building activeIndices for player', playerKey,
        //   '\n', 'activeId', activeId,
        //   '\n', 'activeIndex', activeIndex,
        //   '\n', 'activePokemon', activePokemon,
        //   '\n', 'player.active', player.active,
        //   '\n', `${playerKey}.pokemon`, playerState.pokemon,
        // );

        if (activeIndex > -1 && !processedIds.includes(activeId)) {
          // playerState.activeIndex = activeIndex;

          // if (playerState.autoSelect) {
          //   playerState.selectionIndex = activeIndex;
          // }

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

      if (playerState.activeIndices?.length && playerState.autoSelect) {
        [playerState.selectionIndex] = playerState.activeIndices;
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
    }

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

      return;
    }

    battleState.field = syncedField;

    // this is important, otherwise we can't ignore re-renders of the same battle state
    // (which may result in reaching React's maximum update depth)
    if (battleNonce) {
      battleState.battleNonce = battleNonce;
    }

    l.debug(
      'Dispatching synced battleState for', battleState.battleId || '(missing battleId)',
      '\n', 'battle', battle,
      '\n', 'battleState', battleState,
      '\n', 'state', state,
    );

    return battleState;
  },
);
