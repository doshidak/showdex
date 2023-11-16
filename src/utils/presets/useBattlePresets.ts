import * as React from 'react';
import { type Duration } from 'date-fns';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import {
  usePokemonFormatPresetQuery,
  usePokemonFormatStatsQuery,
  usePokemonRandomsPresetQuery,
  usePokemonRandomsStatsQuery,
} from '@showdex/redux/services';
import { useCalcdexSettings } from '@showdex/redux/store';
import { detectGenFromFormat, getGenlessFormat } from '@showdex/utils/dex';
import { sortPresetsByFormat } from './sortPresetsByFormat';

/**
 * Options for the `useBattlePresets()` hook.
 *
 * @since 1.1.7
 */
export interface CalcdexBattlePresetsHookOptions {
  /**
   * Format of the battle.
   *
   * * Should be prefixed with the gen, i.e., `'gen<#>'`.
   *
   * @example 'gen9randombattle'
   * @see CalcdexPokemonPresetsHookOptions['format']
   * @since 1.1.7
   */
  format: string;

  /**
   * Whether the presets shouldn't be fetched.
   *
   * * As of v1.1.7, it appears I'm suddenly a contractions kind of guy.
   *   - yesn't
   *
   * @default false
   * @since 1.1.7
   */
  disabled?: boolean;
}

/**
 * Return object of the `useBattlePresets()` hook.
 *
 * @since 1.1.7
 */
export interface CalcdexBattlePresetsHookValue {
  /**
   * Whether the presets are being fetched, either remotely or from the cache.
   *
   * * Might be more useful to use this over `ready` for UI rendering.
   *
   * @since 1.1.7
   */
  loading: boolean;

  /**
   * Whether the presets are ready to be used.
   *
   * * Doesn't mean that `presets[]` & `usages[]` will be populated, but that RTK finished doing what it needs to do.
   * * Will be immediately `true` if we're skipping fetching, which means RTK is technically finished.
   *   - (Cause it has nothing to do lol)
   * * Might be more useful to use this over `loading` for component logic.
   *
   * @since 1.1.7
   */
  ready: boolean;

  /**
   * Presets matching the provided `format`.
   *
   * * If a non-Randoms `format` is provided (e.g., `'gen9ou'`), all presets matching the derived gen will be included.
   * * Note that this includes presets for **every** Pokemon.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.7
   */
  presets: CalcdexPokemonPreset[];

  /**
   * Presets containing usage stats or Randoms probabilities for the provided `format`.
   *
   * * Unlike `presets[]`, this only includes usage stats for the matching `format`, not derived gen.
   * * Note that this includes usage presets for **every** Pokemon.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.7
   */
  usages: CalcdexPokemonPreset[];
}

/**
 * Conveniently initiates preset fetching via RTK Query & "neatly" parses them for the given `format`.
 *
 * * Though seemingly similar to `usePokemonPresets()`, this is meant to be applied battle-wide in `CalcdexProvider`.
 *   - Prior implementation with `usePokemonPresets()` was scoped to each player's Pokemon, which would result in up to
 *     6 `updatePokemon()` dispatches per player!
 *   - With this, we can optimize the initial preset application routines originally in `CalcdexPokeProvider` by merging
 *     all of the applied preset mutations for all players' Pokemon in a single `updatePlayer()` dispatch.
 *
 * @since 1.1.7
 */
export const useBattlePresets = (
  options: CalcdexBattlePresetsHookOptions,
): CalcdexBattlePresetsHookValue => {
  const {
    format,
    disabled,
  } = options || {};

  const settings = useCalcdexSettings();

  const maxAge: Duration = typeof settings?.maxPresetAge === 'number'
    && settings.maxPresetAge > 0
    ? { days: settings.maxPresetAge }
    : null;

  const gen = detectGenFromFormat(format);
  const genlessFormat = getGenlessFormat(format);
  const randoms = genlessFormat?.includes('random');

  const shouldSkipAny = disabled || !gen || !genlessFormat;
  const shouldSkipFormats = shouldSkipAny || randoms || !settings?.downloadSmogonPresets;
  const shouldSkipFormatStats = shouldSkipAny || randoms || !settings?.downloadUsageStats;
  const shouldSkipRandoms = shouldSkipAny || !randoms || !settings?.downloadRandomsPresets;
  const shouldSkipRandomsStats = shouldSkipAny || !randoms || !settings?.downloadUsageStats;

  const {
    data: formatPresets,
    isUninitialized: formatPresetsPending,
    isLoading: formatPresetsLoading,
  } = usePokemonFormatPresetQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipFormats,
  });

  const {
    data: formatStats,
    isUninitialized: formatStatsPending,
    isLoading: formatStatsLoading,
  } = usePokemonFormatStatsQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipFormatStats,
  });

  const {
    data: randomsPresets,
    isUninitialized: randomsPresetsPending,
    isLoading: randomsPresetsLoading,
  } = usePokemonRandomsPresetQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipRandoms,
  });

  const {
    data: randomsStats,
    isUninitialized: randomsStatsPending,
    isLoading: randomsStatsLoading,
  } = usePokemonRandomsStatsQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipRandomsStats,
  });

  const presets = React.useMemo<CalcdexPokemonPreset[]>(() => (
    randoms
      ? [...(randomsPresets || [])]
      : [
        ...(formatPresets || []),
        ...(formatStats || []),
      ].sort(sortPresetsByFormat(genlessFormat))
  ), [
    genlessFormat,
    formatPresets,
    formatStats,
    randoms,
    randomsPresets,
  ]);

  const usages = React.useMemo<CalcdexPokemonPreset[]>(() => (
    randoms
      ? [...(randomsStats || [])]
      : [...(formatStats || [])]
  ), [
    formatStats,
    randoms,
    randomsStats,
  ]);

  const pending = React.useMemo<boolean>(() => (
    (!shouldSkipFormats && formatPresetsPending)
      || (!shouldSkipFormatStats && formatStatsPending)
      || (!shouldSkipRandoms && randomsPresetsPending)
      || (!shouldSkipRandomsStats && randomsStatsPending)
  ), [
    formatPresetsPending,
    formatStatsPending,
    randomsPresetsPending,
    randomsStatsPending,
    shouldSkipFormats,
    shouldSkipFormatStats,
    shouldSkipRandoms,
    shouldSkipRandomsStats,
  ]);

  const loading = React.useMemo<boolean>(() => (
    pending
      || (!shouldSkipFormats && formatPresetsLoading)
      || (!shouldSkipFormatStats && formatStatsLoading)
      || (!shouldSkipRandoms && randomsPresetsLoading)
      || (!shouldSkipRandomsStats && randomsStatsLoading)
  ), [
    formatPresetsLoading,
    formatStatsLoading,
    pending,
    randomsPresetsLoading,
    randomsStatsLoading,
    shouldSkipFormats,
    shouldSkipFormatStats,
    shouldSkipRandoms,
    shouldSkipRandomsStats,
  ]);

  const ready = React.useMemo<boolean>(() => (
    shouldSkipFormats
      && shouldSkipFormatStats
      && shouldSkipRandoms
      && shouldSkipRandomsStats
  ) || (
    !pending
      && !loading
      // && !!(presets?.length || usages?.length)
  ), [
    loading,
    pending,
    // presets,
    shouldSkipFormats,
    shouldSkipFormatStats,
    shouldSkipRandoms,
    shouldSkipRandomsStats,
    // usages,
  ]);

  return {
    loading,
    ready,
    presets,
    usages,
  };
};
