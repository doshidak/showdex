import { type AbilityName, type ItemName } from '@smogon/calc';
import { type CalcdexPlayerKey } from './CalcdexPlayerKey';

/**
 * Individual ability/item's stage-boosting effect that's currently in effect by affecting the applied stage boosts.
 *
 * * This is the value of each entry in a `CalcdexAutoBoostMap`, where the keys are the `name` properties.
 * * Defaults are defined in `determineAutoBoostEffect()` from `@showdex/utils/battle`.
 *
 * @since 1.2.3
 */
export interface CalcdexAutoBoostEffect {
  /**
   * Effect's name.
   *
   * @example 'Intimidate'
   * @since 1.2.3
   */
  name: AbilityName | ItemName;

  /**
   * Stage boosts applied by this effect.
   *
   * * Boosts can be `0`, indicating it was negated or nullified (e.g., *Intimidate* blocked by *Clear Body*).
   *   - Effects with no-op boosts are still valid as they may be used to track if they were previously applied.
   *
   * @example
   * ```ts
   * {
   *   atk: 1,
   * }
   * ```
   * @since 1.2.3
   */
  boosts: Showdown.StatsTableNoHp;

  /**
   * `Showdown.ModdedDex` key to lookup more information on the effect, accessible by its key in `CalcdexAutoBoostMap`.
   *
   * * Also used to access the corresponding translation, if any.
   *
   * @example 'abilities'
   * @default null
   * @since 1.2.3
   */
  dict?: Extract<keyof Showdown.ModdedDex, 'abilities' | 'items' | 'moves'>;

  /**
   * Optional player key of the Pokemon that invoked this effect.
   *
   * * If falsy (default), the player key of the current Pokemon will be assumed.
   *
   * @example 'p2'
   * @default null
   * @since 1.2.3
   */
  sourceKey?: CalcdexPlayerKey;

  /**
   * Optional `calcdexId` of the Pokemon that invoked this effect.
   *
   * * If falsy (default), the `calcdexId` of the current Pokemon will be assumed.
   *
   * @example 'ae65f089-25f8-4fdd-85dA-64efaa0c097f'
   * @default null
   * @since 1.2.3
   */
  sourcePid?: string;

  /**
   * Name of a trigged effect from the current Pokemon, if any, as a result of this effect being applied.
   *
   * @example 'Contrary'
   * @default null
   * @since 1.2.3
   */
  reffect?: string;

  /**
   * `Showdown.ModdedDex` key to lookup more information on `reffect`.
   *
   * * Also used to access the corresponding translation, if any.
   *
   * @example 'abilities'
   * @default null
   * @since 1.2.3
   */
  reffectDict?: Extract<keyof Showdown.ModdedDex, 'abilities' | 'items' | 'moves'>;

  /**
   * Turn number that the effect was successfully applied.
   *
   * * Non-`null`/`undefined` values also indicate that the `boosts` are client-reported, so they're expected to be
   *   applied to the Pokemon's corresponding `boosts`.
   *   - Any negative values like `-1` are also considered to be a `null`/`undefined` value.
   *   - Positive values, including `0`, are valid.
   * * If `null`/`undefined` (default), this indicates that the effect was applied from an action invoked by the user.
   *   - `boosts`, in this case, would be expected to be in the Pokemon's `dirtyBoosts` instead.
   *
   * @default null
   * @since 1.2.3
   */
  turn?: number;

  /**
   * Whether this effect applies only once per battle.
   *
   * * Typical in gen 9 for some abilities, such as *Intrepid Sword*.
   * * Has no effect if `turn` is `null`/`undefined` (default).
   *
   * @default false
   * @since 1.2.3
   */
  once?: boolean;

  /**
   * Whether the `boosts` currently being applied to the respective boosts object are dependent on the falsiness of `turn`.
   *
   * * Typically used in conjunction with `turn` & `once` to determine if this effect should be used as an indicator
   *   to not auto-boost this effect again for the remainder of the battle.
   *
   * @default false
   * @since 1.2.3
   */
  active?: boolean;
}

/**
 * Mapping of abilities & items whose stage-boosting effects are currently being auto-applied, whether reported by the
 * battle or manually invoked by the user.
 *
 * @since 1.2.3
 */
export type CalcdexAutoBoostMap = Record<AbilityName | ItemName, CalcdexAutoBoostEffect>;
