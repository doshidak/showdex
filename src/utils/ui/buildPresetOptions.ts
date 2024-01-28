import { format as formatDate } from 'date-fns';
import { type DropdownOption } from '@showdex/components/form';
import { bull } from '@showdex/consts/core';
import { type CalcdexPokemon, type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { getGenfulFormat } from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';
import { detectCompletePreset, getPresetFormes } from '@showdex/utils/presets';
// import { sortPresetGroupsByFormat } from './sortPresetGroupsByFormat';

export type CalcdexPokemonPresetOption = DropdownOption<string>;

const SubLabelRegex = /([^()]+)\x20+(?:\+\x20+(\w[\w\x20]*)|\((\w.*)\))$/i;

/**
 * Builds the value for the `options` prop of the presets `Dropdown` component in `PokeInfo`.
 *
 * * As of v1.1.7, you can provide the optional `pokemon` argument to append the preset's `speciesForme`
 *   to the option's `subLabel` if it doesn't match the `speciesForme` of the provided `pokemon`.
 *   - This is useful for distinguishing presets of differing `speciesForme`'s, or even `transformedForme`'s.
 *
 * @since 1.0.3
 */
export const buildPresetOptions = (
  format: string,
  pokemon: CalcdexPokemon,
  presets: CalcdexPokemonPreset[],
  config?: {
    usages?: CalcdexPokemonPreset[];
    formatLabelMap?: Record<string, string>;
  },
): CalcdexPokemonPresetOption[] => {
  const options: CalcdexPokemonPresetOption[] = [];

  if (!format || !pokemon?.speciesForme || !presets?.length) {
    return options;
  }

  const {
    usages,
    formatLabelMap,
  } = config || {};

  const currentForme = pokemon.transformedForme || pokemon.speciesForme;
  const hasDifferentFormes = [...presets, ...(usages || [])].some((p) => p?.speciesForme !== currentForme);

  presets.forEach((preset) => {
    if (!detectCompletePreset(preset)) {
      return;
    }

    const option: CalcdexPokemonPresetOption = {
      label: preset.name,
      value: preset.calcdexId,
    };

    // e.g., 'Iron Defense (Flying)' -> { label: 'Iron Defense', rightLabel: 'FLYING' },
    // 'Defensive (Physical Attacker)' -> { label: 'Defensive', subLabel: 'PHYSICAL ATTACKER' },
    // 'Metal Sound + Steelium Z' -> { label: 'Metal Sound', subLabel: '+ STEELIUM Z' },
    // 'The Pex' -> (regex fails) -> { label: 'The Pex' } (untouched lol)
    const [
      subLabelMatch,
      extractedLabel,
      plusLabel,
      subLabel,
    ] = SubLabelRegex.exec(String(option.label)) || [];

    if (subLabelMatch) {
      // it'll be one or the other since the capture groups are alternatives in a non-capturing group
      const actualSubLabel = (!!plusLabel && `+ ${plusLabel}`) || subLabel;

      if (extractedLabel && actualSubLabel) {
        option.label = extractedLabel;
        option.subLabel = actualSubLabel;
      }
    }

    if (currentForme && hasDifferentFormes) {
      if (option.subLabel) {
        (option.subLabel as string) += ` ${bull} `;
      } else {
        option.subLabel = '';
      }

      (option.subLabel as string) += preset.speciesForme;

      if (pokemon.transformedForme) {
        option.disabled = !getPresetFormes(currentForme, {
          format: preset.gen,
        }).includes(preset.speciesForme);
      }
    }

    if (preset.source === 'bundle' && preset.bundleName) {
      if (option.subLabel) {
        (option.subLabel as string) += ` ${bull} `;
      } else {
        option.subLabel = '';
      }

      (option.subLabel as string) += preset.bundleName;
    }

    if (typeof preset.updated === 'number' && preset.updated) {
      if (option.subLabel) {
        (option.subLabel as string) += ` ${bull} `;
      } else {
        option.subLabel = '';
      }

      (option.subLabel as string) += formatDate(preset.updated, 'yyyy/MM/dd');
    }

    // attempt to find this preset's usage percentage (typically only in Gen 9 Randoms)
    const usage = preset.usage
      || usages?.find((p) => p?.source === 'usage' && p.name.includes(preset.name))?.usage
      || 0;

    if (usage > 0) {
      option.rightLabel = percentage(usage, usage === 1 ? 0 : 2);
    }

    const presetFormat = getGenfulFormat(preset.gen, preset.format);

    const label = formatLabelMap?.[presetFormat] || preset.format;
    const group = options.find((o) => o.label === label);

    if (!group) {
      return void options.push({
        label,
        options: [option],
      });
    }

    group.options.push(option);
  });

  // options.sort(sortPresetGroupsByFormat(formatLabelMap));

  return options;
};
