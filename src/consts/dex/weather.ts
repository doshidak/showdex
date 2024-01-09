import { type Weather } from '@smogon/calc';
import { times } from '@showdex/consts/core';

/**
 * Description of a field condition.
 *
 * @since 1.0.3
 */
export interface FieldConditionDescription {
  /**
   * Label of the weather/terrain, primarily for use in the `FieldCalc` weather dropdown.
   *
   * @example 'Rain'
   * @since 1.0.4
   */
  label?: string;

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
 * Legacy weather available since gen 2+.
 *
 * @since 1.0.2
 */
export const LegacyWeatherMap: Record<string, Weather> = {
  raindance: 'Rain',
  sandstorm: 'Sand',
  sunnyday: 'Sun',
};

/**
 * Values of the `LegacyWeatherMap` object, sorted ~~lexicographically~~ by commonality.
 *
 * @note As of v1.0.4, this is no longer sorted lexicographically.
 * @since 1.0.2
 */
export const LegacyWeatherNames: Weather[] = [
  'Rain',
  'Sand',
  'Sun',
];

/**
 * Adapted from `weatherNameTable` in `src/battle-animations.ts` (line 920) of `smogon/pokemon-showdown-client`.
 *
 * @since 0.1.0
 */
export const WeatherMap: Record<string, Weather> = {
  ...LegacyWeatherMap,
  hail: 'Hail',
  snow: 'Snow',
  deltastream: 'Strong Winds',
  desolateland: 'Harsh Sunshine',
  primordialsea: 'Heavy Rain',
};

/**
 * Values of the `WeatherMap` object, sorted ~~lexicographically~~ by commonality.
 *
 * @note As of v1.0.4, this is no longer sorted lexicographically.
 * @since 0.1.1
 */
export const WeatherNames: Weather[] = [
  ...LegacyWeatherNames,
  'Hail', // only available in gens 3-8
  'Snow', // replaces Hail in gens 9+
  'Heavy Rain',
  'Harsh Sunshine',
  'Strong Winds',
];

/**
 * Weather descriptions.
 *
 * @note `desc` properties are commented out atm to not include them in the bundle.
 * @see https://smogon.com/dex/ss
 * @deprecated As of v1.2.1, these are stored in translation strings in `@showdex/assets/i18n`.
 * @since 1.0.3
 */
export const WeatherDescriptions: Record<Weather, FieldConditionDescription> = {
  Rain: {
    label: 'Rain',
    shortDesc: `For 5 turns (8 w/ Damp Rock), Water 1.5${times}, Fire 0.5${times}.`,
    // desc: 'For 5 turns, the weather becomes Rain Dance. '
    //   + 'The damage of Water-type attacks is multiplied by 1,5 and '
    //   + 'the damage of Fire-type attacks is multiplied by 0.5 during the effect. '
    //   + 'Lasts for 8 turns if the user is holding Damp Rock. '
    //   + 'Fails if the current weather is Rain Dance.',
  },

  Sand: {
    // label: 'Sandstorm',
    label: 'Sand',
    shortDesc: 'For 5 turns (8 w/ Smooth Rock), '
      + `SPD 1.5${times} (Rock only), `
      + '-6% HP (floored, non-Ground/Rock/Steel, non-Magic Guard/Overcoat/Sand Force/Sand Rush/Sand Veil).',
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
    label: 'Sun',
    shortDesc: `For 5 turns (8 w/ Heat Rock), Fire 1.5${times}, Water 0.5${times}.`,
    // desc: 'For 5 turns, the weather becomes Sunny Day. '
    //   + 'The damage of Fire-type attacks is multiplied by 1.5 and '
    //   + 'the damage of Water-type attacks is multiplied by 0.5 during the effect. '
    //   + 'Lasts for 8 turns if the user is holding Heat Rock. '
    //   + 'Fails if the current weather is Sunny Day.',
  },

  Hail: {
    label: 'Hail',
    shortDesc: 'For 5 turns (8 w/ Icy Rock), '
      + '-6% HP (floored, non-Ice, non-Ice Body/Magic Guard/Overcoat/Snow Cloak).',
    // desc: 'For 5 turns, the weather becomes Hail. '
    //   + 'At the end of each turn except the last, '
    //   + 'all active Pokemon lose 1/16 of their maximum HP, rounded down, '
    //   + 'unless they are an Ice type or '
    //   + 'have the Ice Body, Magic Guard, Overcoat, or Snow Cloak abilities. '
    //   + 'Lasts for 8 turns if the user is holding Icy Rock. '
    //   + 'Fails if the current weather is Hail.',
  },

  Snow: {
    label: 'Snow',
    shortDesc: `For 5 turns (8 w/ Icy Rock), DEF 1.5${times} (Ice only).`,
    // desc: 'For 5 turns, the weather becomes Snow. '
    //   + 'During the effect, the Defense of Ice-type Pokemon is multiplied by 1.5 '
    //   + 'when taking damage from a physical attack. '
    //   + 'Lasts for 8 turns if the user is holding Icy Rock. '
    //   + 'Fails if the current weather is Snow.',
  },

  'Harsh Sunshine': {
    label: 'Intense Sun',
    // "no Water" is not entirely true here, since it only applies if "Harsh Sunshine" here actually refers to
    // "Extremely Harsh Sunlight" (via Primal Groudon) -- assuming that's the case here tho
    // (otherwise, the normal 50% BP reduction of Water-type moves from Sunny Day applies)
    // also note that "Extremely Harsh Sunlight" should technically prevent Air Lock and Cloud Nine
    // (abilities that negate weather effects) from deactivating the "no Water" effect
    shortDesc: `Until switch-out, Fire 1.5${times}, Water 0${times} (non-Air Lock/Cloud Nine).`,
    // desc: 'On switch-in, the weather becomes Desoland Land, '
    //   + 'which includes all the effects of Sunny Day and '
    //   + 'prevents damaging Water-type moves from executing. '
    //   + 'This weather remains in effect until this ability is no longer active for any Pokemon, or '
    //   + 'the weather is changed by the Delta Stream or Primordial Sea abilities.',
  },

  'Heavy Rain': {
    label: 'Heavy Rain',
    // as you can probably guess, this is the signature ability of Primal Kyogre
    shortDesc: `Until switch-out, Water 1.5${times}, Fire 0${times} (non-Air Lock/Cloud Nine).`,
    // desc: 'On switch-in, the weather becomes Primordial Sea, '
    //   + 'which includes all the effects of Rain Dance and '
    //   + 'prevents damaging Fire-type moves from executing. '
    //   + 'This weather remains in effect until this ability is no longer active for any Pokemon, or '
    //   + 'this weather is changed by the Delta Stream or Desolate Land abilites.',
  },

  'Strong Winds': {
    label: 'Strong Winds',
    shortDesc: 'Until switch-out, no Flying weaknesses.',
    // desc: 'On switch-in, the weather becomes Delta Stream, '
    //   + 'which removes the weaknesses of the Flying type from Flying-type Pokemon. '
    //   + 'This weather remains in effect until this ability is no longer active for any Pokemon, or '
    //   + 'the weather is changed by the Desolate land or Primordial Sea abilities.',
  },
};

/**
 * Type mappings for the *Weather Ball* move, which is dependent on the `Weather`.
 *
 * @since 1.2.0
 */
export const WeatherBallTypeConditions: Partial<Record<Showdown.TypeName, Weather[]>> = {
  Normal: ['Strong Winds'],
  Fire: ['Sun', 'Harsh Sunshine'],
  Water: ['Rain', 'Heavy Rain'],
  Ice: ['Hail', 'Snow'],
  Rock: ['Sand'],
};
