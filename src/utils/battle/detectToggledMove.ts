import { type MoveName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/redux/store';
import { PokemonToggleMoves } from '@showdex/consts/dex';
import { formatId, nonEmptyObject } from '@showdex/utils/core';

/**
 * Determines if the `moveName` is toggleable & if so, whether it's currently active.
 *
 * * Note that `false` can be returned if the `moveName` isn't toggleable or if it is, it isn't active.
 *   - i.e., Don't use this as a way of determining if a move is toggleable or not!
 * * As mentioned in `PokemonToggleMoves`, each move must be specifically handled.
 *
 * @since 1.1.6
 */
export const detectToggledMove = (
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): boolean => {
  if (!pokemon?.speciesForme || !moveName || !PokemonToggleMoves.includes(moveName)) {
    return false;
  }

  const moveId = formatId(moveName);

  switch (moveId) {
    case 'powertrick': {
      return nonEmptyObject(pokemon.volatiles) && 'powertrick' in pokemon.volatiles;
    }

    default: {
      break;
    }
  }

  return false;
};
