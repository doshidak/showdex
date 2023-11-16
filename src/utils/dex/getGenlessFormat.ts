import { GenFormatRegex } from './detectGenFromFormat';

/**
 * Strips the gen suffix & number from the passed-in `format`.
 *
 * * `null` will be returned if formatting fails for whatever reason.
 *
 * @example
 * ```ts
 * getGenlessFormat('gen8350cup'); // -> '350cup'
 * getGenlessFormat('gen82v2doubles'); // -> '2v2doubles'
 * getGenlessFormat('gen9randombattle'); // -> 'randombattle'
 * getGenlessFormat('randombattle'); // -> 'randombattle'
 * ```
 * @default null
 * @since 1.0.3
 */
export const getGenlessFormat = (
  format: string,
): string => format?.replace?.(GenFormatRegex, '') || null;
