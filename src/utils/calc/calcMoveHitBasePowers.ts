import { type GenerationNum, type MoveName } from '@smogon/calc';
import { detectLegacyGen, getDexForFormat } from '@showdex/utils/dex';

/**
 * Calculates each hit's base power of a multi-hitting move.
 *
 * * `config.basePower` & `config.hits` will be determined from a dex lookup on the provided `moveName` if not specified.
 *   - Only exceptions for base power lookups are *Triple Axel* & *Triple Kick*, whose base powers increase by a fixed
 *     amount after each consecutive hit (thank you gam frek, very cool!).
 *   - Specifying `config.basePower` will always override the dex lookup behavior, including calculating the special
 *     multihit base powers for the aforementioned exceptions (see examples below).
 * * Returned array of numbers (representing each hit's base power) will have the length of `config.hits`.
 *   - Exception to this is *Triple Kick*, but in gen 2 specifically, where each consecutive hit multiplies its base
 *     *damage*, not base *power*!
 *   - For this reason, this will return an empty array & `calcMoveBasePower()`'s value should be used instead.
 * * Note that this doesn't check if `config.hits` is legal in order to support some hacky custom format (who knows?).
 *   - This means you can pass in `5` for *Triple Kick* (in, say, gen 9) despite the legal max being 3 & get back 5 numbers,
 *     i.e., `[10, 20, 30, 40, 50]`, which continues the pattern in the move's mechanic.
 *   - Idea is to allow the `PokeMoves` editor to render multiple `ValueField`'s `map()`'d from this array value.
 * * Guaranteed to return an empty array.
 *
 * @example
 * ```ts
 * calcMoveHitBasePowers(
 *   9 as GenerationNum,
 *   'Rock Blast' as MoveName,
 * );
 *
 * // note: dex lookup was performed to obtain the base power of 25 since config.basePower wasn't provided;
 * // since this move's multihit is [2, 5] (meaning it hits 2-5 times), we take the floored average of 3
 * [25, 25, 25]
 * ```
 * @example
 * ```ts
 * calcMoveHitBasePowers(
 *   'gen9randombattle',
 *   'Icicle Spear' as MoveName,
 *   {
 *     basePower: 69, // normally 25 from the dex lookup if omitted
 *     hits: 5,
 *   },
 * );
 *
 * [69, 69, 69, 69, 69]
 * ```
 * @example
 * ```ts
 * calcMoveHitBasePowers(
 *   'gen2ou', // note the gen here
 *   'Triple Kick' as MoveName,
 * );
 *
 * [] // see explanation above for why this is an empty array
 * ```
 * @example
 * ```ts
 * calcMoveHitBasePowers(
 *   'gen9customgame',
 *   'Triple Kick' as MoveName,
 *   {
 *     hits: 8, // this is illegal btw, but still works for custom formats
 *   },
 * );
 *
 * [10, 20, 30, 40, 50, 60, 70, 80]
 * ```
 * @example
 * ```ts
 * calcMoveHitBasePowers(
 *   'gen9ou',
 *   'Triple Kick' as MoveName,
 *   {
 *     basePower: 69, // overrides default dex lookup behavior, including special mechanics for moves like this one
 *     hits: 2, // Triple Kick hits up to 3 times, but we're demonstrating only landing 2
 *   },
 * );
 *
 * [69, 69]
 * ```
 * @since 1.2.4
 */
export const calcMoveHitBasePowers = (
  format: string | GenerationNum,
  moveName: MoveName,
  config?: {
    basePower?: number;
    hits?: number;
  },
): number[] => {
  let { basePower, hits } = { ...config };

  if ((!basePower && !(['Triple Axel', 'Triple Kick'] as MoveName[]).includes(moveName)) || !hits) {
    const dex = getDexForFormat(format);
    const move = dex.moves.get(moveName);

    if (!move?.exists) {
      return [];
    }

    if (!basePower && move.basePower) {
      ({ basePower } = move);
    }

    if (!hits) {
      hits = (Array.isArray(move.multihit) && Math.floor((move.multihit[0] + move.multihit[1]) / 2))
        || (typeof move.multihit === 'number' && move.multihit)
        || 0;
    }
  }

  if (!hits) {
    return [];
  }

  switch (moveName) {
    case 'Triple Axel': {
      // e.g., hits = 3 -> [20, 40, 60]; hits = 5 (illegal) -> [20, 40, 60, 80, 100]
      return Array.from({ length: hits }, (_, i) => 20 * (i + 1));
    }

    case 'Triple Kick': {
      // see notes in the jsdoc above -- using hacked up value from calcMoveBasePower() for gen 2 instead
      if (detectLegacyGen(format)) {
        return [];
      }

      // e.g., hits = 1 -> [10]; hits = 3 -> [10, 20, 30]; hits = 4 (illegal) -> [10, 20, 30, 40]
      return Array.from({ length: hits }, (_, i) => 10 * (i + 1));
    }

    default: {
      break;
    }
  }

  if (!basePower) {
    return [];
  }

  // e.g., moveName = 'Rock Blast', basePower = 25, hits = 3 -> [25, 25, 25]
  return Array.from({ length: hits }, () => basePower);
};
