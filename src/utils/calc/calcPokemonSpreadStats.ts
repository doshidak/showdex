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
    // update (2026/09/12): Transform copies the target's actual stats (Pokemon#transformInto() assigns the target's
    // storedStats outright), so once syncBattle() knows them, a transformed Pokemon's own nature/IVs/EVs are
    // irrelevant for everything but HP. deriving them from transformedBaseStats + this Pokemon's spread instead is
    // how an opposing Ditto that copied your Gouging Fire -- whose exact stats the server hands you -- ended up
    // showing its own (or some usage) spread laid over Gouging Fire's base stats (doshidak/showdex#236)
    const transformedSpreadStat = (
      !!pokemon.transformedForme
        && stat !== 'hp'
        && pokemon.transformedSpreadStats?.[stat]
    ) || 0;

    if (transformedSpreadStat > 0) {
      prev[stat] = transformedSpreadStat;

      return prev;
    }

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
