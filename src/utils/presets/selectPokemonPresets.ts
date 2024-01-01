import { type GenerationNum } from '@smogon/calc';
import {
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  type CalcdexPokemonPresetSource,
} from '@showdex/interfaces/calc';
// import { logger } from '@showdex/utils/debug';
import { detectGenFromFormat, getGenfulFormat, getGenlessFormat } from '@showdex/utils/dex';
import { getPresetFormes } from './getPresetFormes';
import { sortPresetsByForme } from './sortPresetsByForme';

// const l = logger('@showdex/utils/presets/selectPokemonPresets()');

/**
 * Filters the provided `presets[]` for the given `pokemon`.
 *
 * * If transformed, will also include the presets for the `transformedForme` as well, if available.
 *   - Presets of the `transformedForme` will come first in the returned array (i.e., lowest index values).
 * * Providing `formes[]` will bypass the `getPresetFormes()` lookup.
 * * Sometimes you want just presets for the `transformedForme`, so just set `select` to `'transformed'`.
 *   - Or just the `speciesForme`? Set it to `'species'`.
 *   - How about `transformedForme` if it exists, otherwise, default to `speciesForme`? Set it to `'one'`.
 *   - Wait, you said **both** `transformedForme` (if applicable) & `speciesForme`? Set it to `'any'` (default behavior).
 * * Guaranteed to return an empty array.
 *
 * @since 1.1.7
 */
export const selectPokemonPresets = (
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
  config?: {
    format?: string | GenerationNum;
    formatOnly?: boolean;
    source?: CalcdexPokemonPresetSource;
    ignoreSource?: boolean;
    select?: 'species' | 'transformed' | 'one' | 'any';
    formes?: string[];
    filter?: (preset: CalcdexPokemonPreset) => boolean;
  },
): CalcdexPokemonPreset[] => {
  if (!presets?.length || !pokemon?.speciesForme) {
    return presets || [];
  }

  const {
    format,
    formatOnly,
    source,
    ignoreSource,
    select = 'any',
    formes,
    filter: additionalPredicate,
  } = config || {};

  const presetFormes = formes?.length
    ? formes
    : [
      ['transformed', 'one', 'any'].includes(select) && pokemon.transformedForme,
      (
        ['species', 'any'].includes(select)
          || !pokemon.transformedForme
      ) && pokemon.speciesForme,
    ]
      .filter(Boolean)
      .flatMap((forme) => getPresetFormes(forme, {
        format,
        source,
      }));

  const currentForme = pokemon.transformedForme || pokemon.speciesForme;

  // fixed originally by malaow3 for OTS where non-server-sourced Urshifu-Rapid-Strike's init'd speciesForme is 'Urshifu'
  // from the Team Preview (until it's sent out), so when OTS is revealed at the beginning of the battle, the sheet for
  // 'Urshifu-Rapid-Strike' doesn't apply to the 'Urshifu' -- unfortunately this isn't a simple "fucked forme" fix cause
  // 'Urshifu' & 'Urshifu-Rapid-Strike' are distinct; adding 'Urshifu' to the aforementioned list would **always** treat
  // them the same for any type of preset, but we only want this for 'sheet'-sourced presets.. soooo I guess this is the
  // best workaround for now LOL
  // update (2023/10/16): addressed in getPresetFormes()
  // if (source === 'sheet' && currentForme === 'Urshifu') {
  //   presetFormes.push('Urshifu-Rapid-Strike');
  // }

  if (!presetFormes.length) {
    return presets;
  }

  const gen = formatOnly
    ? detectGenFromFormat(format)
    : null;

  const genlessFormat = formatOnly && typeof format === 'string'
    ? getGenlessFormat(format)
    : null;

  const filtered = presets.filter((preset) => (
    (!source || ignoreSource || preset.source === source)
      && (!genlessFormat || (getGenfulFormat(gen, genlessFormat) === getGenfulFormat(preset.gen, preset.format)))
      && presetFormes.includes(preset.speciesForme)
      && (typeof additionalPredicate !== 'function' || additionalPredicate(preset))
  ));

  return filtered.sort(sortPresetsByForme(currentForme));
};
