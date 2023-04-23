import { formatId } from '@showdex/utils/app';
import type { CalcdexPokemonUsageAlt } from '@showdex/redux/store';
import { sortUsageAlts } from './sortUsageAlts';

/* eslint-disable @typescript-eslint/indent */

/**
 * Converts and sorts alternative abilities/items/moves for the usage stats of a single Pokemon.
 *
 * @since 1.0.3
 */
export const processUsageAlts = <
  T extends string,
>(
  stats: Record<T, number>,
): CalcdexPokemonUsageAlt<T>[] => (<CalcdexPokemonUsageAlt<T>[]> Object.entries(stats || {}))
  .filter(([value]) => !!value && formatId(value) !== 'nothing')
  .sort(sortUsageAlts);

/* eslint-enable @typescript-eslint/indent */
