import type { CalcdexPokemon } from '@showdex/redux/store';

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
  // if (stat === 'hp') {
  //   return null;
  // }

  // check for boosts from abilities
  // if ('slowstart' in (pokemon?.volatiles || {}) && pokemon?.abilityToggled) {
  //   if (['atk', 'spe'].includes(stat)) {
  //     return 'negative';
  //   }
  // }

  // check for status-dependent boosts from abilities
  // const abilitySearchString = pokemon?.ability?.toLowerCase?.();
  // const hasGuts = abilitySearchString === 'guts';
  // const hasQuickFeet = abilitySearchString === 'quick feet';

  // if (pokemon?.status && pokemon.status !== '???') {
  //   if (hasGuts && stat === 'atk') {
  //     return 'positive';
  //   }
  //
  //   if (hasQuickFeet && stat === 'spe') {
  //     return 'positive';
  //   }
  //
  //   // may be problematic since we're not using the Pokemon's base stats,
  //   // but oh well, this ok for now lmaoo
  //   if (pokemon.status === 'brn' && stat === 'atk') {
  //     return 'negative';
  //   }
  //
  //   if (pokemon.status === 'par' && stat === 'spe') {
  //     return 'negative';
  //   }
  // }

  // const boost = pokemon?.dirtyBoosts?.[stat] ?? pokemon?.boosts?.[stat] ?? 0;

  const spreadStat = pokemon?.spreadStats?.[stat] ?? 0;
  const finalStat = finalStats?.[stat] ?? 0;

  if (finalStat > spreadStat) {
    return 'positive';
  }

  if (finalStat < spreadStat) {
    return 'negative';
  }

  return null;
};
