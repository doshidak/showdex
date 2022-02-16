import { PokemonNatures } from '@showdex/consts';
import { logger } from '@showdex/utils/debug';
import type { AbilityName, Generation as PkmnGeneration } from '@pkmn/data';
// import type { Smogon as PkmnSmogon } from '@pkmn/smogon';
import type {
  // BindThunkyActionators,
  ThunkyReducerAction,
  ThunkyReducerActionator,
  ThunkyReducerActionatorMap,
} from '@showdex/utils/hooks';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemon,
  CalcdexReducerInstance,
} from './CalcdexReducer';
import type { PresetCacheHookInterface } from './usePresetCache';
import { calcPokemonCalcdexId } from './calcCalcdexId';
import { calcPokemonCalcdexNonce } from './calcCalcdexNonce';
import { calcPokemonStats } from './calcPokemonStats';
import { detectPlayerKeyFromPokemon } from './detectPlayerKey';
import { detectPokemonIdent } from './detectPokemonIdent';
import { detectSpeciesForme } from './detectSpeciesForme';
import { fetchPokemonMovesets } from './fetchPokemonMovesets';
import { fetchPokemonPresets } from './fetchPokemonPresets';
import { sanitizePokemon } from './sanitizePokemon';
import { syncField } from './syncField';

export type CalcdexReducerAction<
  V extends void | Promise<void> = void,
> = ThunkyReducerAction<CalcdexReducerInstance, V>;

export type CalcdexReducerActionator<
  A extends unknown[],
  V extends void | Promise<void> = void,
> = ThunkyReducerActionator<CalcdexReducerInstance, (...args: A) => CalcdexReducerAction<V>>;

export interface CalcdexReducerActionatorMap extends ThunkyReducerActionatorMap<CalcdexReducerInstance> {
  addPokemon: CalcdexReducerActionator<[
    dex: PkmnGeneration,
    tooltips: Showdown.BattleTooltips,
    cache: PresetCacheHookInterface,
    // smogon: PkmnSmogon,
    pokemon: Partial<CalcdexPokemon>,
    format?: string,
  ], Promise<void>>;

  updatePokemon: CalcdexReducerActionator<[
    dex: PkmnGeneration,
    tooltips: Showdown.BattleTooltips,
    pokemon: Partial<CalcdexPokemon>,
    shouldSync?: boolean,
  ]>;

  updateField: CalcdexReducerActionator<[
    field: Partial<CalcdexBattleField>,
  ]>;

  syncBattleField: CalcdexReducerActionator<[
    battle: Showdown.Battle,
  ]>;

  setActiveIndex: CalcdexReducerActionator<[
    playerKey: CalcdexPlayerKey,
    activeIndex: number,
  ]>;

  setSelectionIndex: CalcdexReducerActionator<[
    playerKey: CalcdexPlayerKey,
    selectionIndex: number,
  ]>;
}

// export type CalcdexReducerBindedActionatorMap = BindThunkyActionators<CalcdexReducerInstance, CalcdexReducerActionatorMap>;

const l = logger('Calcdex/CalcdexReducerActionators');

export const addPokemon: CalcdexReducerActionatorMap['addPokemon'] = (
  dex,
  tooltips,
  // smogon,
  cache,
  pokemon,
  format,
) => async (dispatch, getState) => {
  const ident = detectPokemonIdent(pokemon);
  const speciesForme = detectSpeciesForme(pokemon);

  if (!ident || !speciesForme) {
    l.warn(
      'addPokemon() <- detectPokemonIdent(), detectSpeciesForme()',
      '\n', 'could not detect ident/speciesForme from Pokemon with ident', ident,
      '\n', 'speciesForme', speciesForme,
      '\n', 'pokemon', pokemon,
      '\n', 'format', format,
    );

    return;
  }

  const playerKey = detectPlayerKeyFromPokemon(pokemon);

  if (!playerKey) {
    l.warn(
      'addPokemon() <- detectPlayerKeyFromPokemon()',
      '\n', 'could not detect playerKey from Pokemon with ident', ident,
      '\n', 'playerKey', playerKey,
      '\n', 'speciesForme', speciesForme,
      '\n', 'pokemon', pokemon,
      '\n', 'format', format,
    );

    return;
  }

  const state = getState();
  const existingPokemon = state[playerKey].pokemon?.find((p) => detectPokemonIdent(p) === ident);

  if (existingPokemon) {
    l.warn(
      'addPokemon()',
      '\n', 'Pokemon with ident', ident, 'already exists for player', playerKey,
      '\n', 'existingPokemon', existingPokemon,
      '\n', 'speciesForme', speciesForme,
      '\n', 'pokemon', pokemon,
      '\n', 'format', format,
    );

    return;
  }

  const newPokemon = sanitizePokemon(pokemon);

  if (typeof dex?.species?.get === 'function') {
    const species = dex.species.get(pokemon.speciesForme);

    if (Object.keys(species?.abilities || {}).length) {
      newPokemon.abilities = <AbilityName[]> Object.values(species.abilities);

      if (newPokemon.abilities?.[0] && !newPokemon.ability) {
        [newPokemon.ability] = newPokemon.abilities;
      }

      l.debug(
        'addPokemon() <- dex.species.get().abilities',
        '\n', 'newPokemon.ability', newPokemon.ability,
        '\n', 'newPokemon.abilities', newPokemon.abilities,
        '\n', 'speciesForme', pokemon.speciesForme,
        '\n', 'ident', ident,
        '\n', 'newPokemon', newPokemon,
      );
    }

    if (species?.baseStats) {
      newPokemon.baseStats = {
        ...species.baseStats,
      };

      l.debug(
        'addPokemon() <- dex.species.get().baseStats',
        '\n', 'newPokemon.baseStats', newPokemon.baseStats,
        '\n', 'speciesForme', pokemon.speciesForme,
        '\n', 'ident', ident,
        '\n', 'newPokemon', newPokemon,
      );
    }
  }

  // if (dex?.natures) {
  //   newPokemon.natures = Array.from(dex.natures)
  //     .map((nature) => nature?.name)
  //     .filter(Boolean);
  //
  //   if (newPokemon.natures?.length && !newPokemon.nature) {
  //     const [firstNature] = newPokemon.natures;
  //
  //     newPokemon.nature = firstNature;
  //   }
  //
  //   l.debug(
  //     'addPokemon() <- dex.natures',
  //     '\n', 'possible natures for', ident, 'set to', newPokemon.natures,
  //     '\n', 'newPokemon', newPokemon,
  //   );
  // }

  // newPokemon.natures = PokemonNatures;

  if (!newPokemon.nature) {
    [newPokemon.nature] = PokemonNatures;
  }

  l.debug(
    'addPokemon() <- @showdex/consts/PokemonNatures',
    '\n', 'newPokemon.nature', newPokemon.nature,
    '\n', 'newPokemon', newPokemon,
  );

  if (typeof tooltips?.getPokemonTypes === 'function') {
    newPokemon.types = tooltips.getPokemonTypes(<Showdown.Pokemon> <unknown> newPokemon);

    l.debug(
      'addPokemon() <- tooltips.getPokemonTypes()',
      '\n', 'types', newPokemon.types,
      '\n', 'pokemon', newPokemon,
      '\n', 'ident', ident,
      '\n', 'speciesForme', speciesForme,
      '\n', 'format', format,
    );
  }

  l.debug(
    'addPokemon() -> await fetchPokemonMovesets()',
    '\n', 'newPokemon', 'newPokemon',
    '\n', 'ident', ident,
    '\n', 'speciesForme', speciesForme,
    '\n', 'format', format,
  );

  // grab the Pokemon's movesets
  const movesetPokemon = await fetchPokemonMovesets(dex, newPokemon, format);

  l.debug(
    'addPokemon() <- await fetchPokemonMovesets()',
    '\n', 'movesetPokemon', movesetPokemon,
    '\n', 'ident', ident,
    '\n', 'speciesForme', speciesForme,
    '\n', 'format', format,
  );

  if (Array.isArray(movesetPokemon?.moveState?.learnset)) {
    newPokemon.moveState = movesetPokemon.moveState;

    l.debug(
      'setting newPokemon.moveState to', movesetPokemon.moveState,
      '\n', 'newPokemon', newPokemon,
      '\n', 'ident', ident,
      '\n', 'speciesForme', speciesForme,
      '\n', 'format', format,
    );
  }

  // grab the Pokemon's learnsets and Smogon presets (if available)
  l.debug(
    'addPokemon() -> await fetchPokemonPresets()',
    '\n', 'newPokemon', newPokemon,
    '\n', 'format', format,
    '\n', 'ident', ident,
  );

  /**
   * @note If you notice that `fetchPokemonPresets()` doesn't return from its `Promise`,
   * you may be hard-pressed to find that all you had to do was reload the extension in Chrome's settings LOL.
   *
   * This is due to the `runtimeFetch()` util that was passed into initializing `Smogon` in `Calcdex.bootstrap.ts`.
   * `runtimeFetch()` relies on a background service worker (handled in `background.ts`) to `fetch()` the data
   * (to get around Chrome's strict enforcement of CORS).
   *
   * Theoretically, this should only be an issue in development... *should*.
   */
  const presetPokemon = await fetchPokemonPresets(dex, cache, newPokemon, format);

  if (Object.keys(presetPokemon).length) {
    Object.entries(presetPokemon).forEach(([key, value]) => {
      newPokemon[key] = value;
    });
  }

  l.debug(
    'addPokemon() <- await fetchPokemonPresets()',
    '\n', 'presetPokemon', presetPokemon,
    '\n', 'newPokemon', newPokemon,
    '\n', 'ident', ident,
    '\n', 'format', format,
  );

  // if ('speciesForme' in presetPokemon) {
  //   delete presetPokemon.speciesForme;
  // }

  // l.debug(
  //   'addPokemon() -> async () -> dispatch()',
  //   '\n', 'type', `@${playerKey}/pokemon:put`,
  //   '\n', 'payload', presetPokemon,
  // );

  // dispatch({
  //   type: `@${playerKey}/pokemon:put`,
  //   payload: presetPokemon,
  // });

  // l.debug(
  //   'addPokemon() -> calcPokemonStats()',
  //   '\n', 'newPokemon', newPokemon,
  //   '\n', 'ident', ident,
  // );

  // calculate the stats based on what we know atm
  // newPokemon.calculatedStats = calcPokemonStats(dex, newPokemon);

  // l.debug(
  //   'addPokemon() <- calcPokemonStats()',
  //   '\n', 'calculatedStats', newPokemon.calculatedStats,
  //   '\n', 'newPokemon', newPokemon,
  //   '\n', 'ident', ident,
  // );

  const calcdexId = calcPokemonCalcdexId(newPokemon);

  if (!newPokemon?.calcdexId || newPokemon.calcdexId !== calcdexId) {
    newPokemon.calcdexId = calcdexId;
  }

  newPokemon.calcdexNonce = calcPokemonCalcdexNonce(newPokemon);

  l.debug(
    'addPokemon() -> dispatch()',
    '\n', 'type', `@${playerKey}/pokemon:post`,
    '\n', 'payload', newPokemon,
    '\n', 'ident', ident,
  );

  dispatch({
    type: `@${playerKey}/pokemon:post`,
    payload: newPokemon,
  });
};

export const updatePokemon: CalcdexReducerActionatorMap['updatePokemon'] = (
  dex,
  tooltips,
  pokemon,
  shouldSync,
) => (dispatch) => {
  const ident = detectPokemonIdent(pokemon);
  const playerKey = detectPlayerKeyFromPokemon(pokemon);

  if (!playerKey) {
    l.warn(
      'updatePokemon()',
      '\n', 'could not detect playerKey from pokemon', pokemon,
      '\n', 'playerKey', playerKey,
    );

    return;
  }

  const updatedPokemon = <Partial<CalcdexPokemon>> { ...pokemon };
  // const updatedPokemon = $.extend(true, {}, pokemon);

  if (typeof tooltips?.getPokemonTypes === 'function') {
    const types = tooltips.getPokemonTypes(<Showdown.Pokemon> <unknown> updatedPokemon);

    if (types?.length && types[0] !== '???' && JSON.stringify(updatedPokemon.types) !== JSON.stringify(types)) { // kekw
      updatedPokemon.types = types;

      l.debug(
        'updatePokemon() <- tooltips.getPokemonTypes()',
        '\n', 'types', types,
        '\n', 'updatedPokemon.types', updatedPokemon.types,
        '\n', 'updatedPokemon', updatedPokemon,
        '\n', 'ident', ident,
        '\n', 'playerKey', playerKey,
      );
    }
  }

  l.debug(
    'updatePokemon() -> calcPokemonStats()',
    '\n', 'updatedPokemon', updatedPokemon,
    '\n', 'ident', ident,
    '\n', 'playerKey', playerKey,
  );

  updatedPokemon.calculatedStats = calcPokemonStats(dex, updatedPokemon);

  l.debug(
    'updatePokemon() <- calcPokemonStats()',
    '\n', 'calculatedStats', updatedPokemon.calculatedStats,
    '\n', 'updatedPokemon', updatedPokemon,
    '\n', 'ident', ident,
    '\n', 'playerKey', playerKey,
  );

  // updatedPokemon.calcdexId = calcPokemonCalcdexId(updatedPokemon);

  l.debug(
    'updatePokemon() -> dispatch()',
    '\n', 'type', `@${playerKey}/pokemon:${shouldSync ? 'sync' : 'put'}`,
    '\n', 'payload', updatedPokemon,
    '\n', 'ident', ident,
    '\n', 'playerKey', playerKey,
  );

  dispatch({
    type: `@${playerKey}/pokemon:${shouldSync ? 'sync' : 'put'}`,
    // payload: <CalcdexPokemon> {
    //   ...pokemon,
    //   calculatedStats: calculateStats(pokemon),
    // },
    payload: updatedPokemon,
  });
};

export const updateField: CalcdexReducerActionatorMap['updateField'] = (
  field,
) => (dispatch) => {
  l.debug(
    'updateField() -> dispatch()',
    '\n', 'type', '@field/:put',
    '\n', 'payload', field,
  );

  dispatch({
    type: '@field/:put',
    payload: field,
  });
};

export const syncBattleField: CalcdexReducerActionatorMap['syncBattleField'] = (
  battle,
) => (dispatch, getState) => {
  const state = getState();

  const { activeIndex: attackerIndex } = state.p1;
  const { activeIndex: defenderIndex } = state.p2;

  l.debug(
    'syncBattleField() -> syncField()',
    '\n', 'state.field', state.field,
    '\n', 'attackerIndex', attackerIndex,
    '\n', 'defenderIndex', defenderIndex,
    '\n', 'battle', battle,
    '\n', 'state', state,
  );

  const syncedField = syncField(
    state.field,
    battle,
    attackerIndex,
    defenderIndex,
  );

  if (!syncedField?.gameType) {
    l.debug(
      'syncBattleField() <- syncField()',
      '\n', 'ignoring field updates due to invalid synced field', syncedField,
      '\n', 'state.field', state.field,
      '\n', 'attackerIndex', attackerIndex,
      '\n', 'defenderIndex', defenderIndex,
      '\n', 'battle', battle,
      '\n', 'state', state,
    );

    return;
  }

  l.debug(
    'syncBattleField() -> dispatch()',
    '\n', 'type', '@field/:put',
    '\n', 'payload', syncedField,
  );

  dispatch({
    type: '@field/:put',
    payload: syncedField,
  });
};

export const setActiveIndex: CalcdexReducerActionatorMap['setActiveIndex'] = (
  playerKey,
  activeIndex,
) => (dispatch) => {
  l.debug(
    'setActiveIndex() -> dispatch()',
    '\n', 'type', `@${playerKey}/activeIndex:put`,
    '\n', 'payload', activeIndex,
  );

  dispatch({
    type: `@${playerKey}/activeIndex:put`,
    payload: activeIndex,
  });
};

export const setSelectionIndex: CalcdexReducerActionatorMap['setSelectionIndex'] = (
  playerKey,
  selectionIndex,
) => (dispatch) => {
  l.debug(
    'setSelectionIndex() -> dispatch()',
    '\n', 'type', `@${playerKey}/selectionIndex:put`,
    '\n', 'payload', selectionIndex,
  );

  dispatch({
    type: `@${playerKey}/selectionIndex:put`,
    payload: selectionIndex,
  });
};

export const CalcdexReducerActionators: CalcdexReducerActionatorMap = {
  addPokemon,
  updatePokemon,
  updateField,
  syncBattleField,
  setActiveIndex,
  setSelectionIndex,
};
