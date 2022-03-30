import { Move as SmogonMove } from '@smogon/calc';
import type { GenerationNum, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from './CalcdexReducer';

export const createSmogonMove = (
  gen: GenerationNum,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): SmogonMove => {
  if (!gen || !pokemon?.rawSpeciesForme || !moveName) {
    return null;
  }

  const smogonMove = new SmogonMove(gen, moveName, {
    species: pokemon?.rawSpeciesForme,
    ability: pokemon?.dirtyAbility ?? pokemon?.ability,
    item: pokemon?.dirtyItem ?? pokemon?.item,
    useZ: gen === 7 && pokemon?.useUltimateMoves,
    useMax: gen === 8 && pokemon?.useUltimateMoves,
    isCrit: pokemon?.criticalHit ?? false,
  });

  return smogonMove;
};
