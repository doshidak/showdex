import { type GenerationNum } from '@smogon/calc';
import { PokemonInitialStats, PokemonStatNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
import { detectLegacyGen, getDefaultSpreadValue } from '@showdex/utils/dex';
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
  format: string | GenerationNum,
  pokemon: DeepPartial<CalcdexPokemon>,
): Partial<Showdown.StatsTable> => {
  if (!nonEmptyObject(pokemon?.baseStats)) {
    return { ...PokemonInitialStats };
  }

  const legacy = detectLegacyGen(format);
  const defaultIv = getDefaultSpreadValue('iv', format);
  const defaultEv = getDefaultSpreadValue('ev', format);

  return PokemonStatNames.reduce((prev, stat) => {
    // update (2023/02/07): cleaned up the baseStat fuckery that existed before
    const baseStat = pokemon.dirtyBaseStats?.[stat] ?? (
      pokemon.transformedForme && stat !== 'hp'
        ? pokemon.transformedBaseStats
        : pokemon.baseStats
    )?.[stat] as number;

    prev[stat] = calcPokemonStat(
      format,
      stat,
      baseStat,
      pokemon.ivs?.[stat] ?? defaultIv,
      pokemon.evs?.[stat] ?? defaultEv,
      (stat !== 'hp' && pokemon.transformedLevel) || (pokemon.level ?? 100),
      legacy ? undefined : pokemon.nature,
    );

    return prev;
  }, { ...PokemonInitialStats });
};
