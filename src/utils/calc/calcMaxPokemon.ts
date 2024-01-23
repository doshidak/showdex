import { type CalcdexPlayer } from '@showdex/interfaces/calc';
import { env } from '@showdex/utils/core';

const minPokemon = Math.abs(env.int('honkdex-player-min-pokemon', 0));
const extendAmount = Math.abs(env.int('honkdex-player-extend-pokemon', 0));

/**
 * Calculates the value of the provided `player`'s `maxPokemon`.
 *
 * * Omitting the optional `partyLength` argument will use the `length` of the `pokemon[]` instead.
 * * Note that this is intended for Calcdexes operating in `'standalone'` mode (aka. Honkdexes).
 *   - Hence why this is specifically in `@showdex/utils/calc` & not `@showdex/utils/battle`, for instance.
 *   - (^ more of a note to my future self in case I get any ideas LOL)
 *
 * @since 1.2.3
 */
export const calcMaxPokemon = (
  player: CalcdexPlayer,
  partyLength?: number,
): number => {
  const currentMax = player?.maxPokemon || 0;
  const currentLength = partyLength || player?.pokemon?.length || 0;
  const maxPrime = currentMax - extendAmount;

  if (maxPrime > currentLength) {
    return Math.max(maxPrime, minPokemon);
  }

  const baseMax = Math.max(currentMax, minPokemon);

  if (currentLength >= baseMax && !(baseMax % extendAmount)) {
    return baseMax + extendAmount;
  }

  return baseMax;
};
