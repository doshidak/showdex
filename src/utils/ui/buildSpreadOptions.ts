import { type GenerationNum } from '@smogon/calc';
import { bull } from '@showdex/consts/core';
import { PokemonNatureBoosts, PokemonNatures } from '@showdex/consts/dex';
import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSpread } from '@showdex/interfaces/calc';
import { detectLegacyGen } from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';
import { dehydrateSpread } from '@showdex/utils/hydro';

const spreadValue = (
  spread: CalcdexPokemonPresetSpread,
  format?: string | GenerationNum,
): string => dehydrateSpread(spread, {
  format,
  delimiter: '/',
  omitAlt: true,
});

const labelDelimiter = ` ${bull} `;

const spreadLabel = (
  spread: CalcdexPokemonPresetSpread,
  format?: string | GenerationNum,
  translateStat?: (value: Showdown.StatName) => string,
): string => {
  const nonZeroEvs = Object.entries(spread.evs)
    .filter(([, v]) => (v || 0) > 0)
    .sort(([, a], [, b]) => b - a) as [stat: Showdown.StatName, value: number][];

  if (detectLegacyGen(format) || nonZeroEvs.length > 3) {
    return dehydrateSpread(spread, {
      format,
      delimiter: '/',
      omitAlt: true,
      omitNature: true,
      omitIvs: true,
    });
  }

  return nonZeroEvs
    .map(([stat, value]) => `${value} ${translateStat?.(stat) || stat}`)
    .join(labelDelimiter);
};

// note: this is a poorly refactored function that will return a new option if the `spread` is unique, otherwise, it will
// directly mutate `prev` & return nothing; this is so that I don't have to repeat the `existingOption` logic twice for
// both the preset's `spreads` & usage stat's `spreads`
const processOption = (
  prev: DropdownOption<string>[],
  spread: CalcdexPokemonPresetSpread,
  format?: string | GenerationNum,
  translateNature?: (value: Showdown.NatureName) => string,
  translateStat?: (value: Showdown.StatName) => string,
): DropdownOption<string> => {
  const value = spreadValue(spread, format);
  const existingOption = prev.find((o) => o.value === value);

  if (existingOption && spread.usage) {
    const subLabelParts = [...((existingOption.subLabel as string).split?.(labelDelimiter) || [])];
    const usageLabel = percentage(spread.usage, spread.usage === 1 ? 0 : 2);

    if (!subLabelParts.includes(usageLabel)) {
      subLabelParts.push(usageLabel);
    }

    existingOption.subLabel = subLabelParts.join(labelDelimiter);

    return null;
  }

  const option: DropdownOption<string> = {
    label: spreadLabel(spread, format, translateStat),
    value,
  };

  const subLabelParts: string[] = [];

  if (PokemonNatures.includes(spread.nature)) {
    const boosts = PokemonNatureBoosts[spread.nature];

    const natureLabel = translateNature?.(spread.nature) || spread.nature;
    const posLabel = (!!boosts?.[0] && (translateStat?.(boosts[0]) || boosts[0]?.toUpperCase())) || null;
    const negLabel = (!!boosts?.[1] && (translateStat?.(boosts[1]) || boosts[1]?.toUpperCase())) || null;

    subLabelParts.push((
      posLabel && negLabel
        ? `${natureLabel} +${posLabel} -${negLabel}`
        : natureLabel
    ));
  }

  if (spread.usage) {
    // update (2023/11/15): might not be enough room tbh LOL
    subLabelParts.push(percentage(spread.usage, spread.usage === 1 ? 0 : 2));
  }

  if (subLabelParts.length) {
    option.subLabel = subLabelParts.join(labelDelimiter);
  }

  return option;
};

/**
 * Builds the value for the `options` prop of the spreads `Dropdown` component in `PokeInfo`.
 *
 * * `preset` should be the Pokemon's currently applied preset, if any.
 * * Optionally provide the `usage` to include its `spreads[]` as additional options.
 * * This assumes that the `spreads[]` from each argument are already sorted.
 * * Guaranteed to return an empty array at the very least.
 *
 * @since 1.1.8
 */
export const buildSpreadOptions = (
  preset: CalcdexPokemonPreset,
  config?: {
    format?: string | GenerationNum;
    usage?: CalcdexPokemonPreset;
    translateNature?: (value: Showdown.NatureName) => string;
    translateStat?: (value: Showdown.StatName) => string;
    translateHeader?: (value: string) => string;
  },
): DropdownOption<string>[] => {
  const {
    format,
    usage,
    translateNature,
    translateStat,
    translateHeader,
  } = config || {};

  const options: DropdownOption<string>[] = [];

  const presetSpreads: CalcdexPokemonPresetSpread[] = [
    ...(preset?.spreads || []),
  ];

  const usageSpreads: CalcdexPokemonPresetSpread[] = [
    ...(usage?.spreads || []),
  ];

  // shitty backwards compatibility layer for presets not using spreads[]
  if (!presetSpreads.length && preset?.nature) {
    presetSpreads.push({
      nature: preset.nature,
      ivs: { ...preset.ivs },
      evs: { ...preset.evs },
    });
  }

  if (!presetSpreads.length && !usageSpreads.length) {
    return options;
  }

  const presetOptions: DropdownOption<string>[] = [];
  const usageOptions: DropdownOption<string>[] = [];

  // note: not map()'ing these due to a circular reference in the first arg
  // (i.e., whatever that thingy was called when a system depends on its previous state lol)
  presetSpreads.forEach((spread) => {
    const processedOption = processOption(presetOptions, spread, format, translateNature, translateStat);

    if (!processedOption?.value) {
      return;
    }

    presetOptions.push(processedOption);
  });

  usageSpreads.forEach((spread) => {
    const value = spreadValue(spread, format);
    const presetOption = presetOptions.find((o) => o.value === value);
    const processedOption = processOption(usageOptions, spread, format, translateNature, translateStat);

    if (!processedOption?.value) {
      return;
    }

    if (presetOption && processedOption.subLabel) {
      presetOption.subLabel = processedOption.subLabel;

      return;
    }

    usageOptions.push(processedOption);
  });

  options.push(...(
    presetOptions.length && usageOptions.length
      ? [{
        label: translateHeader?.('Pool') || 'Pool',
        options: presetOptions,
      }, {
        label: translateHeader?.('Usage') || 'Usage',
        options: usageOptions,
      }]
      : [
        ...presetOptions,
        ...usageOptions,
      ]
  ));

  return options;
};
