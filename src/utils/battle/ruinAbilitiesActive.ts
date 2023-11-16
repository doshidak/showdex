import { type CalcdexPlayerSide } from '@showdex/interfaces/calc';
import { countRuinAbilities } from './countRuinAbilities';

/**
 * Checks if any *Ruin* abilities are active on the `field`.
 *
 * * Introduced in Gen 9, the *Ruin* abilities are as follows:
 *   - *Beads of Ruin*, reducing SPD of all other active Pokemon by 25%,
 *   - *Sword of Ruin*, reducing DEF of all other active Pokemon by 25%,
 *   - *Tablets of Ruin*, reducing ATK of all other active Pokemon by 25%, and
 *   - *Vessel of Ruin*, reducing SPA of all other active Pokemon by 25%.
 * * Effects of these abilities can stack, more applicable in Doubles.
 *   - However, this utility just checks if any are active at all.
 * * As of v1.1.3, since the `CalcdexPlayerSide` is now attached to each `CalcdexPlayer`,
 *   as opposed to the `CalcdexBattleField` in prior versions, the arguments have been updated.
 *
 * @since 1.1.0
 */
export const ruinAbilitiesActive = (
  // playerSide: CalcdexPlayerSide,
  // opponentSide: CalcdexPlayerSide,
  ...sides: CalcdexPlayerSide[]
): boolean => !!sides?.length
  // && !!Object.keys(playerSide || {}).length
  // && !!Object.keys(opponentSide || {}).length
  // && !!Object.values(countRuinAbilities(playerSide, opponentSide))
  && !!Object.values(countRuinAbilities(...sides))
    .reduce((sum, count) => sum + count, 0);
