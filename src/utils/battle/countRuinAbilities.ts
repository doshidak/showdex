import type { CalcdexBattleField } from '@showdex/redux/store';

/**
 * Since the *Ruin* ability counters are stored per-side (in `CalcdexPlayerSide`),
 * this utility adds the counters from both the `attackerSide` and `defenderSide` in the provided `field`.
 *
 * @since 1.1.0
 */
export const countRuinAbilities = (
  field: CalcdexBattleField,
): Record<'beads' | 'sword' | 'tablets' | 'vessel', number> => ({
  beads: (field?.attackerSide?.ruinBeadsCount || 0) + (field?.defenderSide?.ruinBeadsCount || 0),
  sword: (field?.attackerSide?.ruinSwordCount || 0) + (field?.defenderSide?.ruinSwordCount || 0),
  tablets: (field?.attackerSide?.ruinTabletsCount || 0) + (field?.defenderSide?.ruinTabletsCount || 0),
  vessel: (field?.attackerSide?.ruinVesselCount || 0) + (field?.defenderSide?.ruinVesselCount || 0),
});
