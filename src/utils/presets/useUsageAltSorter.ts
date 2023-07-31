import * as React from 'react';
import { type CalcdexPokemonAlt } from '@showdex/redux/store';
import { usageAltPercentFinder } from './usageAltPercentFinder';
import { type CalcdexPokemonUsageAltSorter, usageAltPercentSorter } from './usageAltPercentSorter';

/* eslint-disable @typescript-eslint/indent */

/**
 * Hook that memoizes the output function of the `usageAltPercentSorter()` factory.
 *
 * * Currently only used internally by `Calcdex` children components.
 *   - Namely in `PokeInfo`.
 *
 * @since 1.0.7
 */
export const useUsageAltSorter = <
  T extends string,
>(
  alts: CalcdexPokemonAlt<T>[],
): CalcdexPokemonUsageAltSorter<T> => {
  const findUsagePercent = React.useMemo(() => (
    Array.isArray(alts)
      ? usageAltPercentFinder(alts)
      : null
  ), [
    alts,
  ]);

  const usageSorter = React.useMemo(() => (
    typeof findUsagePercent === 'function'
      ? usageAltPercentSorter(findUsagePercent)
      : null
  ), [
    findUsagePercent,
  ]);

  return usageSorter;
};

/* eslint-enable @typescript-eslint/indent */
