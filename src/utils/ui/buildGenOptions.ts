import { romanize } from 'romans';
import { type GenerationNum } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { GenLabels } from '@showdex/consts/dex';

export type CalcdexBattleGenOption = DropdownOption<GenerationNum>;

/**
 * Builds the `options[]` prop for the gen `Dropdown` in `BattleInfo`.
 *
 * @since 1.2.0
 */
export const buildGenOptions = (
  ascending?: boolean,
): CalcdexBattleGenOption[] => GenLabels
  .filter((l) => !!l?.gen)
  .sort((a, b) => (a.gen - b.gen) * (ascending ? 1 : -1))
  .map(({
    gen,
    label,
  }) => ({
    value: gen,
    label,
    rightLabel: [romanize(gen), String(gen)].join(' '),
  }));
