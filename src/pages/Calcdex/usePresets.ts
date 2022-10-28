import * as React from 'react';
import { PokemonUsageFuckedFormes } from '@showdex/consts/pokemon';
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
  if (!genlessFormat) {
    return 0;
  }

  // first, hard match the genless formats
  const matchesA = a.format === genlessFormat;
  const matchesB = b.format === genlessFormat;

  if (matchesA) {
    // no need to repeat this case below since this only occurs when `a` and `b` both match
    if (matchesB) {
      if (formatId(a.name) === 'showdownusage') {
        return 1;
      }

      if (formatId(b.name) === 'showdownusage') {
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
  if (a.format.endsWith(genlessFormat)) {
    return -1;
  }

  if (b.format.endsWith(genlessFormat)) {
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

  const speciesForme = pokemon?.transformedForme || pokemon?.speciesForme;
  const baseForme = speciesForme?.includes('-') // e.g., 'Keldeo-Resolute'
    ? dex?.species.get(speciesForme)?.baseSpecies // e.g., 'Keldeo'
    : null;

  const formes = Array.from(new Set([
    speciesForme,
    !!baseForme && PokemonUsageFuckedFormes.includes(baseForme) && baseForme,
    randomsFormat && !!speciesForme && !speciesForme.endsWith('-Gmax') && `${speciesForme}-Gmax`,
  ].filter(Boolean))).map((f) => formatId(f));

  const shouldSkip = disabled
    || !format
    || !gen
    || !genlessFormat;

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
    ...((!randomsFormat && [
      ...((!!gensPresets?.length && gensPresets) || []),
      ...((!!statsPresets?.length && statsPresets) || []),
    ]) || []).filter(Boolean).sort(sortPresets(genlessFormat)),
    ...((randomsFormat && !!randomsPresets?.length && randomsPresets) || []),
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
