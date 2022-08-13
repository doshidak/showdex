import { PokemonToggleAbilities } from '@showdex/consts';
import { calcPokemonHp } from '@showdex/utils/calc';
import type { AbilityName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

/**
 * Determines whether the Pokemon's toggleable ability is active (if applicable).
 *
 * * Primarily depends on the Pokemon's `volatiles` object (from the `battle` state).
 *   - For instance, if Heatran's *Flash Fire* ability is activated, you'll see its `volatiles` object
 *     set to `{ flashfire: ['flashfire'] }` (at the time of writing this, of course).
 *   - Otherwise, its `ability` would still be `'Flash Fire'`, but `volatiles` would be an empty object, i.e., `{}`.
 * * Only exception is the *Multiscale* ability, which is only active when the Pokemon's HP is at 100%,
 *   similar to how the *Focus Sash* item works.
 *   - Pretty sure `calculate()` from `@smogon/calc` doesn't care whether `abilityOn` (of `SmogonPokemon`)
 *     is `true` or `false`, but we keep track of it for visual purposes.
 *     - (Side note: `SmogonPokemon` mentioned above is an alias of the `Pokemon` class from `@smogon/calc`.)
 *   - Pokemon's HP value isn't currently editable, so there's no way to toggle *Multiscale* on/off
 *     (before the Pokemon takes any damage).
 *   - Additionally, if, say, Dragonite takes damage, this would return `false`, since its HP is no longer at 100%.
 *     In the case where Dragonite uses *Roost* and the opponent doesn't attack (e.g., switches out),
 *     resulting in Dragonite healing back to full health (i.e., 100%), this would return `true` again.
 *
 * @returns `true` if the Pokemon's ability is *toggleable* and *active*, `false` otherwise.
 * @since 0.1.2
 */
export const detectToggledAbility = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): boolean => {
  const ability = pokemon?.ability;
  const hasMultiscale = ability?.toLowerCase?.() === 'multiscale';
  const toggleAbility = !hasMultiscale && PokemonToggleAbilities.includes(<AbilityName> ability);

  if (hasMultiscale) {
    return calcPokemonHp(pokemon) === 1;
  }

  if (toggleAbility) {
    return Object.keys(pokemon?.volatiles ?? {}).includes(
      ability?.replace?.(/\s/g, '').toLowerCase(),
    );
  }

  return false;
};
