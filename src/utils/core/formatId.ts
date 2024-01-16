/**
 * Basically the `toID()` global that's already built into the Showdown client, but ~~too lazy atm to
 * declare it as a project global~~ it's so dank we need our own.
 *
 * * Also used as a string sanitizer for string comparisons, especially in `calcPokemonFinalStats()`
 *   for abilities, items, etc.
 * * As of v1.1.6, this has been moved from `app` utils to `core` cause it was being imported everywhere,
 *   causing lots of circular dependencies cause of my brilliant *let's `export` everything in `index.ts`*
 *   organizational system.
 *   - Nothing wrong with the system of course.
 *   - Just means we just need to make certain directories like `core` & `dex` don't import from other
 *     parts of the project like `redux` o_O
 * * As of v1.2.1, this now replaces all diacritics with their ASCII equivalents (e.g., "é" -> "e").
 *   - Pre-v1.2.1, `formatId('Flabébé-Yellow')` would result in `'flabbyellow'` (a yellow flabby ?).
 *   - Post-v1.2.1, `formatId('Flabébé-Yellow')` now results in `'flabebeyellow'`.
 * * As of v1.2.3, the non-alphanumeric replacement regex has been replaced with the named `Diacritic` Unicode range.
 *   - Seems to be *slightly* faster than doing a not-in-range replacement that was prior pre-v1.2.3.
 *
 * @example
 * ```ts
 * formatId('Quick Feet');
 *
 * 'quickfeet'
 * ```
 * @since 0.1.3
 */
export const formatId = (
  value: string,
) => value
  ?.toString?.()
  .normalize('NFD') // splits combined graphemes; e.g., 'Flabébé-Yellow' -> 'Flabe´be´-Yellow'
  .toLowerCase() // e.g., -> 'flabe´be´-yellow'
  .replace(/\p{Diacritic}/gu, ''); // e.g., -> 'flabebeyellow'
