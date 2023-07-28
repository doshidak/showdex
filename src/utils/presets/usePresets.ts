import * as React from 'react';
// import LzString from 'lz-string';
import {
  usePokemonFormatPresetQuery,
  usePokemonFormatStatsQuery,
  usePokemonRandomsPresetQuery,
  usePokemonRandomsStatsQuery,
} from '@showdex/redux/services';
import {
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  useCalcdexSettings,
} from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, getGenlessFormat } from '@showdex/utils/dex';
// import { fileSize } from '@showdex/utils/humanize';
// import { dehydratePresets, hydratePresets } from '@showdex/utils/hydro';
import { getPresetFormes } from './getPresetFormes';

/**
 * Options for the `usePresets()` hook.
 *
 * @since 0.1.3
 */
export interface CalcdexPresetsHookOptions {
  /**
   * Format of the battle.
   *
   * * Can be derived from the `battleId`, which contains the format as the second element
   *   when `battleId` is `split()` using delimiter `'-'`.
   *   - For example, if the `battleId` is `'battle-gen8randombattle-1234567890'`,
   *     then `split()`ing the string by `'-'` results in `['battle', 'gen8randombattle', '1234567890']`.
   *   - Pass in the second element (i.e., `'gen8randombattle'` at index `1`) as this value.
   *
   * @example 'gen8randombattle'
   * @warning Fetching will be disabled (regardless of the `disabled` option) if this value is falsy.
   * @since 0.1.3
   */
  format: string;

  /**
   * Optional presets from the `pokemon` to include in the internal list of presets.
   *
   * @since 1.0.3
   */
  pokemon?: DeepPartial<CalcdexPokemon>;

  /**
   * Whether the presets should not be fetched.
   *
   * @default false
   * @since 0.1.3
   */
  disabled?: boolean;
}

/**
 * Return object of the `usePresets()` hook.
 *
 * @since 1.0.3
 */
export interface CalcdexPresetsHookInterface {
  loading: boolean;
  presets: CalcdexPokemonPreset[];
  usages: CalcdexPokemonPreset[];
}

const sortPresets = (
  genlessFormat?: string,
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => (a, b) => {
  if (!genlessFormat) {
    return 0;
  }

  // remove 'series<#>' from the genlessFormat
  const format = genlessFormat.replace(/series\d+/i, '');

  // first, hard match the genless formats
  const matchesA = a.format === format;
  const matchesB = b.format === format;

  if (matchesA) {
    // no need to repeat this case below since this only occurs when `a` and `b` both match
    if (matchesB) {
      if (a.source === 'usage') {
        return 1;
      }

      if (b.source === 'usage') {
        return -1;
      }

      // update (2023/07/27): WAIT how did I miss this case LMAO no wonder why the presets are backwards HAHAHA
      // holy shit I'm actually dumb af
      return 0;
    }

    return -1;
  }

  if (matchesB) {
    return 1;
  }

  // at this point, we should've gotten all the hard matches, so we can do partial matching
  // (e.g., 'ou' would be sorted at the lowest indices already, so we can pull something like 'bdspou' to the top,
  // but not something like '2v2doubles', which technically includes 'ou', hence the endsWith())
  if (a.format.endsWith(format)) {
    return -1;
  }

  if (b.format.endsWith(format)) {
    return 1;
  }

  return 0;
};

const selectPresetsFromResult = (
  presets: CalcdexPokemonPreset[],
  formes: string[],
): CalcdexPokemonPreset[] => {
  if (!presets?.length || !formes?.length) {
    return [];
  }

  // attempt to find presets of speciesFormes that match exactly with the firstForme
  const [firstForme] = formes;
  const firstFormePresets = presets
    .filter((p) => !!p?.speciesForme && formatId(p.speciesForme) === firstForme);

  if (firstFormePresets.length) {
    return firstFormePresets;
  }

  // if only 1 forme was provided, just return an empty array
  if (formes.length === 1) {
    return [];
  }

  // return any preset assigned to the current speciesForme (which at this point won't exist, probably) and baseForme
  return presets.filter((p) => !!p?.speciesForme && formes.includes(formatId(p.speciesForme)));
};

// const l = logger('@showdex/utils/presets/usePresets()');

/**
 * Provides convenient tools to access the presets stored in RTK Query.
 *
 * * Automatically fetches the presets given the `options.format` value is valid.
 *   - Obviously not the case if `options.disabled` is `true`.
 *
 * @since 0.1.3
 */
export const usePresets = ({
  format,
  pokemon,
  disabled,
}: CalcdexPresetsHookOptions = {
  format: null,
}): CalcdexPresetsHookInterface => {
  const settings = useCalcdexSettings();

  const maxAge: Duration = typeof settings?.maxPresetAge === 'number' && settings.maxPresetAge > 0
    ? { days: settings.maxPresetAge }
    : null;

  const gen = detectGenFromFormat(format);
  const genlessFormat = getGenlessFormat(format); // e.g., 'gen8randombattle' -> 'randombattle'
  const randoms = genlessFormat?.includes('random');

  const speciesForme = pokemon?.transformedForme || pokemon?.speciesForme; // e.g., 'Necrozma-Ultra'
  const formes = getPresetFormes(speciesForme, format, true);

  const shouldSkip = disabled
    || !format
    || !gen
    || !genlessFormat;

  const shouldSkipFormats = shouldSkip
    || randoms
    || !settings?.downloadSmogonPresets;

  const {
    formatPresets,
    formatPending,
    formatLoading,
  } = usePokemonFormatPresetQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipFormats,

    selectFromResult: ({ data, isUninitialized, isLoading }) => ({
      formatPresets: selectPresetsFromResult(data, formes),
      formatPending: isUninitialized,
      formatLoading: isLoading,
    }),
  });

  // l.debug(
  //   '\n', 'shouldSkip', shouldSkip,
  //   '\n', 'downloadSmogonStats', settings?.downloadSmogonPresets,
  //   '\n', 'downloadUsageStats', settings?.downloadUsageStats,
  //   '\n', 'downloadRandomsPresets', settings?.downloadRandomsPresets,
  // );

  const shouldSkipFormatStats = shouldSkip
    || randoms
    || !settings?.downloadUsageStats;

  const {
    formatStatsPresets,
    formatStatsPending,
    formatStatsLoading,
  } = usePokemonFormatStatsQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipFormatStats,

    selectFromResult: ({ data, isUninitialized, isLoading }) => ({
      formatStatsPresets: selectPresetsFromResult(data, formes),
      formatStatsPending: isUninitialized,
      formatStatsLoading: isLoading,
    }),
  });

  const shouldSkipRandoms = shouldSkip
    || !randoms
    || !settings?.downloadRandomsPresets;

  const {
    randomsPresets,
    randomsPending,
    randomsLoading,
  } = usePokemonRandomsPresetQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipRandoms,

    selectFromResult: ({ data, isUninitialized, isLoading }) => ({
      randomsPresets: selectPresetsFromResult(data, formes),
      randomsPending: isUninitialized,
      randomsLoading: isLoading,
    }),
  });

  const shouldSkipRandomsStats = shouldSkip
    || !randoms
    || !settings?.downloadUsageStats;

  const {
    randomsStatsPresets,
    randomsStatsPending,
    randomsStatsLoading,
  } = usePokemonRandomsStatsQuery({
    gen,
    format,
    maxAge,
  }, {
    skip: shouldSkipRandomsStats,

    selectFromResult: ({ data, isUninitialized, isLoading }) => ({
      randomsStatsPresets: selectPresetsFromResult(data, formes),
      randomsStatsPending: isUninitialized,
      randomsStatsLoading: isLoading,
    }),
  });

  // probably the guessed 'Yours' preset
  const nonStoragePresets = React.useMemo(() => pokemon?.presets?.filter((p) => (
    !['storage', 'storage-box'].includes(p?.source)
  )) ?? [], [
    pokemon,
  ]);

  // presets derived from the Teambuilder
  const storagePresets = React.useMemo(() => pokemon?.presets?.filter((p) => (
    ['storage', 'storage-box'].includes(p?.source)
  )) ?? [], [
    pokemon,
  ]);

  // build the final list of 'smogon'-sourced presets
  const presets = React.useMemo(() => {
    const output: CalcdexPokemonPreset[] = [];

    if (nonStoragePresets?.length) {
      output.push(...nonStoragePresets);
    }

    // randoms presets
    if (randoms && randomsPresets?.length) {
      output.push(...randomsPresets);
    }

    // non-randoms (e.g., OU, Ubers, etc.) presets
    if (!randoms) {
      const sorted: CalcdexPokemonPreset[] = [];

      if (formatPresets?.length) {
        // update (2023/07/27): this is why they pay me the big bux
        // update (2023/07/27): jk, this is why I'm not working at Google -- see sortPresets() above
        sorted.push(...formatPresets);
      }

      if (formatStatsPresets?.length) {
        sorted.push(...formatStatsPresets);
      }

      if (sorted.length) {
        sorted.sort(sortPresets(genlessFormat));
        output.push(...sorted);
      }
    }

    // put Teambuilder presets last
    if (storagePresets.length) {
      output.push(...storagePresets);
    }

    return output;
  }, [
    genlessFormat,
    formatPresets,
    formatStatsPresets,
    nonStoragePresets,
    randoms,
    randomsPresets,
    storagePresets,
  ]);

  // note: randoms usage set, though a proper CalcdexPokemonPreset, is only used to access its usage stats data
  // (i.e., it's not included in `presets`; only the 'Randoms' preset is available [in addition to 'Yours', if applicable])
  const usages = React.useMemo(() => [
    ...((!randoms && !!formatStatsPresets?.length && formatStatsPresets) || []),
    ...((randoms && !!randomsStatsPresets?.length && randomsStatsPresets) || []),
  ].filter(Boolean), [
    formatStatsPresets,
    randoms,
    randomsStatsPresets,
  ]);

  // update (2023/02/01): since the great Calcdex refactoring (i.e., React no longer has direct access to the `battle`,
  // only through the synced values in Redux), the UI loads too fast, so loading would be initially false, causing the
  // showGenetics of the initially selected Pokemon to be true from the auto-preset React effect in CalcdexPokeProvider.
  // if we're not skipping, we'll also look at the pending states (alias of isUninitialized) since the fetching may not
  // have started yet (so loading would be false, which is the cause of our showGenetics problem).
  const loading = React.useMemo(() => (
    (!shouldSkipFormats && (formatPending || formatLoading))
      || (!shouldSkipFormatStats && (formatStatsPending || formatStatsLoading))
      || (!shouldSkipRandoms && (randomsPending || randomsLoading))
      || (!shouldSkipRandomsStats && (randomsStatsPending || randomsStatsLoading))
  ), [
    formatPending,
    formatLoading,
    formatStatsPending,
    formatStatsLoading,
    randomsPending,
    randomsLoading,
    randomsStatsPending,
    randomsStatsLoading,
    shouldSkipFormats,
    shouldSkipFormatStats,
    shouldSkipRandoms,
    shouldSkipRandomsStats,
  ]);

  // if (!loading && (presets?.length || usages?.length)) {
  //   const sourcePresets = [
  //     ...presets,
  //     ...usages,
  //   ];
  //
  //   const dehydratedPresets = dehydratePresets(sourcePresets);
  //   const rehydratedPresets = hydratePresets(dehydratedPresets);
  //
  //   l.debug(
  //     'Testing rehydration of', sourcePresets.length, 'presets for', speciesForme,
  //     '\n', 'source', sourcePresets,
  //     '\n', 'dehydrated (raw size)', fileSize(dehydratedPresets.length * 2),
  //     '(compressed size)', fileSize(LzString.compressToUTF16(dehydratedPresets).length * 2),
  //     '\n', 'dehydrated (value)', dehydratedPresets,
  //     '\n', 'rehydrated', rehydratedPresets,
  //   );
  // }

  // l.debug(
  //   'gen', gen, 'format', format,
  //   '\n', 'speciesForme', speciesForme, 'formes', formes,
  //   '\n', 'loading', loading,
  //   '\n', 'presets', presets,
  //   '\n', 'usage', usage,
  // );

  return {
    loading,
    presets,
    usages,
  };
};
