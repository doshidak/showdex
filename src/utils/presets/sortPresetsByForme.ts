import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';

/**
 * Sorts `CalcdexPokemonPreset[]`'s by the provided `speciesForme`.
 *
 * * Exact matches in forme will be closer to the front (i.e., closer to index `0`).
 * * In what world would there be multiple `speciesForme`s being sorted?
 *   - Megas & Gmax formes!
 *   - Transformations!
 * * Meant to be used as the `compareFunction` of `CalcdexPokemonPreset[].sort()`.
 *
 * @since 1.1.8
 */
export const sortPresetsByForme = (
  speciesForme: string,
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => {
  if (!speciesForme) {
    return () => 0;
  }

  return (a, b) => {
    const matchesA = a.speciesForme === speciesForme;
    const matchesB = b.speciesForme === speciesForme;

    if (matchesA) {
      if (matchesB) {
        return 0;
      }

      return -1;
    }

    if (matchesB) {
      return 1;
    }

    return 0;
  };
};
