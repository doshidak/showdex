import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  detectAuthPlayerKeyFromBattle,
  detectBattleRules,
  detectPlayerKeyFromBattle,
  // detectPlayerKeyFromPokemon,
  // detectPokemonIdent,
  // getDexForFormat,
  // hasMegaForme,
  sanitizePokemon,
  sanitizeVolatiles,
  syncField,
  syncPokemon,
} from '@showdex/utils/battle';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexBattleState, CalcdexPlayerKey, RootState } from '@showdex/redux/store';

export interface SyncBattlePayload {
  battle: Showdown.Battle;
  // dex: Generation;
}

export const SyncBattleActionType = 'calcdex:sync';

/**
 * Internally-used search ID builder for Pokemon.
 *
 * @example 'p1|0|Moltres-Galar|L100|N'
 * @since 1.0.2
 */
// const searchId = (
//   pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<Showdown.Pokemon>,
//   playerKey?: CalcdexPlayerKey,
//   slot?: number,
// ): string => {
//   const dex = getDexForFormat();
//
//   if (!pokemon?.speciesForme) {
//     return null;
//   }
//
//   const dexSpecies = dex?.species.get(pokemon.speciesForme);
//
//   return [
//     playerKey || detectPlayerKeyFromPokemon(pokemon),
//     // 'slot' in pokemon && typeof pokemon.slot === 'number'
//     //   ? String(pokemon.slot)
//     //   : String(typeof slot === 'number' ? slot : -1),
//     String(
//       typeof slot === 'number' && slot > -1
//         ? slot
//         : 'slot' in pokemon && typeof pokemon.slot === 'number'
//           ? pokemon.slot
//           : -1,
//     ),
//     // hasMegaForme(pokemon?.speciesForme)
//     //   ? pokemon.speciesForme.replace(/-(?:Mega(?:-[A-Z]+)?|Gmax)$/i, '')
//     //   : pokemon?.speciesForme,
//     // pokemon.speciesForme.replace(/-(?:Mega(?:-[A-Z]+)?|Gmax|Primal)$/i, ''),
//     dexSpecies?.baseForme || pokemon.speciesForme.replace(/-(?:\*|Mega(?:-[A-Z]+)|Gmax|Primal|Ultra)$/i, ''),
//     `L${pokemon?.level || 100}`,
//     (pokemon?.gender || 'N').toUpperCase(), // update: making this consistent w/ calcPokemonCalcdexId()
//     // (pokemon?.shiny || pokemon?.searchid?.includes('shiny')) && 'shiny',
//   ].filter(Boolean).join('|');
// };

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
      // dex,
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
      ended,
      myPokemon,
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

    // detect the battle rules
    if (stepQueue?.length) {
      battleState.rules = detectBattleRules(stepQueue);
    }

    // update the battle active state
    battleState.active = !ended;

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
        if (!pokemon.calcdexId) {
          pokemon.calcdexId = calcPokemonCalcdexId(pokemon, playerKey);
        }

        // l.debug('Assigning calcdexId', pokemon.calcdexId, 'to', pokemon.speciesForme);

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

            // l.debug(
            //   'Found matching clientPokemon', clientPokemon.speciesForme,
            //   '\n', 'clientPokemon', clientPokemon,
            //   '\n', 'serverPokemon', pokemon,
            // );
          }
        }

        return pokemon.calcdexId;
      }) ?? [];

      if (currentOrder.length > playerState.pokemonOrder.length) {
        playerState.pokemonOrder = currentOrder;
      }

      // l.debug(
      //   'Setting initial Pokemon ordering for player', playerKey,
      //   '\n', 'playerState.pokemonOrder', playerState.pokemonOrder,
      //   '\n', 'isMyPokemonSide?', isMyPokemonSide,
      //   '\n', 'initialPokemon', initialPokemon,
      //   '\n', 'battle', battle,
      //   '\n', 'battleState', battleState,
      // );

      // reconstruct a full list of the current player's Pokemon, whether revealed or not
      // (but if we don't have the relevant info [i.e., !isMyPokemonSide], then just access the player's `pokemon`)
      const playerPokemon = playerState.pokemonOrder.map((calcdexId) => {
        // try to find a matching clientPokemon that has already been revealed using the ident,
        // which is seemingly consistent between the player's `pokemon` (Pokemon[]) and `myPokemon` (ServerPokemon[])
        const clientPokemonIndex = player.pokemon.findIndex((p) => p.calcdexId === calcdexId);

        if (clientPokemonIndex > -1) {
          // return {
          //   ...player.pokemon[clientPokemonIndex],
          //   slot: player.pokemon[clientPokemonIndex].slot || i,
          // };

          return player.pokemon[clientPokemonIndex];
        }

        const serverPokemon = isMyPokemonSide && hasMyPokemon
          // ? myPokemon.find((p) => searchId(p, playerKey, i) === currentSearchId)
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
        'Preparing to process', playerPokemon.length, 'Pokemon for player', playerKey,
        '\n', 'battleId', battleId,
        // '\n', 'activeSearchId', activeSearchId,
        // '\n', 'activeId', activeId, 'activePokemon', activePokemon,
        '\n', 'isMyPokemonSide?', isMyPokemonSide, 'hasMyPokemon?', hasMyPokemon,
        '\n', 'playerPokemon', playerPokemon,
        '\n', 'playerState.pokemonOrder', playerState.pokemonOrder,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      // update each pokemon
      // (note that the index `i` should be relatively consistent between turns)
      for (let i = 0; i < playerPokemon.length; i++) {
        // const clientPokemon: DeepPartial<Showdown.Pokemon> = {
        //   ...playerPokemon[i],
        //
        //   ident: playerPokemon[i]?.ident && /^p\d:\s/i.test(playerPokemon[i].ident)
        //     ? playerPokemon[i].ident
        //     : `${playerKey}: ${playerPokemon[i]?.speciesForme || playerPokemon[i]?.ident}`,
        //
        //   // always 0 for some reason, so we'll reuse it for our own purposes ;)
        //   // slot: Math.max(playerPokemon[i].slot > 0 ? playerPokemon[i].slot - 1 : i, 0),
        //   slot: playerPokemon[i].slot || i,
        //
        //   // may need to specify this for generating a unique calcdexId for the Showdown.Pokemon
        //   side: playerPokemon[i]?.side?.sideid ? playerPokemon[i].side : <Showdown.Side> {
        //     ...player,
        //     sideid: playerKey,
        //   },
        // };

        const clientPokemon = playerPokemon[i];

        if (!clientPokemon?.speciesForme) {
          l.debug(
            'Ignoring Pokemon w/o speciesForme for player', playerKey, 'at index', i,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'playerPokemon', playerPokemon,
            '\n', 'playerState', playerState,
          );

          continue;
        }

        // l.debug('Processing client Pokemon', clientPokemon.speciesForme, 'for player', playerKey);

        // const clientCalcdexId = calcPokemonCalcdexId(clientPokemon, playerKey);
        // const clientSearchId = searchId(clientPokemon, playerKey, i);

        if (!clientPokemon.calcdexId) {
          clientPokemon.calcdexId = calcPokemonCalcdexId(clientPokemon, playerKey);
        }

        const serverPokemon = isMyPokemonSide && hasMyPokemon
          // ? myPokemon.find((p) => searchId(p, playerKey, i) === clientSearchId)
          ? myPokemon.find((p) => p.calcdexId === clientPokemon.calcdexId)
          : null;

        // if (serverPokemon && !serverPokemon.calcdexId) {
        //   serverPokemon.calcdexId = clientPokemon.calcdexId;
        // }

        const matchedPokemonIndex = playerState.pokemon
          // .findIndex((p) => p.calcdexId === clientCalcdexId);
          // .findIndex((p) => searchId(p, playerKey, i) === clientSearchId);
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
          battleState.format,
          settings?.showAllFormes,
        );

        l.debug(
          'Synced Pokemon', syncedPokemon.speciesForme, 'for player', playerKey,
          '\n', 'battleId', battleId,
          '\n', 'slot', i, 'clientPokemon.calcdexId', clientPokemon.calcdexId,
          '\n', 'clientPokemon', clientPokemon,
          '\n', 'serverPokemon', serverPokemon,
          '\n', 'syncedPokemon', syncedPokemon,
          '\n', 'playerState.pokemonOrder', playerState.pokemonOrder,
          '\n', 'battle', battle,
          '\n', 'battleState', battleState,
        );

        // add the pokemon to the player's Calcdex state (if not maxed already)
        if (!matchedPokemon) {
          if (playerState.pokemon.length >= env.int('calcdex-player-max-pokemon')) {
            if (__DEV__) {
              l.warn(
                'Ignoring', syncedPokemon.speciesForme, 'for player', playerKey, 'since they have the max number of Pokemon.',
                '\n', 'battleId', battleId,
                '\n', 'slot', i, 'clientPokemon.calcdexId', clientPokemon.calcdexId,
                '\n', 'current length', playerState.pokemon.length, 'calcdex-player-max-pokemon', env.int('calcdex-player-max-pokemon'),
                '\n', 'clientPokemon', clientPokemon,
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
          const geneticsKey = playerKey === battleState.authPlayerKey
            ? 'auth'
            : playerKey;

          syncedPokemon.showGenetics = settings?.defaultShowGenetics?.[geneticsKey] ?? true;

          playerState.pokemon.push(syncedPokemon);

          l.debug(
            'Adding new Pokemon', syncedPokemon.speciesForme, 'to player', playerKey,
            '\n', 'battleId', battleId,
            '\n', 'slot', i, 'clientPokemon.calcdexId', clientPokemon.calcdexId,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'syncedPokemon', syncedPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
            '\n', 'playerState.pokemonOrder', playerState.pokemonOrder,
            '\n', 'battle', battle,
            '\n', 'battleState', battleState,
          );
        } else {
          playerState.pokemon[matchedPokemonIndex] = syncedPokemon;

          l.debug(
            'Updating existing Pokemon', syncedPokemon.speciesForme, 'at index', matchedPokemonIndex, 'for player', playerKey,
            '\n', 'battleId', battleId,
            '\n', 'slot', i, 'clientPokemon.calcdexId', clientPokemon.calcdexId,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'syncedPokemon', syncedPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
            '\n', 'playerState.pokemonOrder', playerState.pokemonOrder,
            '\n', 'battle', battle,
            '\n', 'battleState', battleState,
          );
        }
      }

      // obtain the calcdexId of the active Pokemon, if any
      const [activePokemon] = player.active || [];

      const activeId = activePokemon?.calcdexId
        ? activePokemon.calcdexId
        : player.pokemon.find((p) => p === activePokemon)?.calcdexId;

      // update activeIndex (and selectionIndex if autoSelect is enabled)
      // (hopefully the `ident` exists here!)
      const activeIndex = activeId
        // ? playerPokemon.findIndex((p, i) => searchId(p, playerKey, i) === activeSearchId)
        ? playerState.pokemon.findIndex((p) => p.calcdexId === activeId)
        : -1;

      if (activeIndex > -1) {
        playerState.activeIndex = activeIndex;

        if (playerState.autoSelect) {
          playerState.selectionIndex = activeIndex;
        }
      } else if (__DEV__) {
        l.warn(
          'Could not find activeIndex with activeId', activeId, 'for player', playerKey,
          '\n', 'battleId', battleId,
          '\n', 'activePokemon', activePokemon,
          '\n', 'playerPokemon', playerPokemon,
          '\n', 'playerState.pokemon', playerState.pokemon,
          '\n', 'playerState.pokemonOrder', playerState.pokemonOrder,
          '\n', 'battle', battle,
          '\n', 'battleState', battleState,
          '\n', '(You will only see this warning on development.)',
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
          '\n', 'attackerIndex', battleState.p1.activeIndex, 'defenderIndex', battleState.p2.activeIndex,
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
