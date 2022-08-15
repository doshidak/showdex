import { PokemonStatNames } from '@showdex/consts';
import type { Generation } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

const initialStats: Showdown.StatsTable = {
  hp: 0,
  atk: 0,
  def: 0,
  spa: 0,
  spd: 0,
  spe: 0,
};

export const calcPokemonStats = (
  dex: Generation,
  pokemon: DeepPartial<CalcdexPokemon>,
): Partial<Showdown.StatsTable> => PokemonStatNames.reduce((prev, stat) => {
  prev[stat] = dex.stats.calc(
    stat,
    pokemon.baseStats[stat],
    pokemon.ivs?.[stat] ?? 31,
    pokemon.evs?.[stat] ?? 0,
    pokemon.level || 100,
    dex.natures.get(pokemon.nature),
  );

  return prev;
}, { ...initialStats });
