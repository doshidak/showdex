/**
 * Removes duplicate elements in the provided array `value`.
 *
 * * Uses that one trick the JS pros don't want you to know :o
 *   - idk how efficient this is, so use sparingly lol
 *
 * @example
 * ```ts
 * dedupeArray([
 *   'Stealth Rock',
 *   'Taunt',
 *   'U-Turn',
 *   'Earthquake',
 *   'Stealth Rock',
 * ] as MoveName[]);
 *
 * [
 *   'Stealth Rock',
 *   'Taunt',
 *   'U-Turn',
 *   'Earthquake',
 * ] as MoveName[]
 * ```
 * @since 1.2.4
 */
export const dedupeArray = <T>(
  value: T[],
): T[] => Array.from(new Set(value)); // LOL
