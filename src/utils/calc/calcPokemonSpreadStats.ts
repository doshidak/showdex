import { PokemonInitialStats, PokemonStatNames } from '@showdex/consts/pokemon';
import { detectLegacyGen } from '@showdex/utils/battle';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { calcPokemonStat } from './calcPokemonStat';

/**
 * Calculates the stats of a Pokemon based on its applied EV/IV/nature spread.
 *
 * * Assumes that `baseStats` are already pre-populated, hence why `pokemon` does not
 *   accept type `Showdown.Pokemon`.
 *   - Returns all `0`s for each stat if `dex.stats.calc()` and/or `baseStats` are not provided.
 * * Default EV of `0` and IV of `31` are applied if the corresponding EV/IV for a stat
 *   does not exist in the provided `pokemon`.
 *   - Not as important, but worth mentioning, if the Pokemon has no `level` defined (or is falsy, like `0`),
 *     the default level of `100` will apply.
 * * As of v0.1.3, this has been renamed from `calcPokemonStats()` to `calcPokemonSpreadStats()`,
 *   to better indicate what `CalcdexPokemon` property this is meant to populate (i.e., `spreadStats`).
 *
 * @since 0.1.0
 */
export const calcPokemonSpreadStats = (
  format: GenerationNum | string,
  pokemon: DeepPartial<CalcdexPokemon>,
): Partial<Showdown.StatsTable> => {
  if (!Object.keys(pokemon?.baseStats || {}).length) {
    return { ...PokemonInitialStats };
  }

  const legacy = detectLegacyGen(format);

  return PokemonStatNames.reduce((prev, stat) => {
    const baseStat = pokemon.dirtyBaseStats?.[stat] ?? (
      stat === 'hp'
        ? pokemon.baseStats?.hp
        : pokemon.transformedForme
          ? pokemon.transformedBaseStats?.[stat] ?? pokemon.baseStats?.[stat]
          : pokemon.baseStats?.[stat]
    );

    prev[stat] = calcPokemonStat(
      format,
      stat,
      baseStat,
      pokemon.ivs?.[stat] ?? (legacy ? 30 : 31),
      legacy ? undefined : pokemon.evs?.[stat] ?? 0,
      pokemon.level ?? 100,
      legacy ? undefined : pokemon.nature,
    );

    return prev;
  }, { ...PokemonInitialStats });
};
