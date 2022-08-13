import type { CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';
import { detectPokemonIdent } from './detectPokemonIdent';

export const detectPlayerKeyFromPokemon = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<Showdown.ServerPokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPlayerKey => {
  const ident = detectPokemonIdent(pokemon);

  if (!ident || !/^p\d+:/.test(ident)) {
    return null;
  }

  return <CalcdexPlayerKey> ident.slice(0, ident.indexOf(':'));
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

  // console.log('firstPokemon', firstPokemon);

  return detectPlayerKeyFromPokemon(firstPokemon);
};
