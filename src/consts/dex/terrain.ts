import { type Terrain } from '@smogon/calc';
import { times } from '@showdex/consts/core';
import { type FieldConditionDescription } from './weather';

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
export const PseudoWeatherMap: Record<string, Terrain> = {
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
export const TerrainNames: Terrain[] = Object.values(PseudoWeatherMap).sort();

/**
 * Terrain descriptions.
 *
 * @note `desc` properties are commented out atm to not include them in the bundle.
 * @see https://smogon.com/dex/ss
 * @deprecated As of v1.2.1, these are stored in translation strings in `@showdex/assets/i18n`.
 * @since 1.0.3
 */
export const TerrainDescriptions: Record<Terrain, FieldConditionDescription> = {
  Electric: {
    shortDesc: `For 5 turns, Electric 1.3${times} (grounded), can't sleep.`,
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
    shortDesc: `For 5 turns, Grass 1.3${times} (grounded), Bulldoze/Earthquake/Magnitude 0.5${times}, +6% HP (floored).`,
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
    shortDesc: `For 5 turns, Dragon 0.5${times} (grounded), can't status.`,
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
    shortDesc: `For 5 turns, Psychic 1.3${times} (grounded), no priority.`,
    // desc: 'For 5 turns, the terrain becomes Psychic Terrain. '
    //   + 'During the effect, the power of Psychic-type attacks made by grounded Pokemon is multiplied by 1.3 and '
    //   + 'grounded Pokemon cannot be hit by moves with priority greater than 0, unless the target is an ally. '
    //   + 'Camouflage transforms the user into a Psychic type, '
    //   + 'Nature Power becomes Psychic, and '
    //   + "Secret Power has a 30% chance to lower the target's Speed by 1 stage. "
    //   + 'Fails if the current terrain is Psychic Terrain.',
  },
};

/**
 * Type mappings for the *Terrain Pulse* move, which is dependent on the `Terrain`.
 *
 * @since 1.2.0
 */
export const TerrainPulseTypeConditions: Partial<Record<Showdown.TypeName, Terrain>> = {
  Electric: 'Electric',
  Grass: 'Grassy',
  Fairy: 'Misty',
  Psychic: 'Psychic',
};
