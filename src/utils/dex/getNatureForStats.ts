import { PokemonNatureBoosts, PokemonStatNames } from '@showdex/consts/dex';

/**
 * Returns the corresponding nature for given the `positive`-ly & `negative`-ly affected stats.
 *
 * * `'Hardy'` will be returned if any of the inputs are invalid.
 *
 * @example
 * ```ts
 * getNatureForStats(); // -> 'Hardy'
 * getNatureForStats(null, null); // -> 'Hardy'
 * getNatureForStats('atk'); // -> 'Hardy'
 * getNatureForStats('atk', 'atk'); // -> 'Hardy'
 * getNatureForStats('hp', 'atk'); // -> 'Hardy'
 * getNatureForStats('atk', 'spa'); // -> 'Adamant'
 * ```
 * @since 1.1.8
 */
export const getNatureForStats = (
  positive: Showdown.StatNameNoHp,
  negative: Showdown.StatNameNoHp,
): Showdown.NatureName => {
  const inputsValid = (!!positive && !!negative)
    && (PokemonStatNames.includes(positive) && (positive as string) !== 'hp')
    && (PokemonStatNames.includes(negative) && (negative as string) !== 'hp');

  if (!inputsValid) {
    return 'Hardy';
  }

  const nature = Object.entries(PokemonNatureBoosts).find(([
    ,
    [pos, neg],
  ]) => (
    pos === positive
      && neg === negative
  ))?.[0] as Showdown.NatureName;

  return nature || 'Hardy';
};
