import type { CalcdexPlayerKey, CalcdexPokemon } from './CalcdexReducer';
import { detectPokemonIdent } from './detectPokemonIdent';

export const detectPlayerKeyFromPokemon = (
  pokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPlayerKey => {
  const ident = detectPokemonIdent(pokemon);

  if (ident && /^p\d+:/.test(ident)) {
    return <CalcdexPlayerKey> ident.slice(0, ident.indexOf(':'));
  }

  return null;
};
