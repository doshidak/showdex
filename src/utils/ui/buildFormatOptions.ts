import { type GameType, type GenerationNum } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { FormatSectionLabels, GenLabels } from '@showdex/consts/dex';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, getGenfulFormat, parseBattleFormat } from '@showdex/utils/dex';

export type CalcdexBattleFormatOption = DropdownOption<string>;

const prioritySection = (
  section: string,
): boolean => /\s(?:singles(?:\/doubles)?|doubles(?:\/triples)?|triples)$/i.test(section);

const standardizeSection = (
  section: string,
  all?: string[],
): string => {
  const sectionId = formatId(section);

  if (!sectionId) {
    return section;
  }

  if (sectionId in FormatSectionLabels) {
    return FormatSectionLabels[sectionId];
  }

  if (['pastgenerations', 'pastgensou'].includes(sectionId)) {
    return all?.find((s) => formatId(s).includes('singles')) || 'Singles';
  }

  if (sectionId === 'pastgensdoublesou') {
    return all?.find((s) => formatId(s).includes('doubles')) || 'Doubles';
  }

  return section;
};

/**
 * Builds the `options[]` prop for the battle format `Dropdown` in `BattleInfo`.
 *
 * @since 1.2.0
 */
export const buildFormatOptions = (
  gen: GenerationNum,
  config?: {
    currentFormat?: string;
    showAll?: boolean;
    translateHeader?: (value: string, dict?: Record<string, string>) => string;
  },
): CalcdexBattleFormatOption[] => {
  const options: CalcdexBattleFormatOption[] = [];

  if (!nonEmptyObject(BattleFormats)) {
    return options;
  }

  const {
    currentFormat,
    showAll,
    translateHeader: translateHeaderFromConfig,
  } = config || {};

  const translateHeader = (v: string, d?: string) => translateHeaderFromConfig?.(v) || d || v;
  const translateGenHeader = (t: GameType) => translateHeaderFromConfig?.(`gen${t.toLowerCase()}`, { gen: GenLabels[gen]?.slug });

  // update (2024/07/16): apparently there's a 'donotuse' pet mod format LOL -- probably named that way for a good reason?
  const eligible = (f: string) => !!f && (showAll || (
    !f.includes('random')
      && !f.includes('custom')
      && !f.includes('donotuse')
  ));

  const favoritedFormats = Object.entries(Dex?.prefs('starredformats') || {})
    .filter(([format, faved]) => eligible(format) && detectGenFromFormat(format) === gen && faved)
    .map(([format]) => format);

  const genFormats = Object.values(BattleFormats)
    .filter((f) => eligible(f?.id) && detectGenFromFormat(f.id) === gen);

  if (!favoritedFormats.length && !genFormats.length) {
    return options;
  }

  // note: filtering by `label`, NOT `value` !!
  // (using the latter can result in 2 BSS formats showing up in Gen 9, for both 'gen9bss' & 'gen9battlestadiumsingles')
  const filterFormatLabels: string[] = [];

  const initialSections: string[] = genFormats
    .reduce((prev, format) => {
      // `column` is 1-indexed (i.e., starts with column 1, not 0)
      if (!format?.column || !format.section || prev.includes(format.section)) {
        return prev;
      }

      prev.splice(format.column, 0, format.section);

      return prev;
    }, [] as string[])
    .filter(Boolean);

  const sections: CalcdexBattleFormatOption[] = initialSections
    .reduce((prev, value) => {
      const section = standardizeSection(value, initialSections);

      if (section && !prev.includes(section)) {
        prev.push(section);
      }

      return prev;
    }, [] as string[])
    .sort((a, b) => (
      prioritySection(a)
        ? prioritySection(b)
          ? a.endsWith('Singles')
            ? -1
            : b.endsWith('Singles')
              ? 1
              : 0
          : -1
        : prioritySection(b)
          ? 1
          : 0
    ))
    .map((section) => ({
      label: section,
      options: [],
    }));

  if (favoritedFormats.length) {
    sections.unshift({
      label: translateHeader('Favorites'),
      options: favoritedFormats.map((format) => {
        const { base, label } = parseBattleFormat(format);
        const value = getGenfulFormat(gen, base);

        if (filterFormatLabels.includes(label)) {
          return null;
        }

        filterFormatLabels.push(label);

        return {
          value,
          label,
        };
      }).filter(Boolean),
    });
  }

  if (!sections.length) {
    return genFormats.reduce((prev, format) => {
      const { base, label } = parseBattleFormat(format.id);
      const value = getGenfulFormat(gen, base);

      if (filterFormatLabels.includes(label)) {
        return prev;
      }

      prev.push({
        value,
        label,
      });

      filterFormatLabels.push(label);

      return prev;
    }, [] as CalcdexBattleFormatOption[]);
  }

  const otherFormats: CalcdexBattleFormatOption = {
    label: translateHeader('Other'),
    options: [],
  };

  genFormats.forEach((format) => {
    const section = standardizeSection(format.section, initialSections);
    const group = (!!section && sections.find((g) => g.label === section)) || otherFormats;
    const { base, label } = parseBattleFormat(format.id);
    const value = getGenfulFormat(gen, base);

    if (filterFormatLabels.includes(label)) {
      return;
    }

    group.options.push({
      value,
      label,
    });

    filterFormatLabels.push(label);
  });

  options.push(
    ...sections.filter((g) => !!g.options.length),
    ...(otherFormats.options.length ? [otherFormats] : []),
  );

  const { label: currentFormatLabel } = parseBattleFormat(currentFormat);

  if (currentFormatLabel && !filterFormatLabels.includes(currentFormatLabel)) {
    options.unshift({
      label: translateHeader('Current'),
      options: [{
        label: currentFormatLabel,
        value: currentFormat,
      }],
    });
  }

  return options.map((o) => ({
    ...o,
    label: (
      ((o.label as string).endsWith('Singles') || (o.label as string).endsWith('Doubles'))
        && translateGenHeader((o.label as string).endsWith('Singles') ? 'Singles' : 'Doubles')
    ) || translateHeader((o.label as string)),
  }));
};
