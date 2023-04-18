/**
 * Return comparison function from the `usageAltPercentSorter()` factory.
 *
 * @since 1.0.7
 */
export type CalcdexPokemonUsageAltSorter<T extends string> = (
  a: T,
  b: T,
) => number;

/* eslint-disable @typescript-eslint/indent */

/**
 * Factory that creates a comparison function that sorts items based on their usage percentages in *descending* order (i.e., most used to least).
 *
 * * You'll need to pass in the return function of `usageAltPercentFinder()` to the factory.
 * * Resulting function can then be passed into the `compareFn` argument of `Array.prototype.sort()`.
 *
 * @since 1.0.7
 */
export const usageAltPercentSorter = <
  T extends string,
>(
  findUsagePercent: (name: T) => string,
): CalcdexPokemonUsageAltSorter<T> => (a, b) => {
  if (typeof findUsagePercent !== 'function') {
    return 0;
  }

  // e.g., '100.00%' -> 100, '69.69%' -> 69.69
  const usageA = parseFloat(findUsagePercent(a)) || 0;
  const usageB = parseFloat(findUsagePercent(b)) || 0;

  if (usageA > usageB) {
    return -1;
  }

  if (usageA < usageB) {
    return 1;
  }

  // perform ABC sorting at this point
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
};

/* eslint-enable @typescript-eslint/indent */
