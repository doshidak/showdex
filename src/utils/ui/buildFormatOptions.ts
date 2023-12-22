import { type GenerationNum } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, getGenfulFormat, parseBattleFormat } from '@showdex/utils/dex';

export type CalcdexBattleFormatOption = DropdownOption<string>;

/**
 * Builds the `options[]` prop for the battle format `Dropdown` in `BattleInfo`.
 *
 * @since 1.2.0
 */
export const buildFormatOptions = (
  gen: GenerationNum,
): CalcdexBattleFormatOption[] => {
  const options: CalcdexBattleFormatOption[] = [];

  if (!nonEmptyObject(BattleFormats)) {
    return options;
  }

  const genFormats = Object.values(BattleFormats)
    .filter((f) => detectGenFromFormat(f?.id) === gen);

  if (!genFormats.length) {
    return options;
  }

  const sections: CalcdexBattleFormatOption[] = genFormats
    .reduce((prev, format) => {
      if (typeof format?.column !== 'number' || !format.section || prev.includes(format.section)) {
        return prev;
      }

      prev.splice(format.column, 0, format.section);

      return prev;
    }, [] as string[])
    .filter(Boolean)
    .map((section) => ({
      label: section,
      options: [],
    }));

  if (!sections.length) {
    return genFormats.reduce((prev, format) => {
      const {
        base,
        label,
        // suffixes,
      } = parseBattleFormat(format.id);

      const value = getGenfulFormat(gen, base);

      if (prev.some((o) => o.value === value)) {
        return prev;
      }

      prev.push({
        value,
        label,
      });

      return prev;
    }, [] as CalcdexBattleFormatOption[]);
  }

  const otherFormats: CalcdexBattleFormatOption = {
    label: 'Other',
    options: [],
  };

  genFormats.forEach((format) => {
    const group = (
      !!format.section
        && sections.find((g) => g.label === format.section)
    ) || otherFormats;

    const {
      base,
      label,
    } = parseBattleFormat(format.id);

    const value = getGenfulFormat(gen, base);

    if (group.options.some((o) => o.label === label || o.value === value)) {
      return;
    }

    group.options.push({
      value,
      label,
    });
  });

  options.push(
    ...sections.filter((g) => !!g.options.length),
    ...(otherFormats.options.length ? [otherFormats] : []),
  );

  return options;
};
