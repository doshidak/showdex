import { formatId } from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import { detectGenFromFormat } from './detectGenFromFormat';

const l = logger('@showdex/utils/battle/getDexForFormat');

/**
 * Returns the appropriate `Dex` object for the passed-in `format`.
 *
 * * For BDSP formats, returns a modded `Dex` containing all the Gen 4 Pokemon normally unavailable in Gen 8.
 * * For other formats, returns a `Dex` for the current gen specified in the `format`.
 *   - Gen value is obtained via `detectGenFromFormat()`.
 * * If no `format` is provided or an invalid gen was returned from the `format`,
 *   the global `Dex` object is returned instead, which should default to the current gen.
 * * Note that `format` can also be a number representing the gen number.
 *
 * @since 1.0.2
 */
export const getDexForFormat = (format?: string | GenerationNum): Showdown.ModdedDex => {
  if (typeof Dex === 'undefined') {
    if (__DEV__) {
      l.warn(
        'Global Dex object is not available.',
        '\n', 'format', format,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return null;
  }

  if (!format) {
    return Dex;
  }

  // note: checking if `format > 0` in the conditional won't guarantee that `format` will
  // be type `string` after this point
  if (typeof format === 'number') {
    return format > 0 ? Dex.forGen(format) : Dex;
  }

  const formatAsId = formatId(format);

  if (formatAsId.includes('bdsp')) {
    return Dex.mod('gen8bdsp');
  }

  const gen = detectGenFromFormat(formatAsId);

  if (typeof gen !== 'number' || gen < 1) {
    return Dex;
  }

  return Dex.forGen(gen);
};
