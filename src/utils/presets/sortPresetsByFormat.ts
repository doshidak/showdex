import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { getGenfulFormat, parseBattleFormat } from '@showdex/utils/dex';

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
  const battleFormat = parseBattleFormat(format);

  if (!battleFormat) {
    return () => 0;
  }

  return (a, b) => {
    const formatA = getGenfulFormat(a.gen, a.format);
    const formatB = getGenfulFormat(b.gen, b.format);

    const battleFormatA = parseBattleFormat(formatA);
    const battleFormatB = parseBattleFormat(formatB);

    // first, hard match the genless formats
    const matchesA = battleFormatA === battleFormat;
    const matchesB = battleFormatB === battleFormat;

    if (matchesA) {
      // no need to repeat this case below since this only occurs when `a` and `b` both match
      if (matchesB) {
        return 0;
      }

      return -1;
    }

    if (matchesB) {
      return 1;
    }

    // at this point, we should've gotten all the hard matches, so we can do partial matching
    const partialMatchesA = formatA.startsWith(format);
    const partialMatchesB = formatB.startsWith(format);

    if (partialMatchesA) {
      if (partialMatchesB) {
        return 0;
      }

      return -1;
    }

    if (partialMatchesB) {
      return 1;
    }

    return 0;
  };
};
