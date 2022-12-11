import type { CalcdexBattleField } from '@showdex/redux/store';
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
 *
 * @since 1.1.0
 */
export const ruinAbilitiesActive = (
  field: CalcdexBattleField,
): boolean => !!field?.gameType
  && !!Object.values(countRuinAbilities(field)).reduce((sum, count) => sum + count, 0);
