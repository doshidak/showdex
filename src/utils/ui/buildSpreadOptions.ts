import { type GenerationNum } from '@smogon/calc';
import { bull } from '@showdex/consts/core';
import { PokemonNatureBoosts, PokemonNatures } from '@showdex/consts/dex';
import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSpread } from '@showdex/interfaces/calc';
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

const spreadLabel = (
  spread: CalcdexPokemonPresetSpread,
  format?: string | GenerationNum,
): string => dehydrateSpread(spread, {
  format,
  delimiter: '/',
  omitAlt: true,
  omitNature: true,
  omitIvs: true,
});

const subLabelDelimiter = ` ${bull} `;

const processOption = (
  prev: DropdownOption<string>[],
  spread: CalcdexPokemonPresetSpread,
  format?: string | GenerationNum,
): DropdownOption<string> => {
  const value = spreadValue(spread, format);
  const existingOption = prev.find((o) => o.value === value);

  if (existingOption && spread.usage) {
    const subLabelParts = [...((existingOption.subLabel as string).split?.(subLabelDelimiter) || [])];
    const usageLabel = percentage(spread.usage, 2);

    if (!subLabelParts.includes(usageLabel)) {
      subLabelParts.push(usageLabel);
    }

    existingOption.subLabel = subLabelParts.join(subLabelDelimiter);

    return;
  }

  const option: DropdownOption<string> = {
    label: spreadLabel(spread, format),
    value,
  };

  const subLabelParts: string[] = [];

  if (PokemonNatures.includes(spread.nature)) {
    const boosts = PokemonNatureBoosts[spread.nature];

    subLabelParts.push((
      boosts?.length === 2
        ? `${spread.nature} +${boosts[0].toUpperCase()} -${boosts[1].toUpperCase()}`
        : spread.nature
    ));
  }

  if (spread.usage) {
    // update (2023/11/15): might not be enough room tbh LOL
    subLabelParts.push(percentage(spread.usage, 2));
  }

  if (subLabelParts.length) {
    option.subLabel = subLabelParts.join(subLabelDelimiter);
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
  },
): DropdownOption<string>[] => {
  const {
    format,
    usage,
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
    presetOptions.push(processOption(presetOptions, spread, format));
  });

  usageSpreads.forEach((spread) => {
    const value = spreadValue(spread, format);
    const presetOption = presetOptions.find((o) => o.value === value);
    const processedOption = processOption(usageOptions, spread, format);

    if (presetOption && processedOption.subLabel) {
      presetOption.subLabel = processedOption.subLabel;

      return;
    }

    usageOptions.push(processedOption);
  });

  options.push(...(
    presetOptions.length && usageOptions.length
      ? [{
        label: 'Pool',
        options: presetOptions,
      }, {
        label: 'Usage',
        options: usageOptions,
      }]
      : [
        ...presetOptions,
        ...usageOptions,
      ]
  ));

  return options;
};
