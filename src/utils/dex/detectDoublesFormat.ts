import { DoublesFormatMatchers } from '@showdex/consts/dex';
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
  && DoublesFormatMatchers.some((r) => r.test(format));
