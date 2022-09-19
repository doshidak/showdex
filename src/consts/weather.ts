import type { State as SmogonState } from '@smogon/calc';

/**
 * Legacy weather available since gen 2+.
 *
 * @since 1.0.2
 */
export const LegacyWeatherMap: Record<string, SmogonState.Field['weather']> = {
  raindance: 'Rain',
  sandstorm: 'Sand',
  sunnyday: 'Sun',
};

/**
 * Values of the `LegacyWeatherMap` object, sorted lexicographically (i.e., ABC order), for now.
 *
 * @since 1.0.2
 */
export const LegacyWeatherNames: SmogonState.Field['weather'][] = Object.values(LegacyWeatherMap).sort();

/**
 * Adapted from `weatherNameTable` in `src/battle-animations.ts` (line 920) of `smogon/pokemon-showdown-client`.
 *
 * @since 0.1.0
 */
export const WeatherMap: Record<string, SmogonState.Field['weather']> = {
  ...LegacyWeatherMap,
  deltastream: 'Strong Winds',
  desolateland: 'Harsh Sunshine',
  hail: 'Hail',
  primordialsea: 'Heavy Rain',
};

/**
 * Values of the `WeatherMap` object, sorted lexicographically (i.e., ABC order), for now.
 *
 * @since 0.1.1
 */
export const WeatherNames: SmogonState.Field['weather'][] = Object.values(WeatherMap).sort();

/**
 * Adapted from `updateWeather()` in `src/battle-animations.ts` (line 960) of `smogon/pokemon-showdown-client`.
 *
 * * Note that any mention of *pseudo-weather* is meant to be used interchangeably with *terrain*.
 *   - *Pseudo-weather* is the nomenclature used by Showdown.
 *   - *Terrain* is the nomenclature used by `@smogon/calc`.
 * * Since this is only meant to be used as part of a Showdown-calculator translation layer,
 *   this object is aptly named `PseudoWeatherMap` (rather than `TerrainMap`).
 *
 * @since 0.1.0
 */
export const PseudoWeatherMap: Record<string, SmogonState.Field['terrain']> = {
  electricterrain: 'Electric',
  grassyterrain: 'Grassy',
  mistyterrain: 'Misty',
  psychicterrain: 'Psychic',
};

/**
 * Values of the `PseudoWeatherMap` object, sorted in lexicographically ("ABC order"), for now.
 *
 * @since 0.1.1
 */
export const TerrainNames: SmogonState.Field['terrain'][] = Object.values(PseudoWeatherMap).sort();
