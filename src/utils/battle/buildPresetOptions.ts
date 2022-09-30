import { FormatLabels } from '@showdex/consts';
import type { DropdownOption } from '@showdex/components/form';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';
import { getGenlessFormat } from './getGenlessFormat';

/**
 * Builds the value for the `options` prop of the presets `Dropdown` component in `PokeInfo`.
 *
 * @since 1.0.3
 */
export const buildPresetOptions = (
  presets: CalcdexPokemonPreset[],
): DropdownOption<string>[] => {
  const options: DropdownOption<string>[] = [];

  if (!presets?.length) {
    return options;
  }

  presets.forEach((preset) => {
    if (!preset?.calcdexId || !preset.name || !preset.format) {
      return;
    }

    const option: DropdownOption<string> = {
      label: preset.name,
      value: preset.calcdexId,
    };

    // e.g., 'Iron Defense (Flying)' -> { label: 'Iron Defense', rightLabel: 'FLYING' }
    if (/\s+\(\w+\)$/.test(option.label)) {
      const [, label, rightLabel] = /((?:\w|\s)+)\s+\((\w+)\)$/.exec(option.label);

      if (label && rightLabel) {
        option.label = label;
        option.rightLabel = rightLabel.toUpperCase();
      }
    }

    const genlessFormat = getGenlessFormat(preset.format);
    const groupLabel = (!!genlessFormat && FormatLabels?.[genlessFormat]) || genlessFormat;
    const group = options.find((o) => o.label === groupLabel);

    if (!group) {
      options.push({
        label: groupLabel,
        options: [option],
      });

      return;
    }

    group.options.push(option);
  });

  return options;
};
