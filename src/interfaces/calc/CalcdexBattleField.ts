import { type State as SmogonState, type Terrain, type Weather } from '@smogon/calc';
import { type CalcdexPlayerSide } from './CalcdexPlayerSide';

/**
 * Calcdex-tracked player-wide field conditions.
 *
 * * As of v1.1.7, the `gameType` property has been moved up to the `CalcdexBattleState`.
 *
 * @since 0.1.3
 */
export interface CalcdexBattleField extends Omit<SmogonState.Field, 'gameType'> {
  /**
   * Battle-reported weather.
   *
   * @example 'Rain'
   * @since 0.1.3
   */
  weather?: Weather;

  /**
   * Auto-determined weather.
   *
   * * Typically populated by `determineWeather()` from `@showdex/utils/dex`.
   *
   * @since 1.2.3
   */
  autoWeather?: Weather;

  /**
   * User-modified weather.
   *
   * * Similar to `dirtyItem` in `CalcdexPokemon`, this value can be an empty string (i.e., `''`) in order to explicitly
   *   turn off the weather when there's a battle-synced `weather` already.
   *
   * @example
   * ```ts
   * const field: CalcdexBattleField = { ... };
   * const weather = (field.dirtyWeather ?? (field.autoWeather || field.weather)) || null;
   * ```
   * @since 1.2.3
   */
  dirtyWeather?: Weather;

  /**
   * Battle-reported terrain.
   *
   * @example 'Misty'
   * @since 0.1.3
   */
  terrain?: Terrain;

  /**
   * Auto-determined terrain.
   *
   * * Typically populated by `determineTerrain()` from `@showdex/utils/dex`.
   *
   * @since 1.2.3
   */
  autoTerrain?: Terrain;

  /**
   * User-modified terrain.
   *
   * * Similar to `dirtyItem` in `CalcdexPokemon`, this value can be an empty string (i.e., `''`) in order to explicitly
   *   turn off the terrain when there's a battle-synced `terrain` already.
   *
   * @example
   * ```ts
   * const field: CalcdexBattleField = { ... };
   * const terrain = (field.dirtyTerrain ?? (field.autoTerrain || field.terrain)) || null;
   * ```
   * @since 1.2.3
   */
  dirtyTerrain?: Terrain;

  /**
   * Field conditions on the attacking player's side.
   *
   * * Should be grabbed from the attacking `CalcdexPlayer`'s `side` and set to this value when instatiating the
   *   `Smogon.Field` in `createSmogonField()`.
   *
   * @warning As of v1.1.3, these are attached to each individual `CalcdexPlayer` (via `CalcdexPlayerSide`) &
   *   dynamically assigned during damage calculation. In other words, do **not** store a player's `side` here!
   * @since 0.1.3
   */
  attackerSide: CalcdexPlayerSide;

  /**
   * Field conditions on the defending player's side.
   *
   * * Should be grabbed from the defending `CalcdexPlayer`'s `side` and set to this value when instatiating the
   *   `Smogon.Field` in `createSmogonField()`.
   *
   * @warning As of v1.1.3, these are attached to each individual `CalcdexPlayer` (via `CalcdexPlayerSide`) &
   *   dynamically assigned during damage calculation. In other words, do **not** store a player's `side` here!
   * @since 0.1.3
   */
  defenderSide: CalcdexPlayerSide;
}
