import { type GenerationNum } from '@smogon/calc';
import {
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  type CalcdexPokemonPresetSource,
} from '@showdex/redux/store';
import { getPresetFormes } from './getPresetFormes';

/**
 * Filters the provided `presets[]` for the given `pokemon`.
 *
 * * If transformed, will also include the presets for the `transformedForme` as well, if available.
 *   - Presets of the `transformedForme` will come first in the returned array (i.e., lowest index values).
 * * Providing `formes[]` will bypass the `getPresetFormes()` lookup.
 * * Guaranteed to return an empty array.
 *
 * @todo Figure something out for my boi *Urshifu* lmao for `'sheet'`-sourced presets.
 * @since 1.1.7
 */
export const selectPokemonPresets = (
  presets: CalcdexPokemonPreset[],
  pokemon: CalcdexPokemon,
  source?: CalcdexPokemonPresetSource,
  format?: string | GenerationNum,
  formes?: string[],
  additionalPredicate?: (preset: CalcdexPokemonPreset) => boolean,
): CalcdexPokemonPreset[] => {
  if (!presets?.length || !pokemon?.speciesForme) {
    return presets || [];
  }

  const presetFormes = [
    ...(formes?.length ? formes : [
      ...getPresetFormes(pokemon.transformedForme, format),
      ...getPresetFormes(pokemon.speciesForme, format),
    ]),
  ];

  const currentForme = pokemon.transformedForme || pokemon.speciesForme;

  // fixed originally by malaow3 for OTS where non-serverSourced Urshifu-Rapid-Strike's init'd speciesForme is 'Urshifu'
  // from the Team Preview (until it's sent out), so when OTS is revealed at the beginning of the battle, the sheet for
  // 'Urshifu-Rapid-Strike' doesn't apply to the 'Urshifu' -- unfortunately this isn't a simple "fucked forme" fix cause
  // 'Urshifu' & 'Urshifu-Rapid-Strike' are distinct; adding 'Urshifu' to the aforementioned list would **always** treat
  // them the same for any type of preset, but we only want this for 'sheet'-sourced presets.. soooo I guess this is the
  // best workaround for now LOL
  if (source === 'sheet' && currentForme === 'Urshifu') {
    presetFormes.push('Urshifu-Rapid-Strike');
  }

  if (!presetFormes.length) {
    return presets;
  }

  const filtered = presets.filter((preset) => (
    (!source || preset.source === source) // just making sure lol
      && presetFormes.includes(preset.speciesForme)
      && (
        typeof additionalPredicate !== 'function'
          || additionalPredicate(preset)
      )
  ));

  if (!pokemon.transformedForme) {
    return filtered;
  }

  return filtered.sort((a, b) => {
    if (a.speciesForme === currentForme) {
      return -1;
    }

    if (b.speciesForme === currentForme) {
      return 1;
    }

    return 0;
  });
};
