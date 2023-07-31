import { type AbilityName } from '@smogon/calc';
import { PokemonToggleAbilities } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/redux/store';

/**
 * Determines the value of the `abilityToggleable` property in a `CalcdexPokemon`.
 *
 * * 10/10 name, I know.
 *
 * @see `CalcdexPokemon['abilityToggleable']` in `src/redux/store/calcdexSlice.ts`
 * @since 0.1.3
 */
export const toggleableAbility = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): boolean => {
  const ability = 'dirtyAbility' in pokemon
    ? pokemon.dirtyAbility ?? pokemon.ability
    : pokemon.ability as AbilityName;

  if (!ability) {
    return false;
  }

  return PokemonToggleAbilities.includes(ability);
};
