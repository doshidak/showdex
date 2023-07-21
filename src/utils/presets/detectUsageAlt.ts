import { type CalcdexPokemonAlt, type CalcdexPokemonUsageAlt } from '@showdex/redux/store';

/* eslint-disable @typescript-eslint/indent */

/**
 * Detects whether the provided `alt` contains usage percentages.
 *
 * * Distinguishes `CalcdexPokemonUsageAlt<T>`s from `T`s (one of the union types of `CalcdexPokemonAlt<T>`).
 * * Primarily used as the `predicate` function argument of `filter()`.
 *   - Resulting filtered items will be `CalcdexPokemonUsageAlt<T>`s, as defined by the type predicate.
 *
 * @since 1.0.3
 */
export const detectUsageAlt = <
  T extends string,
>(
  alt: CalcdexPokemonAlt<T>,
): alt is CalcdexPokemonUsageAlt<T> => Array.isArray(alt)
  && !!alt[0]
  && typeof alt[1] === 'number';

/**
 * Detects whether the provided `alts` contains an array of usage percentages.
 *
 * @since 1.1.6
 */
export const detectUsageAlts = <
  T extends string,
>(
  alts: unknown[],
): alts is CalcdexPokemonUsageAlt<T>[] => Array.isArray(alts)
  && Array.isArray(alts[0])
  && detectUsageAlt(alts[0]);

/* eslint-enable @typescript-eslint/indent */
