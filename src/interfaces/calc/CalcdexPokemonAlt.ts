/**
 * Utility type for alternative abilities/items/moves, including those with usage percentages, if any.
 *
 * * You can specify `AbilityName`, `ItemName`, or `MoveName` for `T`.
 *   - Import these types from `@smogon/calc`.
 * * Pro-tip: Use `detectUsageAlt()` to distinguish between `T`s and `CalcdexPokemonUsageAlt<T>`s.
 *
 * @example
 * ```ts
 * type AltMove = CalcdexPokemonAlt<MoveName>;
 * // -> MoveName | [name: MoveName, percent: number];
 * ```
 * @since 1.0.3
 */
export type CalcdexPokemonAlt<
  T extends string,
> = T | CalcdexPokemonUsageAlt<T>;

/**
 * Utility type for alternative abilities/items/moves with usage percentages.
 *
 * * You can specify `AbilityName`, `ItemName`, or `MoveName` for `T`.
 *   - Import these types from `@smogon/calc`.
 *
 * @example
 * ```ts
 * type UsageAltMove = CalcdexPokemonUsageAlt<MoveName>;
 * // -> [name: MoveName, percent: number];
 * ```
 * @since 1.0.3
 */
export type CalcdexPokemonUsageAlt<
  T extends string,
> = [
  name: T,
  percent: number,
];
