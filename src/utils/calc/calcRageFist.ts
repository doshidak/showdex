import { formatId } from '@showdex/utils/app';
import { clamp } from '@showdex/utils/core';
import type { CalcdexPokemon } from '@showdex/redux/store';

/**
 * Calculates the base power of *Rage Fist* (gen 9).
 *
 * * Base power starts at `50` and caps at `350` (both inclusive), as per Game Freak's specifications.
 *   - For each time the Pokemon was hit, *Rage Fist*'s base power increases by 50.
 *   - e.g., After a single hit, *Rage Fist* now has 50 + (50 * 1) = 100 base power.
 * * Note that if the provided `pokemon` does not have *Rage Fist* in its `moves`,
 *   this will return `0`.
 *
 * @example
 * ```ts
 * calcRageFist(<CalcdexPokemon> {
 *   ...,
 *   speciesForme: 'Annihilape',
 *   moves: ['U-turn', 'Close Combat', 'Shadow Claw', 'Ice Punch'],
 *   hitCounter: 2,
 *   ...,
 * });
 *
 * 0 // since 'Rage Fist' is not in `moves`
 * ```
 * @example
 * ```ts
 * calcRageFist(<CalcdexPokemon> {
 *   ...,
 *   speciesForme: 'Annihilape',
 *   moves: ['Bulk Up', 'Taunt', 'Drain Punch', 'Rage Fist'],
 *   hitCounter: 10, // take note of this value
 *   ...,
 * });
 *
 * 350 // capped at 350 BP!
 * ```
 * @default 0
 * @see https://github.com/smogon/pokemon-showdown-client/blob/de8e7ea0d17305046c957574e52c613eeed50630/src/battle-tooltips.ts#L1788-L1793
 * @since 1.1.0
 */
export const calcRageFist = (
  pokemon: CalcdexPokemon,
): number => {
  if (!pokemon?.speciesForme || !pokemon.moves.length) {
    return 0;
  }

  const {
    moves,
    hitCounter = 0,
  } = pokemon;

  const hasRageFist = moves.some((m) => formatId(m) === 'ragefist');

  if (!hasRageFist) {
    return 0;
  }

  const hitCount = Math.max(hitCounter, 0);
  const basePower = 50 * (hitCount + 1);

  return clamp(0, basePower, 350);
};
