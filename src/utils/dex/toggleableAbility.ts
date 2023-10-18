import { type GameType } from '@smogon/calc';
import { PokemonToggleAbilities } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/redux/store';

/**
 * Determines the value of the `abilityToggleable` property in a `CalcdexPokemon`.
 *
 * * 10/10 name, I know.
 *
 * @see CalcdexPokemon['abilityToggleable']
 * @since 0.1.3
 */
export const toggleableAbility = (
  pokemon: Partial<CalcdexPokemon>,
  gameType: GameType = 'Singles',
): boolean => {
  if (!pokemon?.speciesForme || !PokemonToggleAbilities[gameType]?.length) {
    return false;
  }

  const ability = pokemon.dirtyAbility || pokemon.ability;

  if (!ability) {
    return false;
  }

  return PokemonToggleAbilities[gameType].includes(ability);
};
