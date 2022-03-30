import type { CalcdexPokemon } from './CalcdexReducer';

export type PokemonStatBoostDelta =
  | 'positive'
  | 'negative';

/**
 * Determines the direction of the delta of the Pokemon's stat boost.
 *
 * * In other words, checks whether the Pokemon's current stats are higher or lower than its base stats.
 * * In cases where it's neither (i.e., no boosts were applied to the passed-in `stat`), `null` will be returned.
 *
 * @since 0.1.2
 */
export const detectStatBoostDelta = (
  pokemon: CalcdexPokemon,
  stat: Showdown.StatName,
): PokemonStatBoostDelta => {
  if (stat === 'hp') {
    return null;
  }

  // check for boosts from abilities
  if ('slowstart' in (pokemon?.volatiles || {}) && pokemon?.abilityToggled) {
    if (['atk', 'spe'].includes(stat)) {
      return 'negative';
    }
  }

  // check for status-dependent boosts from abilities
  const abilitySearchString = pokemon?.ability?.toLowerCase?.();
  const hasGuts = abilitySearchString === 'guts';
  const hasQuickFeet = abilitySearchString === 'quick feet';

  if (pokemon?.status && pokemon.status !== '???') {
    if (hasGuts && stat === 'atk') {
      return 'positive';
    }

    if (hasQuickFeet && stat === 'spe') {
      return 'positive';
    }

    // may be problematic since we're not using the Pokemon's base stats,
    // but oh well, this ok for now lmaoo
    if (pokemon.status === 'brn' && stat === 'atk') {
      return 'negative';
    }

    if (pokemon.status === 'par' && stat === 'spe') {
      return 'negative';
    }
  }

  const boost = pokemon?.dirtyBoosts?.[stat] ?? pokemon?.boosts?.[stat] ?? 0;

  if (boost > 0) {
    return 'positive';
  }

  if (boost < 0) {
    return 'negative';
  }

  return null;
};
