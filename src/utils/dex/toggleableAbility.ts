import { type AbilityName, type GameType } from '@smogon/calc';
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
  pokemon: Partial<Showdown.Pokemon> | Partial<CalcdexPokemon>,
  gameType: GameType = 'Singles',
): boolean => {
  const ability = (
    'dirtyAbility' in (pokemon || {})
      && (pokemon as Partial<CalcdexPokemon>).dirtyAbility
  ) || pokemon?.ability as AbilityName;

  if (!ability || !PokemonToggleAbilities[gameType]?.length) {
    return false;
  }

  return PokemonToggleAbilities[gameType].includes(ability);
};
