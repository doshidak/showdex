import * as React from 'react';
import {
  usePokemonFormatStatsQuery,
  usePokemonPresetQuery,
  usePokemonRandomsPresetQuery,
} from '@showdex/redux/services';
import { useCalcdexSettings } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import { detectGenFromFormat, getDexForFormat, getGenlessFormat } from '@showdex/utils/battle';
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
  presets: CalcdexPokemonPreset[];
  presetsLoading: boolean;
}

// const l = logger('@showdex/pages/Calcdex/usePresets');

const sortPresets = (
  genlessFormat?: string,
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => (a, b) => {
  // if (a.name.startsWith(formatSearchString)) {
  //   return -1;
  // }

  if (!genlessFormat) {
    return 0;
  }

  if (a.format.includes(genlessFormat)) {
    return -1;
  }

  // if (b.name.startsWith(formatSearchString)) {
  //   return 1;
  // }

  if (b.format.includes(genlessFormat)) {
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

  const [firstForme] = formes;
  const firstFormePresets = presets
    .filter((p) => !!p?.speciesForme && formatId(p.speciesForme) === firstForme);

  if (firstFormePresets.length) {
    return firstFormePresets;
  }

  return presets.filter((p) => !!p?.speciesForme && formes.includes(formatId(p.speciesForme)));
};

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

  const dex = getDexForFormat(format);
  const gen = detectGenFromFormat(format);

  const genlessFormat = getGenlessFormat(format); // e.g., 'gen8randombattle' -> 'randombattle'
  const randomsFormat = genlessFormat?.includes('random') ?? false;

  const shouldSkip = disabled || !format || !gen || !genlessFormat;

  const speciesForme = pokemon?.transformedForme || pokemon?.speciesForme;
  const formes = Array.from(new Set([
    formatId(speciesForme),
    speciesForme?.includes('-') && formatId(dex?.species.get(speciesForme)?.baseSpecies),
  ].filter(Boolean)));

  const {
    gensPresets,
    isLoading: gensLoading,
  } = usePokemonPresetQuery({
    gen,
    format,
    formatOnly: genlessFormat.includes('bdsp'),
    // formatOnly: genlessFormat.includes('nationaldex'), // eh, gen8.json already includes nationaldex sets
  }, {
    skip: shouldSkip || randomsFormat || !settings?.downloadSmogonPresets,

    selectFromResult: ({ data, isLoading }) => ({
      gensPresets: selectPresetsFromResult(data, formes),
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
    statsPresets,
    isLoading: statsLoading,
  } = usePokemonFormatStatsQuery({
    gen,
    format,
  }, {
    skip: shouldSkip || randomsFormat || !settings?.downloadUsageStats,

    selectFromResult: ({ data, isLoading }) => ({
      statsPresets: selectPresetsFromResult(data, formes),
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

  const presets = React.useMemo(() => [
    ...((!!pokemon?.presets?.length && pokemon.presets) || []),
    ...[
      ...((!randomsFormat && !!gensPresets?.length && gensPresets) || []),
      ...((!randomsFormat && !!statsPresets?.length && statsPresets) || []),
      ...((randomsFormat && !!randomsPresets?.length && randomsPresets) || []),
    ].filter(Boolean).sort(sortPresets(genlessFormat)),
  ].filter(Boolean), [
    genlessFormat,
    gensPresets,
    pokemon,
    randomsFormat,
    randomsPresets,
    statsPresets,
  ]);

  const presetsLoading = React.useMemo(
    () => gensLoading || statsLoading || randomsLoading,
    [gensLoading, randomsLoading, statsLoading],
  );

  return {
    presets,
    presetsLoading,
  };
};
