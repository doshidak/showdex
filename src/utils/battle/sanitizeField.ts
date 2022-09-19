import { PseudoWeatherMap, WeatherMap } from '@showdex/consts';
import type { GenerationNum } from '@pkmn/data';
import type { CalcdexBattleField } from '@showdex/redux/store';
import { sanitizePlayerSide } from './sanitizePlayerSide';

export const sanitizeField = (
  battle: Partial<Showdown.Battle>,
  attackerIndex = 0,
  defenderIndex = 0,
): CalcdexBattleField => {
  const {
    gen,
    gameType,
    p1,
    p2,
    pseudoWeather,
    weather,
  } = battle || {};

  const pseudoWeatherMoveNames = pseudoWeather
    ?.map?.((weatherState) => weatherState?.[0])
    .filter(Boolean);

  // standardize all terrain names (aka. pseudo-weather),
  // especially `electricterrain`, which exists in the game state as 'Electric Terrain'
  // (but all others are already lowercased w/ no spaces, such as 'mistyterrain')
  const pseudoWeatherName = pseudoWeatherMoveNames?.[0]
    ?.toLowerCase?.()
    .replace(/[^a-z]/g, '');

  const sanitizedField: CalcdexBattleField = {
    gameType: gameType === 'doubles' ? 'Doubles' : 'Singles',

    weather: WeatherMap?.[weather] ?? null,
    terrain: pseudoWeatherName ? PseudoWeatherMap?.[pseudoWeatherName] : null,

    isMagicRoom: pseudoWeatherMoveNames?.includes?.('Magic Room') ?? false,
    isWonderRoom: pseudoWeatherMoveNames?.includes?.('Wonder Room') ?? false,
    isGravity: pseudoWeatherMoveNames?.includes?.('Gravity') ?? false,

    // we can deliberately prevent a side from being sanitized by passing in -1 as its index
    // (otherwise, the indices will fallback to its default value of 0)
    attackerSide: attackerIndex > -1
      ? sanitizePlayerSide(<GenerationNum> gen, p1, attackerIndex)
      : null,

    defenderSide: defenderIndex > -1
      ? sanitizePlayerSide(<GenerationNum> gen, p2, defenderIndex)
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
