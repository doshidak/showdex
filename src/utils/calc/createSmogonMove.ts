import { Move as SmogonMove } from '@smogon/calc';
import { formatId } from '@showdex/utils/app';
import type { Generation, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

export const createSmogonMove = (
  dex: Generation,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): SmogonMove => {
  if (!dex?.num || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  // note: for whatever reason, gen 8 dex does not include information about Hidden Power
  // (including any other types, such as Hidden Power Fire -- returns undefined!)
  const isHiddenPower = formatId(moveName).includes('hiddenpower');

  const determinedDex = dex.num === 8 && (isHiddenPower || pokemon.useZ)
    ? 7
    : dex;

  const smogonMove = new SmogonMove(determinedDex, moveName, {
    species: pokemon.speciesForme,
    ability: pokemon.dirtyAbility ?? pokemon.ability,
    item: pokemon.dirtyItem ?? pokemon.item,
    useZ: pokemon.useZ,
    useMax: pokemon.useMax,
    isCrit: pokemon.criticalHit ?? false,
  });

  return smogonMove;
};
