import { type CalcdexPokemonPreset } from '@showdex/redux/store';
import { getGenlessFormat } from '@showdex/utils/dex';

/**
 * Sorts `CalcdexPokemonPreset[]`'s whose `format`'s match the provided `format` the closest in ascending order.
 *
 * * This means presets in `'ou'` will be closest to index `0` for a given `format` argument of `'gen9ou'`.
 * * Doesn't matter if the provided `format` is genless or not (e.g., `'ou'` & `'gen9ou'` are the same).
 *   - Internally, it will pass `format` to `getGenlessFormat()` anyway.
 * * Meant to be passed as the `compareFunction` of `CalcdexPokemonPreset[].sort()`.
 *
 * @since 1.0.3
 */
export const sortPresetsByFormat = (
  format?: string,
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => {
  const genlessFormat = getGenlessFormat(format);

  if (!genlessFormat) {
    return () => 0;
  }

  // remove 'series<#>' from the genlessFormat
  const parsedFormat = genlessFormat.replace(/series\d+/i, '');

  return (a, b) => {
    // first, hard match the genless formats
    const matchesA = a.format === parsedFormat;
    const matchesB = b.format === parsedFormat;

    if (matchesA) {
      // no need to repeat this case below since this only occurs when `a` and `b` both match
      if (matchesB) {
        if (a.source === 'usage') {
          return 1;
        }

        if (b.source === 'usage') {
          return -1;
        }

        // update (2023/07/27): WAIT how did I miss this case LMAO no wonder why the presets are backwards HAHAHA
        // holy shit I'm actually dumb af
        return 0;
      }

      return -1;
    }

    if (matchesB) {
      return 1;
    }

    // at this point, we should've gotten all the hard matches, so we can do partial matching
    // (e.g., 'ou' would be sorted at the lowest indices already, so we can pull something like 'bdspou' to the top,
    // but not something like '2v2doubles', which technically includes 'ou', hence the endsWith())
    if (a.format.endsWith(parsedFormat)) {
      return -1;
    }

    if (b.format.endsWith(parsedFormat)) {
      return 1;
    }

    return 0;
  };
};
