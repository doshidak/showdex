/**
 * Move overrides set by the user.
 *
 * * Any property not defined here should default to the move's default value.
 * * Should be the value of an object, where the key is the move name itself.
 *   - Hence why the move name is not specified here.
 * * As of v1.2.0, the `stellar` property bypasses the one-time type-based activation of the Stellar STAB mechanic.
 *   - Won't have any effect if the Pokemon doesn't have a `teraType` of `'Stellar'` or isn't currently Terastallized.
 *
 * @since 1.0.6
 */
export interface CalcdexMoveOverride {
  type?: Showdown.TypeName;
  category?: Showdown.MoveCategory;
  basePower?: number;
  zBasePower?: number;
  maxBasePower?: number;
  hits?: number;
  minHits?: number;
  maxHits?: number;
  alwaysCriticalHits?: boolean;
  stellar?: boolean;
  offensiveStat?: Showdown.StatNameNoHp;
  defensiveStat?: Showdown.StatNameNoHp;
}
