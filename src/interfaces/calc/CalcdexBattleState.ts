import { type GameType, type GenerationNum } from '@smogon/calc';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { type CalcdexBattleField } from './CalcdexBattleField';
import { type CalcdexBattleRules } from './CalcdexBattleRules';
import { type CalcdexPlayer } from './CalcdexPlayer';
import { type CalcdexPlayerKey } from './CalcdexPlayerKey';
import { type CalcdexPokemonPreset } from './CalcdexPokemonPreset';

/**
 * Rendering mode of the Calcdex.
 *
 * @since 1.0.3
 */
export type CalcdexRenderMode =
  | 'panel'
  | 'overlay';

/**
 * Primary state for a given single instance of the Calcdex.
 *
 * @since 0.1.0
 */
export interface CalcdexBattleState extends Partial<Record<CalcdexPlayerKey, CalcdexPlayer>> {
  /**
   * Battle ID.
   *
   * * Derived from `id` of the Showdown `battle` state.
   *
   * @example 'battle-gen8ubers-1636924535-utpp6tn0eya3q8q05kakyw3k4s97im9pw'
   * @since 0.1.0
   */
  battleId: string;

  /**
   * Last synced `nonce` of the Showdown `battle` state.
   *
   * @since 0.1.3
   */
  battleNonce?: string;

  /**
   * Generation number.
   *
   * * Derived from `gen` of the Showdown `battle` state.
   *
   * @example 8
   * @since 0.1.0
   */
  gen: GenerationNum;

  /**
   * Battle format.
   *
   * * Derived from splitting the `id` of the Showdown `battle` state.
   * * Note that this includes the `'gen#'` portion of the format.
   *
   * @example 'gen9vgc2023'
   * @since 0.1.0
   */
  format: string;

  /**
   * Battle sub-formats.
   *
   * @example
   * ```ts
   * [
   *   'regulatione',
   *   'bo3',
   * ]
   * ```
   * @since 1.1.7
   */
  subFormats?: string[];

  /**
   * Game type, whether `'Singles'` or `'Doubles'`.
   *
   * @default 'Singles'
   * @since 1.1.7
   */
  gameType: GameType;

  /**
   * Whether the gen uses legacy battle mechanics.
   *
   * * Determined via `detectLegacyGen()`.
   *
   * @since 1.1.1
   */
  legacy: boolean;

  /**
   * Rules (clauses) applied to the battle.
   *
   * @since 0.1.3
   */
  rules?: CalcdexBattleRules;

  /**
   * Current turn number, primarily recorded for debugging purposes.
   *
   * @default 0
   * @since 1.0.4
   */
  turn?: number;

  /**
   * Whether the battle is currently active (i.e., not ended).
   *
   * @default false
   * @since 1.0.3
   */
  active?: boolean;

  /**
   * Render mode of the Calcdex, determined from the settings during initialization.
   *
   * @since 1.0.3
   */
  renderMode?: CalcdexRenderMode;

  /**
   * Whether the overlay is open/visible.
   *
   * * Has no effect if `renderMode` is not `'overlay'`.
   *
   * @since 1.1.3
   */
  overlayVisible?: boolean;

  /**
   * Last recorded container size label.
   *
   * * Re-opened Calcdexes will initially render with this value instead of starting from `'xs'` again.
   *
   * @default 'xs'
   * @since 1.2.0
   */
  containerSize?: ElementSizeLabel;

  /**
   * Number of active players in the battle.
   *
   * @default 0
   * @since 1.1.3
   */
  playerCount: number;

  /**
   * Side key/ID of the player.
   *
   * * Does not necessarily mean the logged-in user ("auth") is a player.
   * * Check `authPlayerKey` instead to see if the logged-in user is also a player.
   *
   * @default null
   * @since 1.0.2
   */
  playerKey: CalcdexPlayerKey;

  /**
   * Side key/ID of the logged-in user who also happens to be a player.
   *
   * * Will be `null` if the logged-in user ("auth") is not a player.
   * * Primarily useful for changing parts of the UI if the auth user is a player.
   *   - For instance, in `FieldCalc`, the arrows in the screens header will change to "Yours" and "Theirs",
   *     depending on this value.
   *
   * @default null
   * @since 1.0.2
   */
  authPlayerKey?: CalcdexPlayerKey;

  /**
   * Side key/ID of the opponent.
   *
   * * Typically the opposite of the `playerKey`.
   *   - For example, if the `playerKey` is `'p1'`, then you can expect this value to be `'p2'`.
   * * Note that the opposite wouldn't be the case if you were to support more than just 2 players.
   *   - Technically, the client does support up to 4 players (there exists a `'p3'` and `'p4'`).
   *
   * @default null
   * @since 1.0.2
   */
  opponentKey: CalcdexPlayerKey;

  /**
   * Whether to switch the players in the Calcdex.
   *
   * * Populated directly from `sidesSwitched` of the `battle`.
   * * Does not change the population behavior of `playerKey` and `opponentKey`, just how they're rendered.
   *   - Specifically, this dictates the `topKey` and `bottomKey` in the Calcdex.
   *
   * @default false
   * @since 1.1.3
   */
  switchPlayers?: boolean;

  /**
   * Tracked field conditions.
   *
   * @since 0.1.0
   */
  field: CalcdexBattleField;

  /**
   * Hash of all the relevant `stepQueue`s used to derive `sheets`.
   *
   * * Primarily used to determine if we should repopulate the `sheets`.
   *   - Could happen if another player suddenly reveals their team mid-battle.
   *   - For this reason, we don't optimize the population of `sheets` to once per battle.
   * * Hash is generated by `calcCalcdexId()` by joining all relevant `stepQueue`s into a `string`, deliminated by a
   *   semi-colon (i.e., `;`), in `syncBattle()`.
   *   - In other words, this hash is a namespaced UUID.
   *
   * @default null
   * @since 1.1.3
   */
  sheetsNonce: string;

  /**
   * Converted presets derived from team sheets posted in the battle.
   *
   * * These are unique to each battle and are populated from the relevant `stepQueue`s in `syncBattle()`.
   * * Will only be populated if the `autoImportTeamSheet` Calcdex setting is enabled, team sheets are available, and
   *   the generated `sheetsNonce` doesn't match the previously stored value, if any.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.3
   */
  sheets: CalcdexPokemonPreset[];
}
