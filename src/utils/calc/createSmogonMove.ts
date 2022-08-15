import { Move as SmogonMove } from '@smogon/calc';
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

  const smogonMove = new SmogonMove(dex, moveName, {
    species: pokemon?.rawSpeciesForme || pokemon?.speciesForme,
    ability: pokemon?.dirtyAbility ?? pokemon?.ability,
    item: pokemon?.dirtyItem ?? pokemon?.item,
    useZ: dex.num === 7 && pokemon?.useUltimateMoves,
    useMax: dex.num === 8 && pokemon?.useUltimateMoves,
    isCrit: pokemon?.criticalHit ?? false,
  });

  return smogonMove;
};
