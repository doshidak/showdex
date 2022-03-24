import * as React from 'react';
import { Generations } from '@pkmn/data';
import { Dex as PkmnDex } from '@pkmn/dex';
import { logger } from '@showdex/utils/debug';
import {
  useThunkyBindedActionators,
  useThunkyReducer,
} from '@showdex/utils/hooks';
import type { Generation, GenerationNum } from '@pkmn/data';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemon,
  CalcdexReducerInstance,
  CalcdexReducerState,
} from './CalcdexReducer';
import { CalcdexActionators } from './CalcdexActionators';
import { CalcdexInitialState, CalcdexReducer } from './CalcdexReducer';
import { detectPlayerKeyFromBattle } from './detectPlayerKey';
import { detectPokemonIdent } from './detectPokemonIdent';
import { syncServerPokemon } from './syncServerPokemon';
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
  setAutoSelect: (playerKey: CalcdexPlayerKey, autoSwitch: boolean) => void;
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
  );

  const [prevNonce, setPrevNonce] = React.useState<string>(null);
  const presetCache = usePresetCache();

  const gen = battle?.gen as GenerationNum;
  const format = battle?.id?.split?.('-')?.[1];

  // const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? gens.get(gen) : null), [gen]);
  const dex = React.useMemo(() => (typeof gen === 'number' && gen > 0 ? <Generation> <unknown> {
    ...gens.get(gen),
    species: Dex?.species || gens.get(gen).species,
  } : null), [gen]);

  const {
    addPokemon,
    updatePokemon,
    updateField,
    syncBattleField,
    setActiveIndex,
    setSelectionIndex,
    setAutoSelect,
  } = useThunkyBindedActionators<CalcdexReducerInstance, typeof CalcdexActionators>(
    CalcdexActionators,
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

      const value = key === 'format' ?
        format :
        battle[(key === 'battleId' ? 'id' : key) as 'id' | 'gen'];

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

      const isRandom = format.includes('random');

      (<CalcdexPlayerKey[]> ['p1', 'p2']).forEach((playerKey) => {
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

        // find out which side myPokemon belongs to
        const myPokemonSide = detectPlayerKeyFromBattle(battle);
        const isPlayerSide = playerKey === myPokemonSide;

        const pokemonSource = isPlayerSide && isRandom ?
          battle.myPokemon?.map?.((myMon) => {
            const ident = detectPokemonIdent(<Showdown.Pokemon> <unknown> myMon);
            const correspondingMon = player.pokemon
              .find((pkmn) => detectPokemonIdent(pkmn) === ident);

            if (!correspondingMon) {
              return <Showdown.Pokemon> <unknown> {
                ...myMon,
                ident,
              };
            }

            return <Showdown.Pokemon> <unknown> {
              ...correspondingMon,
              ...myMon,
              ident,
            };
          }) ?? [] :
          player.pokemon;

        l.debug(
          'React.useEffect() <- detectPlayerKeyFromBattle()',
          '\n', 'myPokemonSide', myPokemonSide,
          '\n', 'isPlayerSide?', isPlayerSide,
          '\n', 'pokemonSource', pokemonSource,
          '\n', 'battle', battle,
        );

        // update each player's pokemon
        const {
          autoSelect,
          pokemon: pokemonState,
        } = state[playerKey];

        // also find the activeIndex while we're at it
        const activeIdent = detectPokemonIdent(player.active?.[0]);

        // player.pokemon.forEach((mon, i) => void (async () => {
        pokemonSource.forEach((mon, i) => void (async () => {
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

          if (index < 0 && pokemonState.length >= 6) {
            l.warn(
              'React.useEffect() <- pokemonState.findIndex()',
              '\n', 'could not find Pokemon with ident', ident, 'at current index', i,
              '\n', 'index', index,
              '\n', 'pokemonState[', index, ']', pokemonState[index],
              '\n', 'pokemonState', pokemonState,
              '\n', 'pokemonState idents', pokemonState.map((p) => detectPokemonIdent(p)),
              '\n', 'mon', mon,
              '\n', `battle.${playerKey}.pokemon`, player.pokemon,
            );

            return;
          }

          // if the current player is `p1`, check for a corresponding `myPokemon`, if available
          const serverPokemon = myPokemonSide && playerKey === myPokemonSide ?
            battle.myPokemon?.find((p) => {
              const pIdent = detectPokemonIdent(<Showdown.Pokemon> <unknown> p);
              const didMatch = pIdent === ident;

              // l.debug(
              //   'serverPokemon',
              //   '\n', 'pIdent', pIdent, 'ident', ident, '?', didMatch,
              //   '\n', 'myPokemonSide', myPokemonSide, 'playerKey', playerKey,
              // );

              return didMatch;
            }) :
            null;

          // l.debug(
          //   'myPokemonSide', myPokemonSide, 'playerKey', playerKey,
          //   '\n', 'serverPokemon', serverPokemon,
          // );

          // const newPokemon: CalcdexPokemon = {
          //   ...mon,
          //   ...(<Showdown.Pokemon & CalcdexPokemon> <unknown> serverPokemon),
          // };

          let newPokemon: CalcdexPokemon = {
            ...(<CalcdexPokemon> <unknown> mon),
          };

          if (serverPokemon || isRandom) {
            newPokemon = syncServerPokemon(dex, presetCache, format, newPokemon, serverPokemon);
            // newPokemon.serverSourced = true;
          }

          // found the pokemon, so update it
          if (index > -1) {
            l.debug(
              'React.useEffect() -> updatePokemon()',
              '\n', 'syncing pokemon', ident, 'with mutation', newPokemon,
              '\n', `state.${playerKey}.pokemon[`, index, ']', pokemonState[index],
              '\n', 'i', i, 'index', index,
            );

            if (activeIdent === ident) {
              setActiveIndex(playerKey, index);

              if (autoSelect) {
                setSelectionIndex(playerKey, index);
              }
            }

            // update the mon at the current index (via the `sync` action instead of `put`)
            // updatePokemon(dex, tooltips, <CalcdexPokemon> (<unknown> mon), true);
            updatePokemon(dex, tooltips, newPokemon, !serverPokemon);

            return;
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

    l.debug(
      'React.useEffect() -> syncBattleField()',
      '\n', 'battle', battle,
      '\n', 'state', state,
    );

    // handle field changes
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
    dex,
    dispatch,
    format,
    presetCache,
    prevNonce,
    setActiveIndex,
    setSelectionIndex,
    // smogon,
    state,
    syncBattleField,
    tooltips,
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
    setAutoSelect,
  };
};
