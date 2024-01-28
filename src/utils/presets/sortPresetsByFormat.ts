import { FormatSortPriorities } from '@showdex/consts/dex';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { detectDoublesFormat, getGenfulFormat } from '@showdex/utils/dex';

/**
 * Sorts `CalcdexPokemonPreset[]`'s based on their relevancy to the provided `format`.
 *
 * * This means presets in `'ou'` will be closest to index `0` for a given `format` argument of `'gen9ou'`.
 * * ~~Doesn't matter if the provided `format` is genless or not (e.g., `'ou'` & `'gen9ou'` are the same).~~
 *   - ~~Internally, it will pass `format` to `getGenlessFormat()` anyway.~~
 *   - As of v1.2.1, `format` must be *genful* (e.g., `'gen9ou'`) & will be assumed to be as such.
 * * `labelMap` is used as a `parseBattleFormat()` optimization by memoizing the outputs for a given *genful* format.
 *   - Keys are *genful* formats (e.g., `'gen9vgc2024'`) & values are the labels (e.g., `'VGC 2024'`).
 *   - This function does not call `parseBattleFormat()` itself, so it expects this argument to be provided.
 *   - Entry for the provided `format`, which is assumed to be *genful*, is assumed to exist as well.
 *   - (Note: `parseBattleFormat()` is required to make sure `'gen9vgc2024regfbo3'` & `'gen9vgc2024'` are the same.)
 * * Meant to be passed as the `compareFunction` of `CalcdexPokemonPreset[].sort()`.
 *
 * @default
 * ```ts
 * (_a, _b) => 0 // no-op
 * ```
 * @since 1.0.3
 */
export const sortPresetsByFormat = (
  format: string,
  labelMap: Record<string, string>,
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => {
  if (!format || !labelMap?.[format]) {
    return () => 0;
  }

  const doubles = detectDoublesFormat(format);
  const formatLabel = labelMap[format];

  // update (2024/01/05):
  // e.g., formatLabel = 'VGC 2024' -> partialFormatLabel = ['vgc', '2024'];
  // formatLabel = 'Ubers UU' -> partialFormatLabel = ['ubers', 'uu']
  const splitLabel = (l: string) => l?.split(' ').map((p) => formatId(p)).filter(Boolean) ?? [];
  const partialFormatLabel = splitLabel(formatLabel);

  const indexMatch = (
    labelParts: string[],
    candidateParts: string[],
  ) => (candidateParts?.findIndex((p) => labelParts?.includes(p)) ?? -1);

  const priorityIndex = (
    labelParts: string[],
  ) => indexMatch(labelParts, FormatSortPriorities);

  return (a, b) => {
    if (!a?.calcdexId || !b?.calcdexId) {
      return 0; // no-op
    }

    // e.g., a.gen = 9, a.format = 'vgc2024' -> genfulFormatA = 'gen9vgc2024';
    // b.gen = 9, b.format = 'almostanyability' -> genfulFormatB = 'gen9almostanyability'
    const genfulFormatA = getGenfulFormat(a.gen, a.format);
    const genfulFormatB = getGenfulFormat(b.gen, b.format);

    // e.g., labelMap['gen9vgc2024'] -> labelA = 'VGC 2024';
    // labelMap['gen9almostanyability'] -> labelB = 'AAA'
    const labelA = labelMap[genfulFormatA];
    const labelB = labelMap[genfulFormatB];

    // hard match first
    const matchesA = labelA === formatLabel;
    const matchesB = labelB === formatLabel;

    if (matchesA) {
      if (matchesB) {
        return (a.formatIndex ?? -1) - (b.formatIndex ?? -1);
      }

      return -1;
    }

    if (matchesB) {
      return 1;
    }

    // e.g., labelA -> partialLabelA = ['vgc', '2024']
    // labelB -> partialLabelB = ['aaa']
    const partialLabelA = splitLabel(labelA);
    const partialLabelB = splitLabel(labelB);

    // partial match next
    // const partialMatchesA = partialMatch(partialFormatLabel, partialLabelA);
    // const partialMatchesB = partialMatch(partialFormatLabel, partialLabelB);
    const partialIndexA = indexMatch(partialFormatLabel, partialLabelA);
    const partialIndexB = indexMatch(partialFormatLabel, partialLabelB);

    if (partialIndexA > -1) {
      if (partialIndexB > -1) {
        return partialIndexA - partialIndexB;
      }

      return -1;
    }

    if (partialIndexB > -1) {
      return 1;
    }

    // if we're in a Doubles format, prioritize Doubles presets
    if (doubles) {
      const doublesA = detectDoublesFormat(genfulFormatA);
      const doublesB = detectDoublesFormat(genfulFormatB);

      // ignoring both A & B being Doubles formats to run it through the priority case below
      if (doublesA && !doublesB) {
        return -1;
      }

      if (!doublesA && doublesB) {
        return 1;
      }
    }

    // sort based on a hardcoded priority list (lower index = higher priority, unless -1)
    const priorityA = priorityIndex(partialLabelA);
    const priorityB = priorityIndex(partialLabelB);

    if (priorityA > -1) {
      if (priorityB > -1) {
        return priorityA - priorityB;
      }

      return -1;
    }

    if (priorityB > -1) {
      return 1;
    }

    // last possible case: do nothing
    return 0;
  };
};
