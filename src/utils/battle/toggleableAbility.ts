import { PokemonToggleAbilities } from '@showdex/consts';
import { formatId } from '@showdex/utils/app';
import { calcPokemonHp } from '@showdex/utils/calc';
import type { AbilityName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

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
  const ability = 'dirtyAbility' in pokemon ?
    pokemon.dirtyAbility || pokemon.ability :
    <AbilityName> pokemon?.ability;

  if (!ability) {
    return false;
  }

  // Multiscale should only be toggleable if the Pokemon has 100% HP
  if (formatId(ability) === 'multiscale') {
    return calcPokemonHp(pokemon) === 1;
  }

  return PokemonToggleAbilities.includes(ability);
};
