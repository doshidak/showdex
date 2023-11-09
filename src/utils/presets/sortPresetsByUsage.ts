import { type CalcdexPokemonPreset } from '@showdex/redux/store';

/**
 * Sorts `CalcdexPokemonPreset[]`'s by the provided usage percentages in `usages[]`.
 *
 * * Note that usage percentages for presets are typically present in Randoms with multiple roles, in which the
 *   percentages indicate the probabilities of being a certain role.
 * * If no `usages[]` are available (as well as no `usage` percentages being available), this won't have any effect.
 * * Meant to be passed as the `compareFunction` of `CalcdexPokemonPreset[].sort()`.
 *
 * @since 1.1.8
 */
export const sortPresetsByUsage = (
  usages: CalcdexPokemonPreset[],
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => {
  if (!usages?.length) {
    return () => 0;
  }

  return (a, b) => {
    const usageA = usages.find((p) => p?.source === 'usage' && p.name.includes(a.name))?.usage || 0;
    const usageB = usages.find((p) => p?.source === 'usage' && p.name.includes(b.name))?.usage || 0;

    if (usageA > usageB) {
      return -1;
    }

    if (usageB < usageA) {
      return 1;
    }

    return 0;
  };
};
