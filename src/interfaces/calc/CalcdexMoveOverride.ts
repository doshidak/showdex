/**
 * Move overrides set by the user.
 *
 * * Any property not defined here should default to the move's default value.
 * * Should be the value of an object, where the key is the move name itself.
 *   - Hence why the move name is not specified here.
 * * As of v1.2.0, the `stellar` property bypasses the one-time type-based activation of the Stellar STAB mechanic.
 *   - Won't have any effect if the Pokemon doesn't have a `teraType` of `'Stellar'` or isn't currently Terastallized.
 * * As of v1.2.4, `hitBasePowers[]` allows fine-tuned control of each hit's base powers of *any* applicable multi-hitting
 *   move (determined by `move.hits > 1`), such as *Triple Axel*, *Triple Kick* & even *Icicle Spear*!
 *   - If unspecified or value at that hit's index is nullish (i.e., `null` / `undefined`), the hit's base power will
 *     fallback to the instantiated `SmogonMove`'s `bp` value.
 *
 * @important When adding new props, especially those of more complex types like objects & arrays, make sure you update
 *   `hasMoveOverrides()` to account for the new prop values (otherwise their object references will never equal!).
 * @since 1.0.6
 */
export interface CalcdexMoveOverride {
  type?: Showdown.TypeName;
  category?: Showdown.MoveCategory;
  basePower?: number;
  zBasePower?: number;
  maxBasePower?: number;
  hitBasePowers?: number[];
  hits?: number;
  minHits?: number;
  maxHits?: number;
  alwaysCriticalHits?: boolean;
  stellar?: boolean;
  offensiveStat?: Showdown.StatNameNoHp;
  defensiveStat?: Showdown.StatNameNoHp;
}
