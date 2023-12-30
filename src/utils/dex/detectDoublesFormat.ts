import { detectLegacyGen } from './detectLegacyGen';
/**
 * Determines if the provided `format` should have `'Doubles'` as its `gameType`.
 *
 * * Legacy gens will only be considered if a valid gen was detected from the `format`.
 *   - Doubles were introduced in gens 3+.
 *
 * @since 1.2.0
 */
export const detectDoublesFormat = (
  format: string,
): boolean => !!format
  && !detectLegacyGen(format) // if gen detection fails, this would pass anyway
  && [
    /doubles/,
    /freeforall/,
    /triples/, // eh, @smogon/calc doesn't support a 'Triples' GameType, so 'Doubles' is better than nothing
    /vgc\d{2,4}/,
  ].some((r) => r.test(format));
