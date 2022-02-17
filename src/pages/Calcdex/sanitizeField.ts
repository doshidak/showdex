import type { CalcdexBattleField } from './CalcdexReducer';
import { sanitizePlayerSide } from './sanitizePlayerSide';

/**
 * Adapted from `weatherNameTable` in `src/battle-animations.ts` (line 920) of `smogon/pokemon-showdown-client`.
 */
const weatherMoveDict: Record<string, CalcdexBattleField['weather']> = {
  deltastream: 'Strong Winds',
  desolateland: 'Harsh Sunshine',
  hail: 'Hail',
  primordialsea: 'Heavy Rain',
  raindance: 'Rain',
  sandstorm: 'Sand',
  sunnyday: 'Sun',
};

/**
 * Adapted from `updateWeather()` in `src/battle-animations.ts` (line 960) of `smogon/pokemon-showdown-client`.
 */
const pseudoWeatherMoveDict: Record<string, CalcdexBattleField['terrain']> = {
  electricterrain: 'Electric',
  grassyterrain: 'Grassy',
  mistyterrain: 'Misty',
  psychicterrain: 'Psychic',
};

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

  const pseudoWeatherName = pseudoWeatherMoveNames?.[0];

  return {
    gameType: gameType === 'doubles' ? 'Doubles' : 'Singles',
    weather: weatherMoveDict?.[weather] ?? null,
    terrain: pseudoWeatherName ? pseudoWeatherMoveDict?.[pseudoWeatherName] : null,
    isGravity: pseudoWeatherMoveNames?.includes?.('Gravity') ?? false,
    attackerSide: sanitizePlayerSide(p1, attackerIndex),
    defenderSide: sanitizePlayerSide(p2, defenderIndex),
  };
};
