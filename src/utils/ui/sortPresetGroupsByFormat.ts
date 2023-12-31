import { type DropdownOption } from '@showdex/components/form';
import { FormatSortPriorities } from '@showdex/consts/dex';
import { formatId } from '@showdex/utils/core';

/**
 * Sorts dropdown option groups containing `presetId`'s of `CalcdexPokemonPreset`'s by the provided `format`.
 *
 * * Primarily only used by `buildPresetOptions()`, hence the weird factory arguments.
 * * `labelMap` is an object used as an optimization, where the first entry is of the current format.
 * * Not currently prioritizing doubles & triples formats over singles when the current format is of the same.
 *   - This means you may see a "Doubles OU" appearing higher on the list in a singles format like `'gen9ou'`.
 *
 * @since 1.2.0
 */
export const sortPresetGroupsByFormat = (
  labelMap: Record<string, string>,
): Parameters<Array<DropdownOption<string>>['sort']>[0] => {
  const [format, formatLabel] = Object.entries(labelMap || {})[0] || [];

  if (!format || !formatLabel) {
    return () => 0;
  }

  // e.g., formatLabel = 'VGC 2023' -> partialFormatLabel = 'vgc'
  const partialLabel = (l: string) => formatId(l.replace(/\d+$/, ''));
  const partialFormatLabel = partialLabel(formatLabel);

  const partialMatch = (
    label: string,
    candidate: string,
  ) => (
    label.startsWith(candidate)
      || label.endsWith(candidate)
  );

  return (a, b) => {
    const labelA = a.label as string;
    const labelB = b.label as string;

    // hard match first
    const matchesA = labelA === formatLabel;
    const matchesB = labelB === formatLabel;

    if (matchesA) {
      if (matchesB) {
        return 0;
      }

      return -1;
    }

    if (matchesB) {
      return 1;
    }

    const partialLabelA = partialLabel(labelA);
    const partialLabelB = partialLabel(labelB);

    // partial match next
    const partialMatchesA = partialMatch(partialFormatLabel, partialLabelA);
    const partialMatchesB = partialMatch(partialFormatLabel, partialLabelB);

    if (partialMatchesA) {
      if (partialMatchesB) {
        return 0;
      }

      return -1;
    }

    if (partialMatchesB) {
      return 1;
    }

    // sort based on a hardcoded priority list (lower index = higher priority, unless -1)
    const priorityA = FormatSortPriorities.findIndex((f) => partialMatch(partialLabelA, formatId(f)));
    const priorityB = FormatSortPriorities.findIndex((f) => partialMatch(partialLabelB, formatId(f)));

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
