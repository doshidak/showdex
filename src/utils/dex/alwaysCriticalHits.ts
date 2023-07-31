import { type GenerationNum, type MoveName } from '@smogon/calc';
import { PokemonCriticalHitMoves } from '@showdex/consts/dex';
import { getDexForFormat } from './getDexForFormat';

/**
 * Internally used regex for testing if the move's description (either `desc` or `shortDesc`) mentions
 * anything about *always resulting in a critical hit*.
 *
 * * Passes for the following descriptions via `test()` (regex matches are **bolded**):
 *   - ***Always results in a critical hit**.*
 *   - *Nearly always goes first. **Always crits**.*
 *   - *Will **always result in a critical hit**.*
 *   - *This move is **always a critical hit** unless the target is under the effect of Lucky Chant or
 *     has the Battle Armor or Shell Armor abilities.*
 *
 * @since 1.0.3
 */
const CriticalHitDescRegex = /always\s+(?:results?\s+(?:in\s+)?)?(?:crits?|a\s+crit(?:ical)?\s+hit)/i;

/**
 * Determines if the provided `moveName` will always be a critical hit.
 *
 * * Since the global `Dex` object does not provide `willCrit` in the returned `Smogon.Move` class,
 *   we'll cheekily use the description (`desc`) to look for the keywords *always* and *critical hit*.
 * * Normally, this would be determined by the `willCrit` property of the `Move` class from `@pkmn/dex`,
 *   but that data is embedded in `data/moves.json` of the aforementioned package.
 *   - Interestingly, at the time of writing, there are 8 moves with `willCrit` defined in the
 *     `data/moves.json` file.
 *   - Of the 8 moves, 3 of them have `willCrit` as `false`:
 *     - *Counter* (`'counter'`)
 *     - *Flail* (`'flail'`)
 *     - *Reversal* (`'reversal'`)
 *   - Remaining 5 moves with `willCrit` as `true` are as follows:
 *     - *Frost Breath* (`'frostbreath'`)
 *     - *Storm Throw* (`'stormthrow'`)
 *     - *Surging Strikes* (`'surgingstrikes'`)
 *     - *Wicked Blow* (`'wickedblow'`)
 *     - *Zippy Zap* (`'zippyzap'`)
 * * Note that `calculate()` of `@smogon/calc` will automatically account for abilities and items that
 *   discount critical hits, such as the *Battle Armor* ability and the *Lucky Chant* item.
 *   - In other words, should be all good passing this function's return value to `isCrit` in
 *     `createSmogonMove()` without considering the opposing Pokemon's ability/item.
 *
 * @since 1.0.3
 */
export const alwaysCriticalHits = (
  moveName: MoveName,
  format?: string | GenerationNum,
): boolean => {
  const dex = getDexForFormat(format);

  if (!moveName || !dex) {
    return false;
  }

  if (PokemonCriticalHitMoves.includes(moveName)) {
    return true;
  }

  const dexMove = dex.moves.get(moveName);

  if (!dexMove?.exists || !dexMove.desc) {
    return false;
  }

  return (!!dexMove.shortDesc && CriticalHitDescRegex.test(dexMove.shortDesc))
    || CriticalHitDescRegex.test(dexMove.desc);
};
