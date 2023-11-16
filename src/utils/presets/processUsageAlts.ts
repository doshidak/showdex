import { type GenerationNum } from '@smogon/calc';
import { type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat } from '@showdex/utils/dex';
import { sortUsageAlts } from './sortUsageAlts';

/* eslint-disable @typescript-eslint/indent */

/**
 * Converts and sorts alternative abilities/items/moves for the usage stats of a single Pokemon.
 *
 * * As of v1.1.7, you can provide the new optional `format` & `dict` args to enable formatting of IDs into their
 *   respective names via dex lookups.
 *   - Formatting only applies to names of each `CalcdexPokemonUsageAlt` that appear to be IDs,
 *     i.e., all lowercase with no spaces.
 *
 * @since 1.0.3
 */
export const processUsageAlts = <
  T extends string,
>(
  stats: Record<T, number>,
  format?: string | GenerationNum,
  dict?: Extract<keyof Showdown.ModdedDex, 'abilities' | 'items' | 'moves'>,
): CalcdexPokemonUsageAlt<T>[] => {
  const dex = format ? getDexForFormat(format) : null;
  const lookup = dex?.[dict]?.get;

  const alts = (Object.entries(stats || {}) as CalcdexPokemonUsageAlt<T>[])
    .filter(([value]) => !!value && formatId(value) !== 'nothing')
    .sort(sortUsageAlts);

  if (typeof lookup !== 'function') {
    return alts;
  }

  return alts.map((alt) => (
    // look for all lowercase (read: case-sensitive!) w/ no spaces; e.g., 'ivycudgel'
    // (also, including numbers cause of moves like '10000000voltthunderbolt' lol)
    /^[a-z0-9]+$/.test(alt[0])
      // "let the dex do the work" --Gordon Ramdisk
      ? [(lookup(alt[0])?.name as T) || alt[0], alt[1]] // e.g., 'Ivy Cudgel'
      : alt // i.e., nothing to do here; e.g., ['Dragon Dance', 1]
  ));
};

/* eslint-enable @typescript-eslint/indent */
