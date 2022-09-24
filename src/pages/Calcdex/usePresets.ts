import * as React from 'react';
// import { FormatLabels } from '@showdex/consts';
import { usePokemonGensPresetQuery, usePokemonRandomsPresetQuery } from '@showdex/redux/services';
import { detectGenFromFormat } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';

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
  format?: string;

  /**
   * Whether the presets should not be fetched.
   *
   * @default false
   * @since 0.1.3
   */
  disabled?: boolean;
}

/**
 * Returns all the presets for the provided `speciesForme`.
 *
 * * No need to sanitize the `speciesForme`, as this will find presets of the closest matching `speciesForme` for you.
 *   - Particularly for randoms, where Pokemon may only have the G-Max forme (with `speciesForme` suffix `'-Gmax'`).
 * * Providing `true` to the optional `sort` argument will arrange the presets
 *   of the current `format` towards the top (i.e., index `0`).
 *   - Otherwise, they'll be in the order they were added in `presets`.
 * * Nomenclature of this function is more closely related to `Model.find()` from `mongoose` than `Array.find()`.
 *   - `Model.find()` runs a database query and returns an array of matching documents, which this function does do
 *     (without the database, of course).
 *   - `Array.find()` only returns a single document, which this function does not do.
 *   - `Array.filter()`, which is basically what this does, sounded like a terrible name.
 * * Returns an empty array (i.e., `[]`) if no matching presets were found.
 *
 * @since 0.1.3
 */
export type CalcdexPresetsFinder = (
  speciesForme: string,
  sort?: boolean,
) => CalcdexPokemonPreset[];

const l = logger('@showdex/pages/Calcdex/usePresets');

const sortPresets = (
  presets: CalcdexPokemonPreset[],
  genlessFormat: string,
): CalcdexPokemonPreset[] => {
  if (!genlessFormat) {
    return presets;
  }

  // const formatLabel = genlessFormat in FormatLabels ?
  //   FormatLabels[genlessFormat] :
  //   // genlessFormat.toUpperCase().slice(0, 3); // e.g., 'huhwtf' -> 'HUH'
  //   genlessFormat;

  // trailing space prevents something like 'OU-2X' being sorted before 'OU'
  // (assuming the genlessFormat is 'ou' and not 'doublesou')
  // const formatSearchString = `${formatLabel} `;

  return presets.sort((a, b) => {
    // if (a.name.startsWith(formatSearchString)) {
    //   return -1;
    // }

    if (a.format === genlessFormat) {
      return -1;
    }

    // if (b.name.startsWith(formatSearchString)) {
    //   return 1;
    // }

    if (b.format === genlessFormat) {
      return 1;
    }

    return 0;
  });
};

const UltFormeRegex = /-(?:Mega(?:-X|-Y)?|Gmax)$/;

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
  disabled,
}: CalcdexPresetsHookOptions = {}): CalcdexPresetsFinder => {
  // note: 'gen8bdspou' requires special treatment since Pokemon like Breloom don't exist in `gen8.json`,
  // despite `gen8.json` including presets for the 'bdspou' format (for Gen 8 Pokemon that also exist in BDSP)
  // (also rather unfortunately, there's a `gen8bdsprandombattle.json`, so there's that... LOL)
  const gen = format
    ? format?.includes('bdsp') && !format.includes('random')
      ? 4
      : detectGenFromFormat(format)
    : null; // e.g., 8 (if `format` is 'gen8randombattle')

  const baseGen = gen ? `gen${gen}` : null; // e.g., 'gen8' (obviously `gen` shouldn't be 0 here)
  const genlessFormat = baseGen ? format.replace(baseGen, '') : null; // e.g., 'randombattle'
  const randomsFormat = genlessFormat?.includes('random') ?? false;

  const shouldSkip = disabled || !format || !baseGen || !genlessFormat;

  const {
    data: gensPresets,
    isLoading: gensLoading,
  } = usePokemonGensPresetQuery({
    gen,
    format, // if it's BDSP, the query will automatically set the gen to 4
    // formatOnly: genlessFormat.includes('nationaldex'), // eh, gen8.json already includes nationaldex sets
  }, {
    skip: shouldSkip || randomsFormat,
  });

  const {
    data: randomsPresets,
    isLoading: randomsLoading,
  } = usePokemonRandomsPresetQuery({
    gen,
    format, // if it's BDSP, the query will automatically fetch from `gen8bdsprandombattle.json`
  }, {
    skip: shouldSkip || !randomsFormat,
  });

  const presets = React.useMemo(() => [
    ...((!randomsFormat && gensPresets) || []),
    ...((randomsFormat && randomsPresets) || []),
  ].filter(Boolean), [
    gensPresets,
    randomsFormat,
    randomsPresets,
  ]);

  const loading = React.useMemo(
    () => gensLoading || randomsLoading,
    [gensLoading, randomsLoading],
  );

  const find = React.useCallback<CalcdexPresetsFinder>((
    speciesForme,
    sort,
  ) => {
    if (!speciesForme) {
      if (__DEV__) {
        l.warn(
          'Missing required speciesForme argument.',
          '\n', 'speciesForme', speciesForme,
          // '\n', 'sort', sort || false,
          // '\n', 'presets', presets,
          '\n', '(You will only see this warning on development.)',
        );
      }

      return [];
    }

    if (!presets.length || loading) {
      // actually, since find() should just be spread alongside the CalcdexPokemon's existing presets (if any),
      // this warning would get really annoying
      // if (loading && __DEV__) {
      //   l.warn(
      //     'No presets are available since they are currently being fetched.',
      //     '\n', 'speciesForme', speciesForme,
      //     '\n', 'sort', sort || false,
      //     '\n', 'presets', presets,
      //     '\n', '(You will only see this warning on development.)',
      //   );
      // }

      return [];
    }

    // l.debug(
    //   'Attempting to find presets for', speciesForme,
    //   '\n', 'sort', sort || false,
    // );

    // e.g., evals to true w/ speciesForme 'Urshifu-Rapid-Strike-Gmax' or 'Charizard-Mega-X'
    const hasUltForme = UltFormeRegex.test(speciesForme);

    // note: ult formes are typically only available in randoms presets
    if (hasUltForme && randomsFormat) {
      // filter by randoms presets only w/ exact speciesForme match
      // (e.g., 'Urshifu' and 'Urshifu-Gmax' both exist in `gen8randombattle.json` [from the pkmn API])
      const ultPresets = presets.filter((p) => p.format.includes(genlessFormat) && p.speciesForme === speciesForme);

      if (ultPresets.length) {
        // l.debug(
        //   'Found ultPresets for', speciesForme,
        //   // '\n', 'ultPresets', ultPresets,
        // );

        return sort ? sortPresets(ultPresets, genlessFormat) : ultPresets;
      }
    }

    // since we're still here, that means the ult forme wasn't found in the randoms presets
    // e.g., 'Urshifu-Rapid-Strike-Gmax' -> 'Ursifu-Rapid-Strike'
    const nonUltForme = hasUltForme ? speciesForme.replace(UltFormeRegex, '') : speciesForme;

    // client sometimes will report a wildcard forme (indicating unrevealed an forme), which can be problematic
    // e.g., 'Urshifu-*' -> 'Urshifu'
    const nonWildForme = nonUltForme.replace(/-\*$/, '');

    // try again with the non-ult, non-wildcard forme this time
    // (...you know, I have a feeling there's probably a function in one of the @smogon/* or @pkmn/* packages that does all this)
    const nonWildPresets = presets.filter((p) => {
      // make sure we're only grabbing randoms presets if the format is randoms
      // (otherwise, ignore randoms presets for any other format)
      const randomsPreset = p.format.includes('random');
      const precondition = randomsFormat ? randomsPreset : !randomsPreset;

      return precondition && p.speciesForme === nonWildForme;
    });

    if (nonWildPresets.length) {
      // l.debug(
      //   'Found nonWildPresets for', speciesForme,
      //   '\n', 'nonWildPresets', nonWildPresets,
      // );

      return sort ? sortPresets(nonWildPresets, genlessFormat) : nonWildPresets;
    }

    // hmm... at this point, we'll try to obtain the actual base species forme
    // (unfortunately, there are Pokemon like Ho-Oh, Jangmo-o, Kommo-o, which have dashes in their names, so we gotta account for those)
    const hasAltForme = nonWildForme.includes('-') && ![
      'ho-oh',
      'jangmo-o',
      'indeedee-f', // 'Indeedee-M' should be just 'Indeedee'
      'kommo-o',
      'meowstic-f', // 'Meowstic-M' is just 'Meowstic', hopefully LOL
      'nidoran-m', // verified to be present in `gen7lc.json`
      'nidoran-f', // verified to be present in `gen7lc.json`
      'porygon-z',
    ].includes(nonWildForme.toLowerCase());

    // e.g., 'Aegislash-Shield' -> 'Aegislash', 'Ho-Oh' -> 'Ho-Oh' (left untouched, theoretically)
    const baseForme = hasAltForme ? nonWildForme.split('-')[0] : nonWildForme;

    // aiite, well, fuck it lol
    const basePresets = presets.filter((p) => {
      const randomsPreset = p.format.includes('random');
      const precondition = randomsFormat ? randomsPreset : !randomsPreset;

      // note: we're not doing a hard match here, just a partial one cause we're desparate
      // (inb4 "why do I get sets for completely unrelated Pokemon ???")
      return precondition && p.speciesForme.includes(baseForme);
    });

    if (__DEV__ && !basePresets.length) {
      l.warn(
        'Still couldn\'t find any presets for the initial speciesForme', speciesForme,
        '\n', 'Stage 1: nonUltForme', nonUltForme, 'hasUltForme', hasUltForme,
        '\n', 'Stage 2: nonWildForme', nonWildForme, 'hasAltForme', hasAltForme,
        '\n', 'Stage 3: baseForme', baseForme, 'hasAltForme', hasAltForme,
        // '\n', 'presets', presets,
        '\n', '(You will only see this warning on development.)',
      );
    }

    l.debug(
      'Returning basePresets for', speciesForme,
      '\n', 'basePresets', basePresets,
    );

    return basePresets;
  }, [
    genlessFormat,
    loading,
    presets,
    randomsFormat,
  ]);

  return find;
};
