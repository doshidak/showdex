import { PseudoWeatherMap, WeatherMap } from '@showdex/consts';
import type { CalcdexBattleField } from '@showdex/redux/store';
import { sanitizePlayerSide } from './sanitizePlayerSide';

export const sanitizeField = (
  battle: Partial<Showdown.Battle>,
  attackerIndex = 0,
  defenderIndex = 0,
): CalcdexBattleField => {
  const {
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

  return {
    gameType: gameType === 'doubles' ? 'Doubles' : 'Singles',

    weather: WeatherMap?.[weather] ?? null,
    terrain: pseudoWeatherName ? PseudoWeatherMap?.[pseudoWeatherName] : null,

    isMagicRoom: pseudoWeatherMoveNames?.includes?.('Magic Room') ?? false,
    isWonderRoom: pseudoWeatherMoveNames?.includes?.('Wonder Room') ?? false,
    isGravity: pseudoWeatherMoveNames?.includes?.('Gravity') ?? false,

    attackerSide: sanitizePlayerSide(p1, attackerIndex),
    defenderSide: sanitizePlayerSide(p2, defenderIndex),
  };
};
