import { Move as SmogonMove } from '@smogon/calc';
// import { formatId } from '@showdex/utils/app';
import { getDexForFormat } from '@showdex/utils/battle';
import type { Generation, MoveName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

export const createSmogonMove = (
  // gen: GenerationNum,
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): SmogonMove => {
  // using the Dex global for the gen arg of SmogonMove seems to work here lol
  const dex = <Generation> <unknown> getDexForFormat(format);

  if (!dex || !format || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  return new SmogonMove(dex, moveName, {
    species: pokemon.speciesForme,
    ability: pokemon.dirtyAbility ?? pokemon.ability,
    item: pokemon.dirtyItem ?? pokemon.item,
    useZ: pokemon.useZ && !pokemon.useMax, // only apply one of them, not both!
    useMax: pokemon.useMax,
    isCrit: pokemon.criticalHit,
  });
};
