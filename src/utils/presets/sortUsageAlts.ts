import { type CalcdexPokemonAlt } from '@showdex/redux/store';

/* eslint-disable @typescript-eslint/indent */

/**
 * Sorts the alternative abilities/items/moves by their usage percentage in descending order
 * (i.e., highest usage first).
 *
 * * Primarily used as the comparison function argument of `sort()`.
 * * Also primarily used in `transformFormatStatsResponse()` for sorting populated
 *   `altAbilities`, `altItems`, and `altMoves`.
 *
 * @since 1.0.3
 */
export const sortUsageAlts = <
  T extends string,
>(
  a: CalcdexPokemonAlt<T>,
  b: CalcdexPokemonAlt<T>,
): number => {
  const usageA = Array.isArray(a) && typeof a[1] === 'number' ? a[1] : 0;
  const usageB = Array.isArray(b) && typeof b[1] === 'number' ? b[1] : 0;

  if (usageA < usageB) {
    return 1;
  }

  if (usageA > usageB) {
    return -1;
  }

  return 0;
};

/* eslint-enable @typescript-eslint/indent */
