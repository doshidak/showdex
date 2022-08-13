import type { CalcdexPokemon } from '@showdex/redux/store';
import { detectPokemonIdent } from './detectPokemonIdent';

/* eslint-disable arrow-body-style */

export const detectSpeciesForme = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
): CalcdexPokemon['speciesForme'] => {
  // if ('speciesForme' in (pokemon || {})) {
  //   return sanitizeSpeciesForme(pokemon.speciesForme);
  // }

  return pokemon?.volatiles?.formechange?.[1] ||
    pokemon?.speciesForme ||
    detectPokemonIdent(pokemon)?.split?.(': ')?.[1];
};
