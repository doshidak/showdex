import * as React from 'react';
import {
  usePokemonFormatPresetQuery,
  usePokemonFormatStatsQuery,
  usePokemonRandomsPresetQuery,
  usePokemonRandomsStatsQuery,
} from '@showdex/redux/services';
import { useCalcdexSettings } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import {
  detectGenFromFormat,
  // getDexForFormat,
  getGenlessFormat,
  getPresetFormes,
} from '@showdex/utils/battle';
// import { logger } from '@showdex/utils/debug';
import type { CalcdexPokemon, CalcdexPokemonPreset } from '@showdex/redux/store';

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

// const l = logger('@showdex/pages/Calcdex/usePresets');

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

  // const dex = getDexForFormat(format);
  const gen = detectGenFromFormat(format);

  const genlessFormat = getGenlessFormat(format); // e.g., 'gen8randombattle' -> 'randombattle'
  const randomsFormat = genlessFormat?.includes('random') ?? false;

  const speciesForme = pokemon?.transformedForme || pokemon?.speciesForme; // e.g., 'Necrozma-Ultra'
  // const dexForme = speciesForme?.includes('-') ? dex?.species.get(speciesForme) : null;

  // const baseForme = dexForme?.baseSpecies; // e.g., 'Necrozma'
  // const checkBaseForme = !!baseForme && baseForme !== speciesForme;

  // const battleFormes = Array.isArray(dexForme?.battleOnly)
  //   ? dexForme.battleOnly // e.g., ['Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane']
  //   : [dexForme?.battleOnly].filter(Boolean); // e.g., (for some other Pokemon) 'Darmanitan-Galar' -> ['Darmanitan-Galar']

  // const formes = Array.from(new Set([
  //   speciesForme, // e.g., 'Necrozma-Ultra' (typically wouldn't have any sets)
  //   !!battleFormes.length && battleFormes.find((f) => PokemonUsageFuckedFormes.includes(f)), // e.g., 'Necrozma-Dawn-Wings' (sets would match this forme)
  //   !battleFormes.length && checkBaseForme && PokemonUsageFuckedFormes.includes(baseForme) && baseForme, // e.g., 'Necrozma' (wouldn't apply here tho)
  //   randomsFormat && !!speciesForme && !speciesForme.endsWith('-Gmax') && `${speciesForme}-Gmax`, // e.g., (for some other Pokemon) 'Gengar-Gmax'
  // ].filter(Boolean))).map((f) => formatId(f));

  const formes = getPresetFormes(speciesForme, format, true);

  const shouldSkip = disabled
    || !format
    || !gen
    || !genlessFormat;

  const {
    formatPresets,
    isLoading: formatLoading,
  } = usePokemonFormatPresetQuery({
    gen,
    format,
    formatOnly: genlessFormat.includes('bdsp'),
    // formatOnly: genlessFormat.includes('nationaldex'), // eh, gen8.json already includes nationaldex sets
  }, {
    skip: shouldSkip || randomsFormat || !settings?.downloadSmogonPresets,

    selectFromResult: ({ data, isLoading }) => ({
      formatPresets: selectPresetsFromResult(data, formes),
      isLoading,
    }),
  });

  // l.debug(
  //   '\n', 'shouldSkip', shouldSkip,
  //   '\n', 'downloadSmogonStats', settings?.downloadSmogonPresets,
  //   '\n', 'downloadUsageStats', settings?.downloadUsageStats,
  //   '\n', 'downloadRandomsPresets', settings?.downloadRandomsPresets,
  // );

  const {
    formatStatsPresets,
    isLoading: formatStatsLoading,
  } = usePokemonFormatStatsQuery({
    gen,
    format,
  }, {
    skip: shouldSkip || randomsFormat || !settings?.downloadUsageStats,

    selectFromResult: ({ data, isLoading }) => ({
      formatStatsPresets: selectPresetsFromResult(data, formes),
      isLoading,
    }),
  });

  const {
    randomsPresets,
    isLoading: randomsLoading,
  } = usePokemonRandomsPresetQuery({
    gen,
    format, // if it's BDSP, the query will automatically fetch from `gen8bdsprandombattle.json`
  }, {
    skip: shouldSkip || !randomsFormat || !settings?.downloadRandomsPresets,

    selectFromResult: ({ data, isLoading }) => ({
      randomsPresets: selectPresetsFromResult(data, formes),
      isLoading,
    }),
  });

  const {
    randomsStatsPresets,
    isLoading: randomsStatsLoading,
  } = usePokemonRandomsStatsQuery({
    gen,
    format, // supplying both this and `gen`, but `format` will take precedence over `gen`
  }, {
    skip: shouldSkip || !randomsFormat || !settings?.downloadUsageStats,

    selectFromResult: ({ data, isLoading }) => ({
      randomsStatsPresets: selectPresetsFromResult(data, formes),
      isLoading,
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

  const presets = React.useMemo(() => [
    // ...((!!pokemon?.presets?.length && pokemon.presets) || []),
    ...nonStoragePresets,
    ...((!randomsFormat && [
      ...((!!formatPresets?.length && formatPresets) || []),
      ...((!!formatStatsPresets?.length && formatStatsPresets) || []),
    ]) || []).filter(Boolean).sort(sortPresets(genlessFormat)),
    ...((randomsFormat && !!randomsPresets?.length && randomsPresets) || []),
    ...storagePresets, // put Teambuilder presets last
  ].filter(Boolean), [
    genlessFormat,
    formatPresets,
    formatStatsPresets,
    nonStoragePresets,
    // pokemon,
    randomsFormat,
    randomsPresets,
    storagePresets,
  ]);

  // note: randoms usage set, though a proper CalcdexPokemonPreset, is only used to access its usage stats data
  // (i.e., it's not included in `presets`; only the 'Randoms' preset is available [in addition to 'Yours', if applicable])
  const usages = React.useMemo(() => [
    ...((!randomsFormat && !!formatStatsPresets?.length && formatStatsPresets) || []),
    ...((randomsFormat && !!randomsStatsPresets?.length && randomsStatsPresets) || []),
  ].filter(Boolean), [
    formatStatsPresets,
    randomsFormat,
    randomsStatsPresets,
  ]);

  const loading = React.useMemo(() => (
    formatLoading
      || formatStatsLoading
      || randomsLoading
      || randomsStatsLoading
  ), [
    formatLoading,
    formatStatsLoading,
    randomsLoading,
    randomsStatsLoading,
  ]);

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
