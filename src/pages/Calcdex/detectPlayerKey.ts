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

export const detectPlayerKeyFromBattle = (
  battle: Showdown.Battle,
): CalcdexPlayerKey => {
  if (battle?.mySide?.sideid) {
    // console.log('battle.mySide.sideid', battle.mySide.sideid, '\n', 'mySide', {
    //   sideid: battle.mySide.sideid,
    //   name: battle.mySide.name,
    //   myPokemon: battle.myPokemon,
    // });

    return <CalcdexPlayerKey> battle.mySide.sideid;
  }

  if (!battle?.myPokemon?.[0]) {
    return null;
  }

  const [firstPokemon] = <CalcdexPokemon[]> <unknown> battle.myPokemon;

  console.log('firstPokemon', firstPokemon);

  return detectPlayerKeyFromPokemon(firstPokemon);
};
