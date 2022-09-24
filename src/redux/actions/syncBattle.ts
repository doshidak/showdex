import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  detectAuthPlayerKeyFromBattle,
  detectBattleRules,
  detectPlayerKeyFromBattle,
  detectPokemonIdent,
  hasMegaForme,
  sanitizePokemon,
  sanitizePokemonVolatiles,
  syncField,
  syncPokemon,
} from '@showdex/utils/battle';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { Generation, GenerationNum } from '@pkmn/data';
import type { CalcdexBattleState, CalcdexPlayerKey, CalcdexSliceState } from '@showdex/redux/store';

const l = logger('@showdex/redux/actions/syncBattle');

export interface SyncBattlePayload {
  battle: Showdown.Battle;
  dex: Generation;
}

export const SyncBattleActionType = 'calcdex:sync';

/**
 * Internally-used search ID builder for Pokemon.
 *
 * @example 'p1: Moltres-Kanto|Moltres-Galar|L100|shiny'
 * @since 1.0.2
 */
const searchId = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<Showdown.Pokemon>,
): string => (pokemon?.speciesForme ? [
  detectPokemonIdent(pokemon),
  hasMegaForme(pokemon?.speciesForme)
    ? pokemon.speciesForme.replace(/-Mega(?:-[A-Z]+)?$/i, '')
    : pokemon?.speciesForme,
  `L${pokemon?.level || 100}`,
  pokemon?.shiny && 'shiny',
].filter(Boolean).join('|') : null);

/**
 * Syncs the Showdown `battle` state with an existing `CalcdexBattleState`.
 *
 * @since 0.1.3
 */
export const syncBattle = createAsyncThunk<CalcdexBattleState, SyncBattlePayload>(
  SyncBattleActionType,

  async (payload, api) => {
    l.debug(
      'RECV', SyncBattleActionType,
      '\n', 'payload', payload,
    );

    const {
      battle,
      dex,
    } = payload || {};

    const rootState = <Record<'calcdex', CalcdexSliceState>> api.getState();
    const { calcdex: state } = rootState;

    // l.debug('calcdex state', state);

    const {
      id: battleId,
      nonce: battleNonce,
      gen,
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

    if (typeof dex?.learnsets?.learnable !== 'function') {
      throw new Error('Missing required dex property in payload argument.');
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
      //   'name/rating update',
      //   '\n', 'player', player,
      //   '\n', 'playerState', playerState,
      //   '\n', '__DEV__', __DEV__,
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
        && playerKey === battleState.playerKey
        && !!myPokemon?.length;

      // obtain the searchId of the active Pokemon, if any
      const activeSearchId = searchId(player.active?.[0]);

      // preserve the initial ordering of myPokemon since it's subject to change its indices
      // (battle state may move the most recent active Pokemon to the front of the array)
      if (isMyPokemonSide && !playerState.pokemonOrder?.length) {
        playerState.pokemonOrder = myPokemon.map((p) => searchId(p));
      }

      // reconstruct a full list of the current player's Pokemon, whether revealed or not
      // (but if we don't have the relevant info [i.e., !isMyPokemonSide], then just access the player's `pokemon`)
      const playerPokemon = isMyPokemonSide ? playerState.pokemonOrder.map((currentSearchId) => {
        const serverPokemon = myPokemon.find((p) => searchId(p) === currentSearchId);

        // try to find a matching clientPokemon that has already been revealed using the ident,
        // which is seemingly consistent between the player's `pokemon` (Pokemon[]) and `myPokemon` (ServerPokemon[])
        const clientPokemonIndex = player.pokemon.findIndex((p) => searchId(p) === currentSearchId);

        if (clientPokemonIndex > -1) {
          return player.pokemon[clientPokemonIndex];
        }

        // at this point, most likely means that the Pokemon is not yet revealed,
        // so convert the ServerPokemon into a partially-filled Pokemon object
        return <DeepPartial<Showdown.Pokemon>> {
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
      }) : player.pokemon;

      // l.debug(
      //   'playerKey', playerKey, 'isMyPokemonSide?', isMyPokemonSide,
      //   '\n', 'activeSearchId', activeSearchId,
      //   '\n', 'playerPokemon', playerPokemon,
      // );

      // update each pokemon
      // (note that the index `i` should be relatively consistent between turns)
      for (let i = 0; i < playerPokemon.length; i++) {
        const clientPokemon = playerPokemon[i];

        // l.debug('Processing client Pokemon', clientPokemon.speciesForme, 'for player', playerKey);

        const clientPokemonId = calcPokemonCalcdexId({
          ...clientPokemon,

          // always 0 for some reason, so we'll reuse it for our own purposes ;)
          slot: i,

          // may need to specify this for generating a unique calcdexId for the Showdown.Pokemon
          side: clientPokemon?.side?.sideid ? clientPokemon.side : <Showdown.Side> {
            sideid: playerKey,
          },
        });

        const serverPokemon = isMyPokemonSide
          ? myPokemon.find((p) => searchId(p) === searchId(clientPokemon))
          : null;

        const matchedPokemonIndex = playerState.pokemon.findIndex((p) => p.calcdexId === clientPokemonId);

        const matchedPokemon = matchedPokemonIndex > -1
          ? playerState.pokemon[matchedPokemonIndex]
          : null;

        // this is our starting point for the current clientPokemon
        const basePokemon = matchedPokemon || sanitizePokemon({
          ...clientPokemon,
          slot: i, // important that we specify this to obtain a consistent calcdexId
        }, dex?.num);

        // in case the volatiles aren't sanitized yet lol
        if ('transform' in basePokemon.volatiles && typeof basePokemon.volatiles.transform[1] !== 'string') {
          basePokemon.volatiles = sanitizePokemonVolatiles(basePokemon);
        }

        // and then from here on out, we just directly modify syncedPokemon
        // (serverPokemon and dex are optional, which will add additional known properties)
        const syncedPokemon = syncPokemon(
          basePokemon,
          clientPokemon,
          serverPokemon,
          dex,
          battleState.format,
        );

        l.debug(
          'Completed initial sync for Pokemon', syncedPokemon.speciesForme, 'of player', playerKey,
          '\n', 'syncedPokemon', syncedPokemon,
        );

        // build (or rebuild) the Pokemon's movesets
        // (which we can only do here, since it's async)
        if (!matchedPokemon || matchedPokemon.speciesForme !== syncedPokemon.speciesForme) {
          // l.debug('Fetching learnset for Pokemon', syncedPokemon.speciesForme, 'of player', playerKey);

          const sanitizedForme = hasMegaForme(syncedPokemon.speciesForme)
            ? syncedPokemon.speciesForme.replace(/-Mega(?:-[A-Z]+)?$/i, '')
            : syncedPokemon.speciesForme;

          const learnset = await dex.learnsets.learnable(sanitizedForme);

          // l.debug(
          //   'Fetched learnset for Pokemon', syncedPokemon.speciesForme, 'of player', playerKey,
          //   '\n', 'learnset', learnset,
          // );

          syncedPokemon.moveState.learnset = Object.keys(learnset || {})
            .map((moveid) => dex.moves.get(moveid)?.name)
            .filter((name) => !!name && !syncedPokemon.moveState.revealed.includes(name))
            .sort();

          // build `other`, only if we have no `learnsets` or the `format` has something to do with hacks
          // if (!syncedPokemon.moveState.learnset.length || (battleState.format && /anythinggoes|hackmons/i.test(battleState.format))) {
          //   syncedPokemon.moveState.other = Object.keys(BattleMovedex || {})
          //     .map((moveid) => dex.moves.get(moveid)?.name)
          //     .filter((name) => !!name && !syncedPokemon.moveState.revealed.includes(name) && !syncedPokemon.moveState.learnset?.includes?.(name))
          //     .sort();
          // }

          // l.debug(
          //   'Updated moveState for Pokemon', syncedPokemon.speciesForme, 'of player', playerKey,
          //   '\n', 'syncedPokemon.moveState', syncedPokemon.moveState,
          //   '\n', 'syncedPokemon', syncedPokemon,
          // );
        }

        // add the pokemon to the player's Calcdex state (if not maxed already)
        if (!matchedPokemon) {
          if (playerState.pokemon.length >= env.int('calcdex-player-max-pokemon')) {
            if (__DEV__) {
              l.warn(
                'Ignoring adding clientPokemon for', playerKey, 'since they have the max number of Pokemon.',
                '\n', 'CALCDEX_PLAYER_MAX_POKEMON', env.int('calcdex-player-max-pokemon'),
                '\n', 'slot', i, 'clientPokemonId', clientPokemonId,
                '\n', 'clientPokemon', clientPokemon,
                '\n', 'syncedPokemon', syncedPokemon,
                '\n', 'player.pokemon', player.pokemon,
                '\n', 'playerState.pokemon', playerState.pokemon,
                '\n', '(You will only see this warning on development.)',
              );
            }

            continue;
          }

          playerState.pokemon.push(syncedPokemon);

          l.debug(
            'Adding new Pokemon', syncedPokemon.speciesForme, 'to player', playerKey,
            '\n', 'slot', i, 'clientPokemonId', clientPokemonId,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'syncedPokemon', syncedPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
          );
        } else {
          playerState.pokemon[matchedPokemonIndex] = syncedPokemon;

          l.debug(
            'Updating existing Pokemon', syncedPokemon.speciesForme, 'at index', matchedPokemonIndex, 'for player', playerKey,
            '\n', 'slot', i, 'clientPokemonId', clientPokemonId,
            '\n', 'clientPokemon', clientPokemon,
            '\n', 'syncedPokemon', syncedPokemon,
            '\n', 'playerState.pokemon', playerState.pokemon,
          );
        }
      }

      // update activeIndex (and selectionIndex if autoSelect is enabled)
      // (hopefully the `ident` exists here!)
      const activeIndex = activeSearchId
        ? playerPokemon.findIndex((p) => searchId(p) === activeSearchId)
        : -1;

      if (activeIndex > -1) {
        playerState.activeIndex = activeIndex;

        if (playerState.autoSelect) {
          playerState.selectionIndex = activeIndex;
        }
      } else if (__DEV__) {
        l.warn(
          'Could not find activeIndex for activeSearchId', activeSearchId,
          '\n', 'player', playerState.sideid, 'playerPokemon', playerPokemon,
          '\n', '(You will only see this warning on development.)',
        );
      }
    }

    const syncedField = syncField(
      battleState,
      battle,
      // battleState.p1.activeIndex,
      // battleState.p2.activeIndex,
    );

    if (!syncedField?.gameType) {
      if (__DEV__) {
        l.warn(
          'Failed to sync the field state from the Showdown battle state.',
          '\n', 'syncedField', syncedField,
          '\n', 'battleState.field', battleState.field,
          '\n', 'battle', battle,
          '\n', 'attackerIndex', battleState.p1.activeIndex, 'defenderIndex', battleState.p2.activeIndex,
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
      'DONE', SyncBattleActionType,
      '\n', 'battle', battle,
      '\n', 'battleState', battleState,
      '\n', 'state', state,
    );

    return battleState;
  },
);
