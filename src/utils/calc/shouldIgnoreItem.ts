import { PokemonSpeedReductionItems } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import { hasMegaForme } from '@showdex/utils/battle';
import type { CalcdexBattleField, CalcdexPokemon } from '@showdex/redux/store';

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

  return 'embargo' in pokemon.volatiles // Embargo is a move
    || hasMegaForme(speciesForme)
    || field?.isMagicRoom
    || (ability === 'klutz' && !PokemonSpeedReductionItems.map((i) => formatId(i).includes(item)));
};
