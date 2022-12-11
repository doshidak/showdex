import { PseudoWeatherMap, WeatherMap } from '@showdex/consts/field';
import { formatId } from '@showdex/utils/app';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexBattleField, CalcdexBattleState } from '@showdex/redux/store';
import { sanitizePlayerSide } from './sanitizePlayerSide';

/**
 * Reads properties from the `battle` to construct a new `CalcdexBattleField`,
 * which is a lot less cooler than it sounds lol.
 *
 * * All arguments are optional since the idea is that you can obtain an initial `CalcdexBattleField`
 *   as part of the Calcdex state initializer routine in Redux.
 *   - Values of most properties will be falsy in some way (e.g., `false`, `null`).
 * * By default, both player sides will be processed (otherwise `null` if no arguments were provided).
 * * Specifying `true` for `ignoreP1Side` and/or `ignoreP2Side` won't return an object containing
 *   their corresponding field properties (i.e., `attackerSide` and `defenderSide`, respectively).
 *   - This is useful if the resulting object is spread onto an existing object.
 *   - Should the `attackerSide` and/or `defenderSide` exist, due to their default `null` value,
 *     the existing values would be replaced with `null`!
 *   - Alternatively, you could just destructure the keys you need.
 *
 * @since 0.1.0
 */
export const sanitizeField = (
  battle?: Partial<Showdown.Battle>,
  state?: Partial<CalcdexBattleState>,
  ignoreP1Side?: boolean,
  ignoreP2Side?: boolean,
): CalcdexBattleField => {
  const {
    gen: genFromBattle,
    gameType,
    p1: battleP1,
    p2: battleP2,
    pseudoWeather,
    weather,
  } = battle || {};

  const {
    gen: genFromState,
    p1: stateP1,
    p2: stateP2,
  } = state || {};

  const gen = genFromState || <GenerationNum> genFromBattle;

  const pseudoWeatherMoveNames = pseudoWeather
    ?.map((weatherState) => formatId(weatherState?.[0]))
    .filter(Boolean)
    ?? [];

  // standardize all terrain names (aka. pseudo-weather),
  // especially `electricterrain`, which exists in the game state as 'Electric Terrain'
  // (but all others are already lowercased w/ no spaces, such as 'mistyterrain')
  const [pseudoWeatherName] = pseudoWeatherMoveNames;

  const sanitizedField: CalcdexBattleField = {
    gameType: gameType === 'doubles' ? 'Doubles' : 'Singles',

    weather: WeatherMap[weather] ?? null,
    terrain: PseudoWeatherMap[pseudoWeatherName] ?? null,

    isMagicRoom: pseudoWeatherMoveNames.includes('magicroom'),
    isWonderRoom: pseudoWeatherMoveNames.includes('wonderroom'),
    isGravity: pseudoWeatherMoveNames.includes('gravity'),

    attackerSide: !ignoreP1Side
      ? sanitizePlayerSide(gen, battleP1, stateP1)
      : null,

    defenderSide: !ignoreP2Side
      ? sanitizePlayerSide(gen, battleP2, stateP2)
      : null,
  };

  // in case this is spread with an existing field,
  // we don't want to overwrite the existing side if falsy
  if (!sanitizedField.attackerSide) {
    delete sanitizedField.attackerSide;
  }

  if (!sanitizedField.defenderSide) {
    delete sanitizedField.defenderSide;
  }

  return sanitizedField;
};
