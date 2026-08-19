import { type GenerationNum, type MoveName } from '@smogon/calc';
import { formatId } from '@showdex/utils/core';
import { getPokemonLearnset } from '@showdex/utils/dex';

/**
 * Tries to detect if a Pokemon is actually Zoroark based on using an illegal move in Randoms.
 *
 * @returns 'Zoroark' when the Pokemon should be treated as Zoroark, otherwise null
 * Implemented for scalability instead of a boolean check in case Zoroak's other form or maybe more illusioners added into randoms
 */

export const detectIllusion = (
  speciesForme: string,
  move: MoveName,
  gen: GenerationNum,
  format?: string,
): string | null => {
  if (!speciesForme || !move || !gen || gen < 5) {
    return null;
  }

  const speciesId = formatId(speciesForme);
  if (speciesId.includes('zoroark')) {
    return null;
  }

  const formatKey = format || `gen${gen}`;
  const apparentLearnset = getPokemonLearnset(formatKey, speciesForme, false);
  if (apparentLearnset.includes(move)) {
    return null;
  }

  const zoroLearnset = getPokemonLearnset(formatKey, 'Zoroark', false);
  if (zoroLearnset.includes(move)) {
    return 'Zoroark';
  }

  // const zoro2Learnset = getPokemonLearnset(formatKey, 'Zoroark-Hisuian', false);
  // if (zoro2Learnset.includes(move)) {
  //   return 'Zoroark-Hisuian';
  // }
  //
  // Leaving this aside for now until Hisuian Zoroak is introduced into randoms


  // Fallback checks
  const Dex = (window as any).Dex as {
    getLearnset: (species: string) => Record<string, unknown> | null | undefined;
  };

  const moveId = formatId(move);
  const learnset = Dex.getLearnset(speciesForme);

  if (learnset && moveId in learnset) {
    return null;
  }

  const dexZoroLearnset = Dex.getLearnset('Zoroark');
  if (dexZoroLearnset && moveId in dexZoroLearnset) {
    return 'Zoroark';
  }

  return null;
};
