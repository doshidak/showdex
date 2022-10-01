import { Move as SmogonMove } from '@smogon/calc';
// import { formatId } from '@showdex/utils/app';
import { getGenDexForFormat, getMaxMove, getZMove } from '@showdex/utils/battle';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { alwaysCriticalHits } from './alwaysCriticalHits';

export const createSmogonMove = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): SmogonMove => {
  // using the Dex global for the gen arg of SmogonMove seems to work here lol
  const dex = getGenDexForFormat(format);

  if (!dex || !format || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  const ability = pokemon.dirtyAbility ?? pokemon.ability;
  const item = pokemon.dirtyItem ?? pokemon.item;

  return new SmogonMove(dex, moveName, {
    species: pokemon.speciesForme,

    ability,
    item,

    // only apply one of them, not both!
    useZ: pokemon.useZ && !pokemon.useMax,
    useMax: pokemon.useMax,

    // for moves that always crit, we need to make sure the crit doesn't apply when Z/Max'd
    isCrit: (
      alwaysCriticalHits(moveName, format)
        && (!pokemon.useZ || !getZMove(moveName, item))
        && (!pokemon.useMax || !getMaxMove(moveName, ability, pokemon.speciesForme))
    ) || pokemon.criticalHit,
  });
};
