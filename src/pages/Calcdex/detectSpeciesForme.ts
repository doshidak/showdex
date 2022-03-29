import type { CalcdexPokemon } from './CalcdexReducer';
import { detectPokemonIdent } from './detectPokemonIdent';
// import { sanitizeSpeciesForme } from './sanitizeSpeciesForme';

/* eslint-disable arrow-body-style */

export const detectSpeciesForme = (
  pokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPokemon['speciesForme'] => {
  // if ('speciesForme' in (pokemon || {})) {
  //   return sanitizeSpeciesForme(pokemon.speciesForme);
  // }

  return detectPokemonIdent(pokemon)?.split?.(': ')?.[1];
};
