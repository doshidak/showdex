import { type State as SmogonState } from '@smogon/calc';

/**
 * Convenient type alias of the `sideConditions` property in `Showdown.Side`.
 *
 * @since 1.1.7
 */
export type CalcdexPlayerSideConditions = Showdown.Side['sideConditions'];

/**
 * Field conditions on the player's side.
 *
 * * Additional properties that will be unused by the `Side` constructor are included
 *   as they may be used in Pokemon stat calculations.
 * * As of v1.1.3, these are now attached to each individual `CalcdexPlayer` instead
 *   of the `CalcdexBattleField`.
 *
 * @since 0.1.3
 */
export interface CalcdexPlayerSide extends SmogonState.Side {
  /**
   * Current side conditions synced directly from the battle.
   *
   * * Not used by the calc, but by `sanitizePlayerSide()` to populate `spikes` and `isSR` (*Stealth Rock*).
   *
   * @since 1.1.3
   */
  conditions?: CalcdexPlayerSideConditions;

  isProtected?: boolean;
  isSeeded?: boolean;
  isFriendGuard?: boolean;
  isBattery?: boolean;
  isPowerSpot?: boolean;

  /**
   * Not used by the calc, but recorded for Pokemon stat calculations.
   *
   * @since 0.1.3
   */
  isFirePledge?: boolean;

  /**
   * Not used by the calc, but recorded for Pokemon stat calculations.
   *
   * @since 0.1.3
   */
  isGrassPledge?: boolean;

  /**
   * Not used by the calc, but recorded for Pokemon stat calculations.
   *
   * @since 0.1.3
   */
  isWaterPledge?: boolean;

  /**
   * Number of Pokemon with an activated *Beads of Ruin* ability.
   *
   * * Used to determine toggle state of `isBeadsOfRuin` in `State.Side`.
   *
   * @since 1.1.0
   */
  ruinBeadsCount?: number;

  /**
   * Number of Pokemon with an activated *Sword of Ruin* ability.
   *
   * * Used to determine the toggle state of `isSwordOfRuin` in `State.Side`.
   *
   * @since 1.1.0
   */
  ruinSwordCount?: number;

  /**
   * Number of Pokemon with an activated *Tablets of Ruin* ability.
   *
   * * Used to determine the toggle state of `isTabletsOfRuin` in `State.Side`.
   *
   * @since 1.1.0
   */
  ruinTabletsCount?: number;

  /**
   * Number of Pokemon with an activated *Vessel of Ruin* ability.
   *
   * * Used to determine the toggle state of `isVesselOfRuin` in `State.Side`.
   *
   * @since 1.1.0
   */
  ruinVesselCount?: number;
}
