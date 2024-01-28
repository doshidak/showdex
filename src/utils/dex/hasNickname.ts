import { getDexForFormat } from './getDexForFormat';

/* eslint-disable @typescript-eslint/indent */

/**
 * Whether the passed-in `pokemon` has a nickname.
 *
 * @since 1.0.3
 */
export const hasNickname = <
  TPokemon extends Partial<Showdown.PokemonDetails>,
>(
  pokemon: TPokemon,
): boolean => {
  if (!pokemon?.speciesForme || !pokemon.name) {
    return false;
  }

  const dex = getDexForFormat();
  const dexSpecies = dex?.species.get(pokemon.speciesForme);

  return !pokemon.name.endsWith('-*')
    && !pokemon.speciesForme.endsWith('-*')
    && dexSpecies?.exists
    && !!dexSpecies.baseSpecies
    && pokemon.name !== dexSpecies.baseSpecies
    && pokemon.name !== pokemon.speciesForme.replace('-Tera', '');
};

/* eslint-enable @typescript-eslint/indent */
