import type { CalcdexPokemonAlt } from '@showdex/redux/store';

/* eslint-disable @typescript-eslint/indent */

/**
 * Flattens a single alternative ability/item/move.
 *
 * @since 1.0.3
 */
export const flattenAlt = <
  T extends string,
>(
  alt: CalcdexPokemonAlt<T>,
): T => (Array.isArray(alt) ? alt[0] : alt);

/**
 * Flattens alternative abilities/items/moves.
 *
 * @since 1.0.3
 */
export const flattenAlts = <
  T extends string,
>(
  alts: CalcdexPokemonAlt<T>[],
): T[] => alts?.map?.(flattenAlt) ?? [];

/* eslint-enable @typescript-eslint/indent */
