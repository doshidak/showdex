import { PokemonSpeedReductionItems } from '@showdex/consts/dex';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/redux/store';
import { formatId } from '@showdex/utils/core';
import { hasMegaForme } from './hasMegaForme';

/**
 * Determines whether the `pokemon`'s item's effects should be ignored.
 *
 * @since 1.1.0
 */
export const shouldIgnoreItem = (
  pokemon: CalcdexPokemon,
  field?: CalcdexBattleField,
): boolean => {
  const speciesForme = pokemon?.transformedForme || pokemon?.speciesForme;

  if (!speciesForme) {
    return false;
  }

  const ability = formatId(pokemon.dirtyAbility || pokemon.ability);
  const item = formatId(pokemon.dirtyItem ?? pokemon.item);

  return 'embargo' in (pokemon.volatiles || {}) // Embargo is a move
    || hasMegaForme(speciesForme)
    || field?.isMagicRoom
    || (ability === 'klutz' && !PokemonSpeedReductionItems.map((i) => formatId(i).includes(item)));
};
