import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';

export type PokemonStatBoostDelta =
  | 'positive'
  | 'negative';

/**
 * Determines the direction of the delta of the Pokemon's stat boost.
 *
 * * In other words, checks whether the Pokemon's ~~current~~ final stats are higher or lower than its ~~base~~ spread stats.
 * * In cases where it's neither (i.e., spread stat and final stat are equal), `null` will be returned.
 * * Typically used for applying styling to the UI to indicate a boosted or reduced stat value.
 *
 * @since 0.1.2
 */
export const detectStatBoostDelta = (
  pokemon: CalcdexPokemon,
  finalStats: Showdown.StatsTable,
  stat: Showdown.StatName,
): PokemonStatBoostDelta => {
  if (!nonEmptyObject(pokemon?.spreadStats) || !nonEmptyObject(finalStats)) {
    return null;
  }

  const spreadStat = pokemon.spreadStats[stat] ?? 0;
  const finalStat = finalStats[stat] ?? 0;

  if (finalStat > spreadStat) {
    return 'positive';
  }

  if (finalStat < spreadStat) {
    return 'negative';
  }

  return null;
};
