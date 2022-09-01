/**
 * Basically the `toID()` global that's already built into the Showdown client,
 * but too lazy atm to declare it as a project global.
 *
 * * Also used as a string sanitizer for string comparisons,
 *   especially in `calcPokemonFinalStats()` for abilities, items, etc.
 *
 * @example
 * ```ts
 * id('Quick Feet'); // 'quickfeet'
 * ```
 * @since 0.1.3
 */
export const formatId = (value: string) => value?.toString?.()
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');
