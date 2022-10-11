import { GenFormatRegex } from './detectGenFromFormat';

/**
 * Strips the gen suffix and number from the passed-in `format`.
 *
 * @example
 * ```ts
 * getGenlessFormat('gen82v2doubles');
 *
 * '2v2doubles'
 * ```
 * @default null
 * @since 1.0.3
 */
export const getGenlessFormat = (format: string): string => format?.replace?.(GenFormatRegex, '') || null;
