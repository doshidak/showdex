import { type State as SmogonState, type Terrain, type Weather } from '@smogon/calc';
import { type CalcdexPlayerSide } from './CalcdexPlayerSide';

/**
 * Think someone at `@smogon/calc` forgot to include these additional field conditions
 * in the `State.Field` (but it exists in the `Field` class... huh).
 *
 * * For whatever reason, `isGravity` exists on both `State.Field` and `Field`.
 * * Checking the source code for the `Field` class (see link below),
 *   the constructor accepts these missing properties.
 * * As of v1.1.7, the `gameType` property has been moved up to the `CalcdexBattleState`.
 *
 * @see https://github.com/smogon/damage-calc/blob/master/calc/src/field.ts#L21-L26
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
   * User-modified weather.
   *
   * * Similar to `dirtyItem` in `CalcdexPokemon`, this value can be an empty string (i.e., `''`) in order to explicitly
   *   turn off the weather when there's a battle-synced `weather` already.
   *
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
   * User-modified terrain.
   *
   * * Similar to `dirtyItem` in `CalcdexPokemon`, this value can be an empty string (i.e., `''`) in order to explicitly
   *   turn off the terrain when there's a battle-synced `terrain` already.
   *
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
