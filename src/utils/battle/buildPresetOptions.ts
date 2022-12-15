import { FormatLabels } from '@showdex/consts/battle';
import { percentage } from '@showdex/utils/humanize';
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
  usages?: CalcdexPokemonPreset[],
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

    // e.g., 'Iron Defense (Flying)' -> { label: 'Iron Defense', rightLabel: 'FLYING' },
    // 'Defensive (Physical Attacker)' -> { label: 'Defensive', subLabel: 'PHYSICAL ATTACKER' },
    // 'Metal Sound + Steelium Z' -> { label: 'Metal Sound', subLabel: '+ STEELIUM Z' },
    // 'The Pex' -> (regex fails) -> { label: 'The Pex' } (untouched lol)
    if (/\s+(?:\+\s+\w[\w\s]*|\(\w[\w\s]*\))$/.test(option.label)) {
      // update (2022/10/18): added default `[]` here cause the regex is letting some invalid
      // option.label through and I'm too lazy to find out what that is rn lol
      const [
        ,
        label,
        plusLabel,
        subLabel,
      ] = /([\w"'-\s]+)\s+(?:\+\s+(\w[\w\s]*)|\((\w[\w\s]*)\))$/.exec(option.label) || [];

      // it'll be one or the other since the capture groups are alternatives in a non-capturing group
      const actualSubLabel = (!!plusLabel && `+ ${plusLabel}`) || subLabel;

      if (label && actualSubLabel) {
        option.label = label;
        option.subLabel = actualSubLabel;

        // const longSubLabel = actualSubLabel.length > 8;
        // const loudSubLabel = actualSubLabel.toUpperCase(); // lol

        // remove the '+' (if any) if we're assigning it to the rightLabel
        // update (2022/11/16): nvm put it back lmao
        // option[longSubLabel ? 'subLabel' : 'rightLabel'] = longSubLabel
        //   ? loudSubLabel
        //   : loudSubLabel.replace(/^\+\s+/, '');

        // option[longSubLabel ? 'subLabel' : 'rightLabel'] = loudSubLabel;
      }
    }

    // attempt to find this preset's usage percentage (typically only in Gen 9 Randoms)
    const usage = preset.usage
      || usages?.find((p) => p?.source === 'usage' && p.name.includes(preset.name))?.usage
      || 0;

    if (usage > 0) {
      option.rightLabel = percentage(usage, 2);
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
