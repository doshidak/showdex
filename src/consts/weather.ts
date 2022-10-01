import type { State as SmogonState } from '@smogon/calc';

/**
 * Description of a field condition.
 *
 * @since 1.0.3
 */
export interface FieldConditionDescription {
  /**
   * Short description of the weather/terrain.
   *
   * @example '5 turns (8 w/ Damp Rock), +Water (×1.5), -Fire (×0.5).'
   * @since 1.0.3
   */
  shortDesc: string;

  /**
   * Full description of the weather/terrain.
   *
   * * Made partial in case we don't want to include the description in the bundle,
   *   especially if it's not actually being used.
   *
   * @example 'For 5 turns, the weather becomes Rain Dance. ... Fails if the current weather is Rain Dance.'
   * @since 1.0.3
   */
  desc?: string;
}

/**
 * Internally-used HTML `&times;` entity, represented as `U+00D7`.
 *
 * @since 1.0.3
 */
const times = '\u00D7';

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
  hail: 'Hail',
  deltastream: 'Strong Winds',
  desolateland: 'Harsh Sunshine',
  primordialsea: 'Heavy Rain',
};

/**
 * Values of the `WeatherMap` object, sorted lexicographically (i.e., ABC order), for now.
 *
 * @since 0.1.1
 */
export const WeatherNames: SmogonState.Field['weather'][] = Object.values(WeatherMap).sort();

/**
 * Weather descriptions.
 *
 * @see https://smogon.com/dex/ss
 * @since 1.0.3
 */
export const WeatherDescriptions: Record<SmogonState.Field['weather'], FieldConditionDescription> = {
  Rain: {
    shortDesc: `5 turns (8 w/ Damp Rock), +Water (${times}1.5), -Fire (${times}0.5).`,
    // desc: 'For 5 turns, the weather becomes Rain Dance. '
    //   + 'The damage of Water-type attacks is multiplied by 1,5 and '
    //   + 'the damage of Fire-type attacks is multiplied by 0.5 during the effect. '
    //   + 'Lasts for 8 turns if the user is holding Damp Rock. '
    //   + 'Fails if the current weather is Rain Dance.',
  },

  Sand: {
    shortDesc: '5 turns (8 w/ Smooth Rock), '
      + `+SPD (${times}1.5, Rock-types only), `
      + '-1/16 max HP (floored, non-Ground/Rock/Steel, non-Magic Guard/Overcoat/Sand Force/Sand Rush/Sand Veil).',
    // desc: 'For 5 turns, the weather becomes Sandstorm. '
    //   + 'At the end of each turn except the last, all active Pokemon lose 1/16 of their maximum HP, rounded down, '
    //   + 'unless they are a Ground, Rock, or Steel type, or '
    //   + 'have the Magic Guard, Overcoat, Sand Force, Sand Rush, or Sand Veil abilities. '
    //   + 'During the effect, the Special Defense of Rock-type Pokemon is multiplied by 1.5 '
    //   + 'when taking damage from a special attack. '
    //   + 'Lasts for 8 turns if the user is holding Smooth Rock. '
    //   + 'Fails if the current weather is Sandstorm.',
  },

  Sun: {
    shortDesc: `5 turns (8 w/ Heat Rock), +Fire (${times}1.5), -Water (${times}0.5).`,
    // desc: 'For 5 turns, the weather becomes Sunny Day. '
    //   + 'The damage of Fire-type attacks is multiplied by 1.5 and '
    //   + 'the damage of Water-type attacks is multiplied by 0.5 during the effect. '
    //   + 'Lasts for 8 turns if the user is holding Heat Rock. '
    //   + 'Fails if the current weather is Sunny Day.',
  },

  Hail: {
    shortDesc: '5 turns (8 w/ Icy Rock), '
      + '-1/16 max HP (floored, non-Ice, non-Ice Body/Magic Guard/Overcoat/Snow Cloak).',
    // desc: 'For 5 turns, the weather becomes Hail. '
    //   + 'At the end of each turn except the last, '
    //   + 'all active Pokemon lose 1/16 of their maximum HP, rounded down, '
    //   + 'unless they are an Ice type or '
    //   + 'have the Ice Body, Magic Guard, Overcoat, or Snow Cloak abilities. '
    //   + 'Lasts for 8 turns if the user is holding Icy Rock. '
    //   + 'Fails if the current weather is Hail.',
  },

  'Strong Winds': {
    shortDesc: 'Until switch-out, no Flying weaknesses.',
    // desc: 'On switch-in, the weather becomes Delta Stream, '
    //   + 'which removes the weaknesses of the Flying type from Flying-type Pokemon. '
    //   + 'This weather remains in effect until this ability is no longer active for any Pokemon, or '
    //   + 'the weather is changed by the Desolate land or Primordial Sea abilities.',
  },

  'Harsh Sunshine': {
    // "no Water" is not entirely true here, since it only applies if "Harsh Sunshine" here actually refers to
    // "Extremely Harsh Sunlight" (via Primal Groudon) -- assuming that's the case here tho
    // (otherwise, the normal 50% BP reduction of Water-type moves from Sunny Day applies)
    // also note that "Extremely Harsh Sunlight" should technically prevent Air Lock and Cloud Nine
    // (abilities that negate weather effects) from deactivating the "no Water" effect
    shortDesc: `Until switch-out, +Fire (${times}1.5), no Water (${times}0, non-Air Lock/Cloud Nine).`,
    // desc: 'On switch-in, the weather becomes Desoland Land, '
    //   + 'which includes all the effects of Sunny Day and '
    //   + 'prevents damaging Water-type moves from executing. '
    //   + 'This weather remains in effect until this ability is no longer active for any Pokemon, or '
    //   + 'the weather is changed by the Delta Stream or Primordial Sea abilities.',
  },

  'Heavy Rain': {
    // as you can probably guess, this is the signature ability of Primal Kyogre
    shortDesc: `Until switch-out, +Water (${times}1.5), no Fire (${times}0, non-Air Lock/Cloud Nine).`,
    // desc: 'On switch-in, the weather becomes Primordial Sea, '
    //   + 'which includes all the effects of Rain Dance and '
    //   + 'prevents damaging Fire-type moves from executing. '
    //   + 'This weather remains in effect until this ability is no longer active for any Pokemon, or '
    //   + 'this weather is changed by the Delta Stream or Desolate Land abilites.',
  },
};

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

/**
 * Terrain descriptions.
 *
 * @see https://smogon.com/dex/ss
 * @since 1.0.3
 */
export const TerrainDescriptions: Record<SmogonState.Field['terrain'], FieldConditionDescription> = {
  Electric: {
    shortDesc: `5 turns, +Electric (${times}1.3, grounded), can't sleep.`,
    // desc: 'For 5 turns, the terrain becomes Electric Terrain. '
    //   + 'During the effect, the power of Electric-type attacks made by grounded Pokemon is multiplied by 1.3 and '
    //   + 'grounded Pokemon cannot fall asleep; '
    //   + 'Pokemon already asleep do not wake up. '
    //   + 'Grounded Pokemon cannot become affected by Yawn or fall asleep from its effect. '
    //   + 'Camouflage transforms the user into an Electric type, '
    //   + 'Nature Power becomes Thunderbolt, and '
    //   + 'Secret Power has a 30% chance to cause paralysis. '
    //   + 'Fails if the current terrain is Electric Terrain.',
  },

  Grassy: {
    shortDesc: `5 turns, +Grass (${times}1.3, grounded), -Bulldoze/Earthquake/Magnitude (${times}0.5), +1/16 max HP (floored).`,
    // desc: 'For 5 turns, the terrain becomes Grassy Terrain. '
    //   + 'During the effect, the power of Grass-type attacks used by grounded Pokemon is multiplied by 1.3, '
    //   + 'the power of Bulldoze, Earthquake, and Magnitude used against grounded Pokemon is multiplied by 0.5, and '
    //   + 'grounded Pokemon have 1/16 of their maximum HP, rounded down, restored at the end of each turn, '
    //   + 'including the last turn. '
    //   + 'Camouflage transforms the user into a Grass Type, '
    //   + 'Nature Power becomes Energy Ball, and '
    //   + 'Secret Power has a 30% chance to cause sleep. '
    //   + 'Fails if the current terrain is Grassy Terrain.',
  },

  Misty: {
    shortDesc: `5 turns, -Dragon (${times}0.5, grounded), can't status.`,
    // desc: 'For 5 turns, the terrain becomes Misty Terrain. '
    //   + 'During the effect, the power of Dragon-type attacks used against grounded Pokemon is multiplied by 0.5 and '
    //   + 'grounded Pokemon cannot be inflicted with a non-volatile status condition nor confusion. '
    //   + 'Grounded Pokemon can become affected by Yawn but cannot fall alseep from its effect. '
    //   + 'Camouflage transforms the user into a Fairy type, '
    //   + 'Nature Power becomes Moonblast, and '
    //   + 'Secret Power has a 30% chance to lower Special Attack by 1 stage. '
    //   + 'Fails if the current terrain is Misty Terrain.',
  },

  Psychic: {
    shortDesc: `5 turns, +Psychic (${times}1.3, grounded), no priority.`,
    // desc: 'For 5 turns, the terrain becomes Psychic Terrain. '
    //   + 'During the effect, the power of Psychic-type attacks made by grounded Pokemon is multiplied by 1.3 and '
    //   + 'grounded Pokemon cannot be hit by moves with priority greater than 0, unless the target is an ally. '
    //   + 'Camouflage transforms the user into a Psychic type, '
    //   + 'Nature Power becomes Psychic, and '
    //   + "Secret Power has a 30% chance to lower the target's Speed by 1 stage. "
    //   + 'Fails if the current terrain is Psychic Terrain.',
  },
};
