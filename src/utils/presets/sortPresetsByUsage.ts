import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';

/**
 * Sorts `CalcdexPokemonPreset[]`'s by the provided usage percentages in `usages[]`.
 *
 * * Note that usage percentages for presets are typically present in Randoms with multiple roles, in which the
 *   percentages indicate the probabilities of being a certain role.
 * * If there are less than 2 `usages[]` available, this won't have any effect.
 *   - Single usage preset typically indicates it should apply format-wide, like in OU or Ubers.
 *   - Multiple usage presets typically indicate usages based on the Pokemon's role, typically in Randoms, typically.
 * * Meant to be passed as the `compareFunction` of `CalcdexPokemonPreset[].sort()`.
 *
 * @since 1.1.8
 */
export const sortPresetsByUsage = (
  usages: CalcdexPokemonPreset[],
): Parameters<Array<CalcdexPokemonPreset>['sort']>[0] => {
  if ((usages?.length || 0) < 2) {
    return (a, b) => (b?.usage || 0) - (a?.usage || 0);
  }

  return (a, b) => {
    const usageA = a?.usage || usages.find((p) => p?.source === 'usage' && p.name.includes(a.name))?.usage || 0;
    const usageB = b?.usage || usages.find((p) => p?.source === 'usage' && p.name.includes(b.name))?.usage || 0;

    if (usageA > usageB) {
      return -1;
    }

    if (usageB < usageA) {
      return 1;
    }

    return 0;
  };
};
