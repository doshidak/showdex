import type { CalcdexPlayerSide } from '@showdex/redux/store';

/**
 * Since the *Ruin* ability counters are stored per-side (in `CalcdexPlayerSide`),
 * this utility adds the counters from both the `attackerSide` and `defenderSide` in the provided `field`.
 *
 * * As of v1.1.3, since the `CalcdexPlayerSide` is now attached to each `CalcdexPlayer`,
 *   as opposed to the `CalcdexBattleField` in prior versions, the arguments have been updated.
 *
 * @since 1.1.0
 */
export const countRuinAbilities = (
  // playerSide: CalcdexPlayerSide,
  // opponentSide: CalcdexPlayerSide,
  ...sides: CalcdexPlayerSide[]
): Record<'beads' | 'sword' | 'tablets' | 'vessel', number> => ({
  // beads: (playerSide?.ruinBeadsCount || 0) + (opponentSide?.ruinBeadsCount || 0),
  // sword: (playerSide?.ruinSwordCount || 0) + (opponentSide?.ruinSwordCount || 0),
  // tablets: (playerSide?.ruinTabletsCount || 0) + (opponentSide?.ruinTabletsCount || 0),
  // vessel: (playerSide?.ruinVesselCount || 0) + (opponentSide?.ruinVesselCount || 0),
  beads: sides?.reduce((sum, side) => sum + (side?.ruinBeadsCount || 0), 0) || 0,
  sword: sides?.reduce((sum, side) => sum + (side?.ruinSwordCount || 0), 0) || 0,
  tablets: sides?.reduce((sum, side) => sum + (side?.ruinTabletsCount || 0), 0) || 0,
  vessel: sides?.reduce((sum, side) => sum + (side?.ruinVesselCount || 0), 0) || 0,
});
