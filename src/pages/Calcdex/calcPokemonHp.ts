import type { CalcdexPokemon } from './CalcdexReducer';

export const calcPokemonHp = (
  pokemon: Partial<Showdown.Pokemon & CalcdexPokemon>,
): CalcdexPokemon['hp'] => (pokemon?.hp || 0) / (pokemon?.maxhp || 1);
