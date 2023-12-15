import { type GameType } from '@smogon/calc';
import { PokemonToggleAbilities } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';

/**
 * Determines whether the `pokemon`'s `dirtyAbility` or `ability` is toggleable.
 *
 * * List of toggleable abilities are defined in `PokemonToggleAbilities` from `@showdex/consts/dex`.
 * * This does **not** determine whether the toggleable ability should be toggled.
 *   - For that, use `detectToggledAbility()` utility.
 * * Prior to v1.1.7, this was primarily used to populate the now ~~deprecated~~ removed `abilityToggleable` property of
 *   each `CalcdexPokemon`.
 *   - Now, this is primarily being used by `PokeInfo` directly to determine its local `showAbilityToggle` value.
 *   - As of v1.2.0, this property has been removed.
 *
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
