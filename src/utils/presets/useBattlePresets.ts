import * as React from 'react';
import { type Duration } from 'date-fns';
import { type CalcdexPokemonPreset, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import {
  usePokemonBundledPresetQuery,
  usePokemonFormatPresetQuery,
  usePokemonFormatStatsQuery,
  usePokemonRandomsPresetQuery,
  usePokemonRandomsStatsQuery,
} from '@showdex/redux/services';
import { useCalcdexSettings, useTeamdexPresets } from '@showdex/redux/store';
// import { logger } from '@showdex/utils/debug';
import {
  detectGenFromFormat,
  getGenfulFormat,
  getGenlessFormat,
  legalLockedFormat,
  parseBattleFormat,
} from '@showdex/utils/dex';
import { type CalcdexPokemonUsageAltSorter, usageAltPercentFinder, usageAltPercentSorter } from '@showdex/utils/presets';

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

  /**
   * Compiled species forme usage data derived from `usages[]`.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.2.1
   */
  formeUsages: CalcdexPokemonUsageAlt<string>[];

  /**
   * Memoized mapping of format labels from `parseBattleFormat()`.
   *
   * * Used as an optimization to provide into sorters like `sortPresetsByFormat()` & `buildPresetOptions()`.
   *
   * @default
   * ```ts
   * {}
   * ```
   * @since 1.2.1
   */
  formatLabelMap: Record<string, string>;

  /**
   * Memoized forme usage percent finder.
   *
   * * Used as an optimization for passing into `buildFormeOptions()` in the Honkdex.
   *
   * @since 1.2.3
   */
  formeUsageFinder: (value: string) => string;

  /**
   * Memoized forme usage percent sorter.
   *
   * * Used as an optimization for passing into `buildFormeOptions()` in the Honkdex.
   *
   * @since 1.2.3
   */
  formeUsageSorter: CalcdexPokemonUsageAltSorter<string>;
}

// const l = logger('@showdex/utils/presets/useBattlePresets()');

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

  const {
    base: formatBase,
    label: formatLabel,
  } = parseBattleFormat(format);

  const legalFormat = legalLockedFormat(format);

  const {
    downloadSmogonPresets,
    downloadRandomsPresets,
    downloadUsageStats,
    includeTeambuilder,
    includeOtherMetaPresets,
    includePresetsBundles,
    maxPresetAge,
  } = useCalcdexSettings();

  const teamdexPresets = useTeamdexPresets();

  const maxAge: Duration = typeof maxPresetAge === 'number' && maxPresetAge > 0
    ? { days: maxPresetAge }
    : null;

  const gen = detectGenFromFormat(format);
  const genlessFormat = getGenlessFormat(format);
  const randoms = genlessFormat?.includes('random');

  const teambuilderPresets = React.useMemo(() => (
    includeTeambuilder !== 'never'
      && !!gen
      && !randoms
      && teamdexPresets.filter((p) => (
        p?.gen === gen
          && (includeTeambuilder !== 'teams' || p.source === 'storage')
          && (includeTeambuilder !== 'boxes' || p.source === 'storage-box')
      ))
  ) || [], [
    gen,
    includeTeambuilder,
    randoms,
    teamdexPresets,
  ]);

  const shouldSkipAny = disabled || !gen || !genlessFormat;
  const shouldSkipBundles = shouldSkipAny || !includePresetsBundles?.length;
  const shouldSkipFormats = shouldSkipAny || randoms || !downloadSmogonPresets;
  const shouldSkipFormatStats = shouldSkipAny || randoms || !downloadUsageStats;
  const shouldSkipRandoms = shouldSkipAny || !randoms || !downloadRandomsPresets;
  const shouldSkipRandomsStats = shouldSkipAny || !randoms || !downloadUsageStats;

  const {
    data: bundledPresets,
    isUninitialized: bundledPresetsPending,
    isLoading: bundledPresetsLoading,
  } = usePokemonBundledPresetQuery({
    gen,
    bundleIds: includePresetsBundles,
  }, {
    skip: shouldSkipBundles,
  });

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
    formatOnly: true,
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
    formatOnly: true,
    maxAge,
  }, {
    skip: shouldSkipRandomsStats,
  });

  const presets = React.useMemo<CalcdexPokemonPreset[]>(() => {
    if (randoms) {
      return [...(randomsPresets || [])];
    }

    const output = [
      ...(teambuilderPresets || []),
      ...(bundledPresets || []),
      ...(formatPresets || []),
      ...(formatStats || []),
    ];

    if (!legalFormat || includeOtherMetaPresets) {
      return output;
    }

    // note: legalLockedFormat() internally removes the gen, so `p.format` being genless is all g
    return output.filter((p) => legalLockedFormat(p.format));
  }, [
    bundledPresets,
    formatPresets,
    formatStats,
    includeOtherMetaPresets,
    legalFormat,
    randoms,
    randomsPresets,
    teambuilderPresets,
  ]);

  const formatLabelMap = React.useMemo(() => presets.reduce((prev, preset) => {
    if (!preset?.calcdexId) {
      return prev;
    }

    const presetFormat = getGenfulFormat(preset.gen, preset.format);

    if (presetFormat && !prev[presetFormat]) {
      prev[presetFormat] = parseBattleFormat(presetFormat).label;
    }

    return prev;
  }, {
    ...(!!formatBase && !!formatLabel && {
      [getGenfulFormat(gen, formatBase)]: formatLabel,
    }),
  } as Record<string, string>), [
    formatBase,
    formatLabel,
    gen,
    presets,
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

  // build the usage alts, if provided from usages[]
  // e.g., [['Great Tusk', 0.3739], ['Kingambit', 0.3585], ['Dragapult', 0.0746], ...]
  const formeUsages = React.useMemo<CalcdexPokemonUsageAlt<string>[]>(() => (
    usages
      .filter((u) => !!u?.speciesForme && !!u.formeUsage)
      .map((u) => [u.speciesForme, u.formeUsage])
  ), [
    usages,
  ]);

  const formeUsageFinder = React.useMemo(
    () => usageAltPercentFinder(formeUsages, true),
    [formeUsages],
  );

  const formeUsageSorter = React.useMemo(
    () => usageAltPercentSorter(formeUsageFinder),
    [formeUsageFinder],
  );

  const pending = (
    (!shouldSkipFormats && formatPresetsPending)
      || (!shouldSkipBundles && bundledPresetsPending)
      || (!shouldSkipFormatStats && formatStatsPending)
      || (!shouldSkipRandoms && randomsPresetsPending)
      || (!shouldSkipRandomsStats && randomsStatsPending)
  );

  const loading = (
    pending
      || (!shouldSkipBundles && bundledPresetsLoading)
      || (!shouldSkipFormats && formatPresetsLoading)
      || (!shouldSkipFormatStats && formatStatsLoading)
      || (!shouldSkipRandoms && randomsPresetsLoading)
      || (!shouldSkipRandomsStats && randomsStatsLoading)
  );

  const ready = (
    shouldSkipFormats
      && shouldSkipBundles
      && shouldSkipFormatStats
      && shouldSkipRandoms
      && shouldSkipRandomsStats
  ) || (
    !pending
      && !loading
  );

  return {
    loading,
    ready,
    presets,
    usages,
    formatLabelMap,
    formeUsages,
    formeUsageFinder,
    formeUsageSorter,
  };
};
