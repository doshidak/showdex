import * as React from 'react';
// import useReducerWithThunk from 'use-reducer-thunk';
import { Generations } from '@pkmn/data';
import { Dex as PkmnDex } from '@pkmn/dex';
// import { PokemonStatNames } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import {
  // bindThunkyActionators,
  useThunkyBindedActionators,
  useThunkyReducer,
} from '@showdex/utils/hooks';
import type {
  // AbilityName,
  Generation,
  GenerationNum,
  // ID as PkmnID,
  // ItemName,
  // MoveName,
} from '@pkmn/data';
// import type { Smogon as PkmnSmogon } from '@pkmn/smogon';
// import type { State as SmogonState } from '@smogon/calc';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemon,
  // CalcdexReducerDispatch,
  CalcdexReducerInstance,
  CalcdexReducerState,
} from './CalcdexReducer';
// import type { CalcdexReducerBindedActionatorMap } from './CalcdexReducerActionators';
// import { calcPokemonCalcdexId } from './calcCalcdexId';
import { CalcdexInitialState, CalcdexReducer } from './CalcdexReducer';
import { CalcdexReducerActionators } from './CalcdexReducerActionators';
// import { detectPlayerKeyFromPokemon } from './detectPlayerKey';
import { detectPokemonIdent } from './detectPokemonIdent';
// import { sanitizePokemon } from './sanitizePokemon';
// import { sanitizePresets } from './sanitizePresets';
import { usePresetCache } from './usePresetCache';

export interface CalcdexHookProps {
  battle: Showdown.Battle;
  tooltips: Showdown.BattleTooltips;
  // smogon: PkmnSmogon;
}

export interface CalcdexHookInterface {
  dex: Generation;
  state: CalcdexReducerState;
  // dispatch: CalcdexReducerDispatch;
  addPokemon: (pokemon: Partial<CalcdexPokemon>) => Promise<void>;
  updatePokemon: (pokemon: Partial<CalcdexPokemon>) => void;
  syncPokemon: (pokemon: Partial<CalcdexPokemon>) => void;
  updateField: (field: Partial<CalcdexBattleField>) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, activeIndex: number) => void;
  setSelectionIndex: (playerKey: CalcdexPlayerKey, selectionIndex: number) => void;
}

const l = logger('Calcdex/useCalcdex');

// we're using the `Dex` from `window.Dex` that the Showdown client uses
// const gens = new Generations(($.extend(true, PkmnDex, Dex) as unknown) as ModdedDex);
const gens = new Generations(PkmnDex);

export const useCalcdex = ({
  battle,
  tooltips,
  // smogon,
}: CalcdexHookProps): CalcdexHookInterface => {
  const [state, dispatch] = useThunkyReducer(
    CalcdexReducer,
    { ...CalcdexInitialState },
    // `calcdex-${battle?.id || 'unknown'}`,
  );

  const [prevNonce, setPrevNonce] = React.useState<string>(null);
  const presetCache = usePresetCache();

  const gen = battle?.gen as GenerationNum;
  // const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? gens.get(gen) : null), [gen]);
  const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? <Generation> <unknown> {
    ...gens.get(gen),
    species: Dex?.species || gens.get(gen).species,
  } : null), [gen]);
  const format = battle?.id?.split?.('-')?.[1];

  // const calculateStats = React.useCallback((pokemon: Partial<CalcdexPokemon>) => {
  //   if (typeof dex?.stats?.calc !== 'function' || typeof dex?.species?.get !== 'function') {
  //     l.warn(
  //       'calculateStats()',
  //       '\n', 'cannot calculate stats since dex.stats.calc() and/or dex.species.get() is not available',
  //       '\n', 'pokemon', pokemon,
  //     );
  //
  //     return;
  //   }
  //
  //   if (!pokemon?.speciesForme) {
  //     l.warn(
  //       'calculateStats()',
  //       '\n', 'cannot calculate stats since pokemon.speciesForme is falsy',
  //       // '\n', 'pokemon.ident', pokemon?.ident,
  //       '\n', 'pokemon.speciesForme', pokemon?.speciesForme,
  //       '\n', 'pokemon', pokemon,
  //     );
  //
  //     return;
  //   }
  //
  //   const species = dex.species.get(pokemon.speciesForme);
  //
  //   const calculatedStats: CalcdexPokemon['calculatedStats'] = PokemonStatNames.reduce((prev, stat) => {
  //     prev[stat] = dex.stats.calc(
  //       stat,
  //       species?.baseStats?.[stat] || 0,
  //       pokemon?.ivs?.[stat] || 31,
  //       pokemon?.evs?.[stat] || 0,
  //       pokemon?.level || 100,
  //       pokemon?.nature ? dex?.natures?.get?.(pokemon?.nature) : undefined,
  //     );
  //
  //     // re-calculate any boosted stat
  //     if (stat in (pokemon?.boosts || {})) {
  //       const stage = (pokemon.boosts[stat] as number) || 0;
  //
  //       if (stage) {
  //         const clampedStage = Math.min(Math.max(stage, -6), 6); // -6 <= stage <= 6
  //         // const multiplier = clampedStage < 0 ? (2 / (2 + Math.abs(clampedStage))) : ((2 + clampedStage) / 2);
  //         const multiplier = ((Math.abs(clampedStage) + 2) / 2) ** (clampedStage < 0 ? -1 : 1);
  //
  //         prev[stat] *= multiplier;
  //       }
  //     }
  //
  //     return prev;
  //   }, <CalcdexPokemon['calculatedStats']> {
  //     hp: 0,
  //     atk: 0,
  //     def: 0,
  //     spa: 0,
  //     spd: 0,
  //     spe: 0,
  //   });
  //
  //   l.debug(
  //     'calculateStats()',
  //     '\n', 'stats calculated for', pokemon.ident, 'to', calculatedStats,
  //   );
  //
  //   return calculatedStats;
  // }, [
  //   dex?.natures,
  //   dex?.species,
  //   dex?.stats,
  // ]);

  // const fetchPresets = React.useCallback(async (pokemon: CalcdexPokemon) => {
  //   const ident = detectPokemonIdent(pokemon);
  //   const playerKey = <CalcdexPlayerKey> detectPlayerKeyFromPokemon(pokemon);
  //
  //   const newPokemon = { ...pokemon };
  //
  //   if ('moves' in newPokemon) {
  //     delete newPokemon.moves;
  //   }
  //
  //   if (typeof dex?.learnsets?.learnable === 'function') {
  //     const learnset = await dex.learnsets.learnable(pokemon.speciesForme);
  //
  //     newPokemon.moveState.learnset = Object.keys(learnset || {})
  //       .map((moveid) => dex.moves.get(moveid)?.name)
  //       .filter((name) => !!name && !pokemon.moveState?.revealed?.includes(name))
  //       .sort();
  //
  //     l.debug(
  //       'fetchPresets()',
  //       '\n', 'learnset for', ident, 'set to', newPokemon.moveState.learnset,
  //     );
  //   }
  //
  //   // build `other`, only if we have no `learnsets` or the `format` has something to do with hacks
  //   if (!newPokemon.moveState.learnset.length || (format && /anythinggoes|hackmons/i.test(format))) {
  //     newPokemon.moveState.other = Object.keys(dex.learnsets.learnable(pokemon.speciesForme))
  //       .map((moveid) => dex.moves.get(moveid)?.name)
  //       .filter((name) => !!name && !newPokemon.moveState?.revealed?.includes(name))
  //       .sort();
  //
  //     l.debug(
  //       'fetchPresets()',
  //       '\n', 'other moves for', ident, 'set to', newPokemon.moveState.other,
  //     );
  //   }
  //
  //   // if (!newPokemon.presets.length) {
  //   //   delete newPokemon.presets;
  //   //
  //   //   dispatch({
  //   //     type: `@${playerKey}/pokemon:put`,
  //   //     payload: newPokemon,
  //   //   });
  //   // }
  //
  //   // find available presets
  //   const presetPokemon: Partial<CalcdexPokemon> = {
  //     ...newPokemon,
  //     ident,
  //     speciesForme: newPokemon.speciesForme,
  //   };
  //
  //   if (typeof smogon?.sets !== 'function') {
  //     l.warn(
  //       'fetchPresets() -> smogon.sets()',
  //       '\n', 'failed to download Smogon sets for pokemon', ident, 'since smogon.sets() is unavailable',
  //     );
  //   } else if (!newPokemon.presets?.length) {
  //     /**
  //      * @todo add support for random battles via `@pkmn/randbats`
  //      * @see https://github.com/pkmn/randbats
  //      */
  //     const isRandom = !format?.includes?.('random');
  //
  //     const newPresets = await smogon.sets(
  //       dex,
  //       pokemon.speciesForme,
  //       isRandom ? format as PkmnID : null, /** @todo */
  //     );
  //
  //     if (newPresets?.length) {
  //       l.debug(
  //         'fetchPresets() <- smogon.sets()',
  //         '\n', 'downloaded Smogon sets for pokemon', ident,
  //         '\n', 'newPresets', newPresets,
  //       );
  //
  //       presetPokemon.presets = sanitizePresets(newPresets);
  //
  //       if (newPokemon.autoPreset) {
  //         // const [firstPreset] = newPresets;
  //         const [firstPreset] = presetPokemon.presets;
  //
  //         l.debug(
  //           'fetchPresets()',
  //           '\n', 'auto-setting preset for pokemon', ident, 'to', firstPreset?.name,
  //           '\n', 'firstPreset', firstPreset,
  //         );
  //
  //         /**
  //          * @todo
  //          * do something about duplicate preset names
  //          * (across gens, like "Gen 8 OU Swords Dance" and "Gen 7 OU Swords Dance",
  //          * which both have the name "Swords Dance")
  //          */
  //         presetPokemon.preset = firstPreset?.calcdexId;
  //         presetPokemon.item = firstPreset?.item;
  //         presetPokemon.dirtyItem = !!firstPreset?.item;
  //         presetPokemon.ability = firstPreset?.ability;
  //         presetPokemon.nature = firstPreset?.nature;
  //
  //         if (!firstPreset.moves?.length) {
  //           presetPokemon.moves = firstPreset?.moves;
  //         }
  //
  //         if (Object.keys(firstPreset?.ivs || {}).length) {
  //           presetPokemon.ivs = { ...newPokemon?.ivs, ...firstPreset?.ivs };
  //         }
  //
  //         if (Object.keys(firstPreset?.evs || {}).length) {
  //           presetPokemon.evs = { ...newPokemon?.evs, ...firstPreset?.evs };
  //         }
  //       }
  //     }
  //   }
  //
  //   // calculate the stats based on what we know atm
  //   presetPokemon.calculatedStats = calculateStats(newPokemon);
  //
  //   l.debug(
  //     'fetchPresets() -> dispatch()',
  //     '\n', 'dispatching put action for pokemon', ident,
  //     '\n', 'presetPokemon', presetPokemon,
  //   );
  //
  //   // d({
  //   //   type: `@${playerKey}/pokemon:put`,
  //   //   payload: presetPokemon,
  //   // });
  //
  //   return presetPokemon;
  // }, [
  //   calculateStats,
  //   dex,
  //   // dispatch,
  //   format,
  //   smogon,
  // ]);

  // const addPokemon = React.useCallback(async (pokemon: Partial<CalcdexPokemon>) => {
  //   const ident = detectPokemonIdent(pokemon);
  //
  //   if (!ident || !pokemon?.speciesForme) {
  //     l.warn(
  //       'addPokemon()',
  //       '\n', 'could not detect ident/speciesForme from pokemon', pokemon,
  //       '\n', 'ident', ident,
  //       '\n', 'pokemon.speciesForme', pokemon?.speciesForme,
  //     );
  //
  //     return;
  //   }
  //
  //   const playerKey = <CalcdexPlayerKey> detectPlayerKeyFromPokemon(pokemon);
  //
  //   if (!playerKey) {
  //     l.warn(
  //       'addPokemon()',
  //       '\n', 'could not detect playerKey from pokemon', pokemon,
  //       '\n', 'ident', ident,
  //       '\n', 'playerKey', playerKey,
  //     );
  //
  //     return;
  //   }
  //
  //   const existingPokemon = state[playerKey].pokemon?.find((p) => detectPokemonIdent(p) === ident);
  //
  //   if (existingPokemon) {
  //     l.warn(
  //       'addPokemon()',
  //       '\n', 'pokemon', ident, 'already exists in state for player', playerKey,
  //       '\n', 'existingPokemon', existingPokemon,
  //     );
  //
  //     return;
  //   }
  //
  //   const newPokemon = sanitizePokemon(pokemon);
  //
  //   if (typeof dex?.species?.get === 'function') {
  //     const species = dex.species.get(pokemon.speciesForme);
  //
  //     if (Object.keys(species?.abilities || {}).length) {
  //       newPokemon.abilities = <AbilityName[]> Object.values(species.abilities);
  //
  //       if (newPokemon.abilities?.length && !newPokemon.ability) {
  //         const [firstAbility] = newPokemon.abilities;
  //
  //         newPokemon.ability = firstAbility;
  //       }
  //
  //       l.debug(
  //         'addPokemon() <- dex.species.get(pokemon.speciesForme', pokemon.speciesForme, ').abilities',
  //         '\n', 'possible abilities for', ident, 'set to', newPokemon.abilities,
  //       );
  //     }
  //   }
  //
  //   if (dex?.natures) {
  //     newPokemon.natures = Array.from(dex.natures).map((nature) => nature?.name).filter(Boolean);
  //
  //     if (newPokemon.natures?.length && !newPokemon.nature) {
  //       const [firstNature] = newPokemon.natures;
  //
  //       newPokemon.nature = firstNature;
  //     }
  //
  //     l.debug(
  //       'addPokemon() <- dex.natures',
  //       '\n', 'possible natures for', ident, 'set to', newPokemon.natures,
  //     );
  //   }
  //
  //   // calculate the stats based on what we know atm
  //   newPokemon.calculatedStats = calculateStats(newPokemon);
  //   newPokemon.calcdexId = calcPokemonCalcdexId(newPokemon);
  //
  //   dispatch({
  //     type: `@${playerKey}/pokemon:post`,
  //     payload: newPokemon,
  //   });
  //
  //   fetchPresets(newPokemon).catch((error) => l.error('addPokemon() -> fetchPresets()', error));
  // }, [
  //   dex,
  //   calculateStats,
  //   dispatch,
  //   fetchPresets,
  //   // format,
  //   // smogon,
  //   state,
  // ]);

  // const updatePokemon = React.useCallback((pokemon: Partial<CalcdexPokemon>) => {
  //   const playerKey = <CalcdexPlayerKey> detectPlayerKeyFromPokemon(pokemon);
  //
  //   if (!playerKey) {
  //     l.warn(
  //       'updatePokemon()',
  //       '\n', 'could not detect playerKey from pokemon', pokemon,
  //       '\n', 'playerKey', playerKey,
  //     );
  //
  //     return;
  //   }
  //
  //   const updatedPokemon = <Partial<CalcdexPokemon>> { ...pokemon };
  //
  //   updatedPokemon.calculatedStats = calculateStats(pokemon);
  //   updatedPokemon.calcdexId = calcPokemonCalcdexId(updatedPokemon);
  //
  //   dispatch({
  //     type: `@${playerKey}/pokemon:put`,
  //     // payload: <CalcdexPokemon> {
  //     //   ...pokemon,
  //     //   calculatedStats: calculateStats(pokemon),
  //     // },
  //     payload: updatedPokemon,
  //   });
  // }, [
  //   calculateStats,
  //   dispatch,
  // ]);

  // const updateField = (field: Partial<CalcdexBattleField>) => {
  //   dispatch({
  //     type: '@field/:put',
  //     payload: field,
  //   });
  // };

  // const setActive = (playerKey: CalcdexPlayerKey, activeIndex: number) => {
  //   dispatch({
  //     type: `@${playerKey}/activeIndex:put`,
  //     payload: activeIndex,
  //   });
  // };

  // const setSelection = (playerKey: CalcdexPlayerKey, selectionIndex: number) => {
  //   dispatch({
  //     type: `@${playerKey}/selectionIndex:put`,
  //     payload: selectionIndex,
  //   });
  // };

  const {
    addPokemon,
    updatePokemon,
    updateField,
    syncBattleField,
    setActiveIndex,
    setSelectionIndex,
  } = useThunkyBindedActionators<CalcdexReducerInstance, typeof CalcdexReducerActionators>(
    CalcdexReducerActionators,
    dispatch,
  );

  // handles `battle` changes
  React.useEffect(() => {
    l.debug(
      'React.useEffect()',
      'received battle update; determining sync changes...',
      '\n', 'battle.nonce', battle?.nonce,
      '\n', 'prevNonce', prevNonce,
      '\n', 'battle.p1.pokemon', battle?.p1?.pokemon,
      '\n', 'battle.p2.pokemon', battle?.p2?.pokemon,
      '\n', 'battle', battle,
      '\n', 'state', state,
    );

    if (!battle?.nonce) {
      // this means the passed-in `battle` object is not from the bootstrapper
      l.debug(
        'React.useEffect()',
        'ignoring battle update due to missing nonce', battle?.nonce,
        '\n', 'battle', battle,
        '\n', 'state', state,
      );

      return;
    }

    if (battle.nonce === prevNonce) {
      l.debug(
        'React.useEffect()',
        'ignoring battle update since nonce hasn\'t changed',
        '\n', 'battle.nonce', battle.nonce,
        '\n', 'prevNonce', prevNonce,
        '\n', 'battle', battle,
        '\n', 'state', state,
      );

      return;
    }

    if (battle.nonce !== prevNonce) {
      l.debug(
        'React.useEffect()',
        'updating prevNonce from', prevNonce,
        '\n', 'to battle.nonce', battle.nonce,
        '\n', 'battle', battle,
        '\n', 'state', state,
      );

      setPrevNonce(battle.nonce);
    }

    // handle battle updates
    let battleIdChanged = false;
    const battleChanges: Partial<CalcdexReducerState> = {};

    (['battleId', 'gen', 'format'] as (keyof CalcdexReducerState)[]).forEach((key) => {
      const currentValue = state[key];
      const value = key === 'format' ? format : battle[(key === 'battleId' ? 'id' : key) as 'id' | 'gen'];

      // l.debug('current battleKey', key, 'value', value);

      // if (!value && !['string', 'number', 'boolean'].includes(typeof value)) {
      if (value === null || value === undefined) {
        l.debug(
          'React.useEffect()',
          'ignoring battle updates for', key, 'due to undefined value', value,
          '\n', `state.${key}`, currentValue,
          '\n', `battle.${key}`, value,
          '\n', 'battle', battle,
        );

        return;
      }

      if (currentValue !== value) {
        (<Record<keyof CalcdexReducerState, unknown>> battleChanges)[key] = value;

        if (key === 'battleId') {
          battleIdChanged = true;
        }
      }
    });

    /** @todo clear Pokemon in the state -- Pokemon from a previous game still exist in the state, causing all sorts of fuckery */
    if (battleIdChanged || Object.keys(battleChanges).length) {
      dispatch({
        type: battleIdChanged ? '@/:init' : '@/:put',
        payload: battleChanges,
      });

      if (battleIdChanged && (state.p1.pokemon.length || state.p2.pokemon.length)) {
        l.debug(
          'React.useEffect()',
          'battleId has changed; resetting state...',
          // '\n', 'ignoring further battle updates to give the re-initialized state time to settle',
          '\n', 'battleChanges', battleChanges,
          '\n', 'battle', battle,
          '\n', 'state', state,
        );

        // return;
      }
    }

    // handle player updates
    void (async () => {
      if (!presetCache.available(format)) {
        l.debug(
          'React.useEffect() -> await presetCache.fetch()',
          '\n', 'fetching presets from Smogon since none are available',
          '\n', 'format', format,
        );

        await presetCache.fetch(format);
      }

      (['p1', 'p2'] as CalcdexPlayerKey[]).forEach((playerKey) => {
        const player = battle?.[playerKey];

        if (!player?.sideid) {
          l.debug(
            'React.useEffect()',
            'ignoring updates for player', playerKey, 'due to invalid', `battle.${playerKey}`,
            '\n', `battle.${playerKey}`, player,
            '\n', 'battle', battle,
            '\n', 'state', state,
          );

          return;
        }

        if (!Array.isArray(player.pokemon) || !player.pokemon.length) {
          l.debug(
            'React.useEffect()',
            'ignoring updates for player', playerKey, 'cause of no pokemon lol',
            '\n', `battle.${playerKey}.pokemon`, battle?.[playerKey]?.pokemon,
            '\n', `battle.${playerKey}`, battle?.[playerKey],
            '\n', 'state', state,
          );

          return;
        }

        dispatch({
          type: `@${playerKey}/:put`,
          payload: {
            name: player?.name,
            rating: player?.rating,
          },
        });

        // update each player's pokemon
        const { pokemon: pokemonState } = state[playerKey];

        // also find the activeIndex while we're at it
        const activeIdent = detectPokemonIdent(player.active?.[0]);

        player.pokemon.forEach((mon, i) => void (async () => {
          const ident = detectPokemonIdent(mon);

          if (!ident) {
            l.debug(
              'React.useEffect()',
              'ignoring updates for pokemon of player', playerKey, 'due to invalid ident', ident,
              '\n', 'mon', mon,
              '\n', `battle.${playerKey}.pokemon`, player.pokemon,
            );

            return;
          }

          const index = pokemonState.findIndex((p) => detectPokemonIdent(p) === ident);

          // check if the player has the max amount of pokemon, then remove the current entry
          // at index `i` since we couldn't find the matching pokemon (`index` should've been > -1)
          // if (index < 0 && pokemonState?.[i]) {
          //   l.debug(
          //     'React.useEffect() -> dispatch({ type', `@${playerKey}/pokemon:remove`, '})',
          //     '\n', 'deleting pokemon', pokemonState[i]?.ident, 'at index', i,
          //     '\n', `state.${playerKey}.pokemon[`, i, ']', pokemonState[i],
          //     '\n', 'i', i, 'index', index,
          //   );
          //
          //   // delete the mon at the current index cause it's different
          //   // (handles cases when the battleId changes for some reason lol)
          //   dispatch({
          //     type: `@${playerKey}/pokemon:delete`,
          //     payload: pokemonState[i],
          //   });
          //
          //   // return;
          // }

          if (index < 0 && pokemonState.length >= 6) {
            l.warn(
              'React.useEffect() <- pokemonState.findIndex()',
              '\n', 'could not find Pokemon with ident', ident, 'at current index', i,
              '\n', 'index', index,
              '\n', 'pokemonState[', i, ']', pokemonState[i],
              '\n', 'pokemonState', pokemonState,
              '\n', 'pokemonState idents', pokemonState.map((p) => detectPokemonIdent(p)),
              '\n', 'mon', mon,
              '\n', `battle.${playerKey}.pokemon`, player.pokemon,
            );

            return;
          }

          // found the pokemon, so update it
          if (index > -1) {
            l.debug(
              'React.useEffect() -> updatePokemon()',
              '\n', 'syncing pokemon', ident, 'with mutation', mon,
              '\n', `state.${playerKey}.pokemon[`, i, ']', pokemonState[i],
              '\n', 'i', i, 'index', index,
            );

            if (activeIdent === ident) {
              setActiveIndex(playerKey, index);
            }

            // update the mon at the current index (via the `sync` action instead of `put`)
            updatePokemon(dex, tooltips, <CalcdexPokemon> (<unknown> mon), true);

            return;
          }

          // if the current player is `p1`, check for a corresponding `myPokemon`, if available
          const serverPokemon = playerKey === 'p1' ?
            battle.myPokemon?.find((p) => p?.ident === ident) :
            null;

          const newPokemon: CalcdexPokemon = {
            ...mon,
            ...(<Showdown.Pokemon & CalcdexPokemon> (<unknown> serverPokemon)),
          };

          if (serverPokemon) {
            newPokemon.serverSourced = true;
          }

          l.debug(
            'React.useEffect() -> await addPokemon()',
            '\n', 'adding pokemon', newPokemon.ident, 'to index', pokemonState.length,
            '\n', 'newPokemon', newPokemon,
            '\n', `state.${playerKey}.pokemon`, pokemonState,
            '\n', 'playerKey', playerKey,
            '\n', 'i', i, 'index', index,
          );

          // add the mon to whatever index lol
          // addPokemon(dex, smogon, newPokemon, format).catch((e) => l.error(e));

          try {
            await addPokemon(dex, tooltips, presetCache, newPokemon, format);
          } catch (error) {
            l.error(
              'React.useEffect() <- await addPokemon()',
              '\n', error,
              '\n', 'playerKey', playerKey,
              '\n', 'i', i, 'index', index,
              '\n', 'newPokemon', newPokemon,
            );
          }

          l.debug(
            'React.useEffect() <- await addPokemon()',
            '\n', 'playerKey', playerKey,
            '\n', 'i', i, 'index', index,
            '\n', 'newPokemon', newPokemon,
          );
        })());
      });
    })();

    // handle field changes
    // const { activeIndex: attackerIndex } = state.p1;
    // const { activeIndex: defenderIndex } = state.p2;

    // l.debug(
    //   'React.useEffect() -> syncField()',
    //   '\n', 'state.field', state.field,
    //   '\n', 'attackerIndex', attackerIndex,
    //   '\n', 'defenderIndex', defenderIndex,
    //   '\n', 'battle', battle,
    //   '\n', 'state', state,
    // );

    // const newField = syncField(
    //   state.field,
    //   battle,
    //   attackerIndex,
    //   defenderIndex,
    // );

    // if (!newField?.gameType) {
    //   l.debug(
    //     'React.useEffect() <- syncField()',
    //     '\n', 'ignoring field updates due to invalid synced field', newField,
    //     '\n', 'state.field', state.field,
    //     '\n', 'attackerIndex', attackerIndex,
    //     '\n', 'defenderIndex', defenderIndex,
    //     '\n', 'battle', battle,
    //     '\n', 'state', state,
    //   );
    //
    //   return;
    // }

    l.debug(
      'React.useEffect() -> syncBattleField()',
      // '\n', 'newField', newField,
      // '\n', 'state.field', state.field,
      '\n', 'battle', battle,
      '\n', 'state', state,
    );

    syncBattleField(battle);

    l.debug(
      'React.useEffect()',
      'completed battle state sync for nonce', battle.nonce,
      '\n', 'battle', battle,
      '\n', 'state', state,
    );
  }, [
    addPokemon,
    battle,
    battle?.nonce,
    // battle?.p1?.pokemon,
    // battle?.p2?.pokemon,
    dex,
    dispatch,
    format,
    presetCache,
    prevNonce,
    setActiveIndex,
    // smogon,
    state,
    syncBattleField,
    tooltips,
    // updateField,
    updatePokemon,
  ]);

  return {
    dex,
    state,
    // dispatch,
    addPokemon: (pokemon) => addPokemon(dex, tooltips, presetCache, pokemon, format),
    updatePokemon: (pokemon) => updatePokemon(dex, tooltips, pokemon),
    syncPokemon: (pokemon) => updatePokemon(dex, tooltips, pokemon, true),
    updateField,
    setActiveIndex,
    setSelectionIndex,
  };
};
