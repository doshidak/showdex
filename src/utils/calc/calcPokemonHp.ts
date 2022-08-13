import type { CalcdexPokemon } from '@showdex/redux/store';

export const calcPokemonHp = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon>,
): CalcdexPokemon['hp'] => (pokemon?.hp || 0) / (pokemon?.maxhp || 1);
