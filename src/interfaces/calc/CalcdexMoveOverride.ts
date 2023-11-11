/**
 * Move overrides set by the user.
 *
 * * Any property not defined here should default to the move's default value.
 * * Should be the value of an object, where the key is the move name itself.
 *   - Hence why the move name is not specified here.
 *
 * @since 1.0.6
 */
export interface CalcdexMoveOverride {
  type?: Showdown.TypeName;
  category?: Showdown.MoveCategory;
  basePower?: number;
  zBasePower?: number;
  maxBasePower?: number;
  alwaysCriticalHits?: boolean;
  offensiveStat?: Showdown.StatNameNoHp;
  defensiveStat?: Showdown.StatNameNoHp;
}
