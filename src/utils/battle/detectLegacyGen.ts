import { env } from '@showdex/utils/core';
import type { Generation, GenerationNum } from '@pkmn/data';

/**
 * Determines if the provided `gen` uses legacy DVs (Determinant Values) instead of
 * IVs (Individual Values).
 *
 * * Essentially gens 1 and 2 use legacy DVs.
 *
 * @since 1.0.2
 */
export const detectLegacyGen = (gen: Generation | GenerationNum): boolean => (
  typeof gen === 'number'
    ? gen
    : (gen?.num || <GenerationNum> env.int('calcdex-default-gen'))
) < 3;
