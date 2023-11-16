import { type GenerationNum } from '@smogon/calc';
import { detectGenFromFormat } from './detectGenFromFormat';
import { getGenlessFormat } from './getGenlessFormat';

/**
 * Returns the full `format` with the `gen` number prefix.
 *
 * * If the provided `format` already has the prefix:
 *   - Will be returned as-is if the prefix matches the provided `gen` number, or
 *   - Will be reconstructed with the provided `gen` number.
 * * `null` will be returned if formatting fails for whatever reason.
 *
 * @example
 * ```ts
 * getGenfulFormat(9, 'randombattle'); // -> 'gen9randombattle'
 * getGenfulFormat(9, 'gen9randombattle'); // -> 'gen9randombattle'
 * getGenfulFormat(8, 'gen9randombattle'); // -> 'gen8randombattle'
 * ```
 * @default null
 * @since 1.1.8
 */
export const getGenfulFormat = (
  gen: GenerationNum,
  format: string,
): string => {
  if (!gen || !format) {
    return null;
  }

  const genPrefix = `gen${gen}`;
  const genlessFormat = getGenlessFormat(format); // no-op if prefix doesn't exist
  const detectedGen = detectGenFromFormat(format);

  if (!format.startsWith(genPrefix) || detectedGen !== gen) {
    return `${genPrefix}${genlessFormat}`;
  }

  return format;
};
