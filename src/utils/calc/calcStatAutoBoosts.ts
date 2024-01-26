import { PokemonBoostNames } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';

/**
 * Calculates the number of auto-boosted stages for the given `stat` from the provided `pokemon`.
 *
 * * Returns `null` if the stages couldn't be determined.
 *   - This is to distinguish between actual `0` stage boosts & failed calculations since both values are falsy.
 *   - In other words, make sure you check the return value's `typeof`, not the falsiness!
 *
 * @since 1.2.3
 */
export const calcStatAutoBoosts = (
  pokemon: CalcdexPokemon,
  stat: Showdown.StatNameNoHp,
): number => (
  nonEmptyObject(pokemon?.autoBoostMap) && PokemonBoostNames.includes(stat)
    ? Object.values(pokemon.autoBoostMap).reduce((prev, fx) => {
      const shouldIgnore = !nonEmptyObject(fx?.boosts)
        || (typeof fx.turn === 'number' && fx.turn > -1)
        || !fx.active;

      if (shouldIgnore) {
        return prev;
      }

      return prev + (fx.boosts[stat] || 0);
    }, 0)
    : null
);
