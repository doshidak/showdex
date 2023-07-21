import { type AbilityName } from '@smogon/calc/dist/data/interface';
import { PokemonToggleAbilities } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/redux/store';
// import { formatId } from '@showdex/utils/app'; // warning: circular dependency importing from here
// import { formatId } from '@showdex/utils/app/formatId'; /** @todo reorganize me */
// import { calcPokemonHp } from '@showdex/utils/calc';

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

  // Multiscale should only be toggleable if the Pokemon has 0% or 100% HP
  // (update: if not 0% or 100% HP, createSmogonPokemon() will set the HP to 100% if Multiscale is on)
  // if (formatId(ability) === 'multiscale') {
  //   const hpPercentage = calcPokemonHp(pokemon);
  //
  //   return !hpPercentage || hpPercentage === 1;
  // }

  return PokemonToggleAbilities.includes(ability);
};
