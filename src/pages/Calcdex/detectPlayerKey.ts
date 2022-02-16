import type { CalcdexPlayerKey, CalcdexPokemon } from './CalcdexReducer';
import { detectPokemonIdent } from './detectPokemonIdent';

export const detectPlayerKeyFromPokemon = (
  pokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPlayerKey => {
  const ident = detectPokemonIdent(pokemon);

  if (ident && /^p\d+:/.test(ident)) {
    return <CalcdexPlayerKey> ident.slice(0, ident.indexOf(':'));
  }

  // actually, detectPokemonId() already detects for this in order to build the SideID in the ident string
  // if (pokemon?.side?.sideid) {
  //   return pokemon.side.sideid;
  // }

  return null;
};
