import { type GenerationNum } from '@smogon/calc';
import { getDexForFormat } from './getDexForFormat';

/**
 * Determines if the passed-in `species` is NFE (Not Fully Evolved).
 *
 * * `species` can be a species forme (type `string`) or `Showdown.Species` returned from
 *   `dex.species.get()`.
 * * Note that the `SmogonPokemon` class includes a `species.nfe` property,
 *   but since we're using the global Dex object, `species.nfe` is undefined.
 *
 * @since 1.0.3
 */
export const notFullyEvolved = (
  species: string | Showdown.Species,
  format?: string | GenerationNum,
): boolean => {
  const dex = getDexForFormat(format);

  if (!species || !dex) {
    return false;
  }

  const dexSpecies = typeof species === 'string'
    ? dex.species.get(species)
    : species;

  return dexSpecies?.evos?.some((evo) => {
    const evoSpecies = dex.species.get(evo);

    return !evoSpecies?.isNonstandard
      || [
        dexSpecies.isNonstandard,
        'Unobtainable', // apparently a fix for Hisuian prevos
      ].includes(evoSpecies?.isNonstandard);
  });
};
