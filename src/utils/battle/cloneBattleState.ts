import {
  type CalcdexBattleField,
  type CalcdexBattleRules,
  type CalcdexBattleState,
  type CalcdexPlayer,
  type CalcdexPlayerSide,
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  type CalcdexPokemonPresetSpread,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
import { detectUsageAlt } from '@showdex/utils/presets/detectUsageAlt'; /** @todo reorganize me */
import { clonePlayerSideConditions } from './clonePlayerSideConditions';

/**
 * Clones a bunch of `CalcdexPokemonPresetSpread[]`'s.
 *
 * @since 1.2.0
 */
export const clonePresetSpreads = (
  spreads: CalcdexPokemonPresetSpread[],
): CalcdexPokemonPresetSpread[] => (spreads || []).map((spread) => ({
  ...spread,
  ivs: { ...spread?.ivs },
  evs: { ...spread?.evs },
}));

/**
 * Clones a single `CalcdexPokemonPreset`.
 *
 * @since 1.1.6
 */
export const clonePreset = (
  preset: CalcdexPokemonPreset,
): CalcdexPokemonPreset => {
  // start by shallow-copying everything
  const output: CalcdexPokemonPreset = {
    ...preset,
  };

  // now we'll manually specify which object properties that need to be further copied
  // (note: see comments in clonePokemon() as to why we're using Array.isArray() instead of
  // nonEmptyObject() for some of these properties)
  if (Array.isArray(output.teraTypes)) {
    output.teraTypes = output.teraTypes.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (Array.isArray(output.altAbilities)) {
    output.altAbilities = output.altAbilities.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (Array.isArray(output.altItems)) {
    output.altItems = output.altItems.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (Array.isArray(output.moves)) {
    output.moves = [...output.moves];
  }

  if (Array.isArray(output.altMoves)) {
    output.altMoves = output.altMoves.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (nonEmptyObject(output.ivs)) {
    output.ivs = { ...output.ivs };
  }

  if (nonEmptyObject(output.evs)) {
    output.evs = { ...output.evs };
  }

  if (Array.isArray(output.spreads)) {
    output.spreads = clonePresetSpreads(output.spreads);
  }

  return output;
};

/**
 * Clones a bunch of `CalcdexPokemonPreset`'s, typically attached to a `CalcdexPokemon`.
 *
 * @since 1.1.6
 */
export const clonePresets = (
  presets: CalcdexPokemonPreset[],
): CalcdexPokemonPreset[] => presets?.map(clonePreset) || [];

/**
 * Clones a single `CalcdexPokemon`.
 *
 * @since 1.1.6
 */
export const clonePokemon = (
  pokemon: CalcdexPokemon,
): CalcdexPokemon => {
  // start by shallow-copying everything
  const output: CalcdexPokemon = {
    ...pokemon,
  };

  // now we'll manually specify which object properties that need to be further copied
  // (note that all arrays are technically objects as well!)
  // (also note: not using nonEmptyObject() in lieu of Array.isArray() since we'll want to
  // create a new array [i.e., new reference in memory] even if the source is empty!)
  // (also also note: could've looped over an array of CalcdexPokemon keys, but TypeScript's
  // being a little bitch, so don't feel like wrangling it too much rn)
  if (Array.isArray(output.altFormes)) {
    output.altFormes = [...output.altFormes];
  }

  if (Array.isArray(output.types)) {
    output.types = [...output.types];
  }

  if (Array.isArray(output.dirtyTypes)) {
    output.dirtyTypes = [...output.dirtyTypes];
  }

  if (Array.isArray(output.altTeraTypes)) {
    output.altTeraTypes = output.altTeraTypes.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (Array.isArray(output.abilities)) {
    output.abilities = [...output.abilities];
  }

  if (Array.isArray(output.transformedAbilities)) {
    output.transformedAbilities = [...output.transformedAbilities];
  }

  if (Array.isArray(output.altAbilities)) {
    output.altAbilities = output.altAbilities.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (Array.isArray(output.altItems)) {
    output.altItems = output.altItems.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (nonEmptyObject(output.ivs)) {
    output.ivs = { ...output.ivs };
  }

  if (nonEmptyObject(output.evs)) {
    output.evs = { ...output.evs };
  }

  if (Array.isArray(output.moves)) {
    output.moves = [...output.moves];
  }

  if (Array.isArray(output.serverMoves)) {
    output.serverMoves = [...output.serverMoves];
  }

  if (Array.isArray(output.transformedMoves)) {
    output.transformedMoves = [...output.transformedMoves];
  }

  if (Array.isArray(output.altMoves)) {
    output.altMoves = output.altMoves.map((a) => (detectUsageAlt(a) ? [...a] : a));
  }

  if (Array.isArray(output.moveTrack)) {
    output.moveTrack = output.moveTrack.map((t) => [...t] as typeof output.moveTrack[0]);
  }

  if (Array.isArray(output.revealedMoves)) {
    output.revealedMoves = [...output.revealedMoves];
  }

  if (nonEmptyObject(output.stellarMoveMap)) {
    output.stellarMoveMap = { ...output.stellarMoveMap };
  }

  if (nonEmptyObject(output.moveOverrides)) {
    output.moveOverrides = Object.entries(output.moveOverrides).reduce((prev, [key, value]) => {
      prev[key] = {
        ...value,
      };

      return prev;
    }, {} as typeof output['moveOverrides']);
  }

  if (nonEmptyObject(output.boosts)) {
    output.boosts = { ...output.boosts };
  }

  if (nonEmptyObject(output.dirtyBoosts)) {
    output.dirtyBoosts = { ...output.dirtyBoosts };
  }

  if (nonEmptyObject(output.autoBoostMap)) {
    output.autoBoostMap = Object.entries(output.autoBoostMap).reduce((prev, [key, value]) => {
      prev[key] = {
        ...value,
        boosts: { ...value?.boosts },
      };

      return prev;
    }, {} as typeof output['autoBoostMap']);
  }

  if (nonEmptyObject(output.baseStats)) {
    output.baseStats = { ...output.baseStats };
  }

  if (nonEmptyObject(output.dirtyBaseStats)) {
    output.dirtyBaseStats = { ...output.dirtyBaseStats };
  }

  if (nonEmptyObject(output.transformedBaseStats)) {
    output.transformedBaseStats = { ...output.transformedBaseStats };
  }

  if (nonEmptyObject(output.serverStats)) {
    output.serverStats = { ...output.serverStats };
  }

  if (nonEmptyObject(output.spreadStats)) {
    output.spreadStats = { ...output.spreadStats };
  }

  if (Array.isArray(output.presets)) {
    output.presets = clonePresets(output.presets);
  }

  return output;
};

/**
 * Clones a bunch of `CalcdexPokemon`'s, typically attached to a `CalcdexPlayer`.
 *
 * * Since `clonePokemons` sounds kinda weird, we're opting for this non-conventional function name instead.
 *   - Sorry.
 *
 * @since 1.1.6
 */
export const cloneAllPokemon = (
  pokemon: CalcdexPokemon[],
): CalcdexPokemon[] => pokemon?.map(clonePokemon) || [];

/**
 * Clones a `CalcdexPlayerSide`.
 *
 * @since 1.1.6
 */
export const clonePlayerSide = (
  side: CalcdexPlayerSide,
): CalcdexPlayerSide => {
  // start by shallow-copying everything
  const output: CalcdexPlayerSide = {
    ...side,
  };

  // everything except for `conditions` is shallow-copyable (e.g., they're non-object types),
  // so if defined, make sure we separately clone the `conditions` object
  if (nonEmptyObject(output.conditions)) {
    output.conditions = clonePlayerSideConditions(output.conditions);
  }

  return output;
};

/**
 * Clones a `CalcdexPlayer`.
 *
 * @since 1.1.6
 */
export const clonePlayer = (
  player: CalcdexPlayer,
): CalcdexPlayer => {
  // start by shallow-copying everything
  const output: CalcdexPlayer = {
    ...player,
  };

  // now we'll manually specify which object properties that need to be further copied
  // (note: see comments in clonePokemon() as to why we're using Array.isArray() instead of
  // nonEmptyObject() for some of these properties)
  if (Array.isArray(output.activeIndices)) {
    output.activeIndices = [...output.activeIndices];
  }

  if (Array.isArray(output.pokemonOrder)) {
    output.pokemonOrder = [...output.pokemonOrder];
  }

  if (Array.isArray(output.pokemon)) {
    output.pokemon = cloneAllPokemon(output.pokemon);
  }

  if (nonEmptyObject(output.side)) {
    output.side = clonePlayerSide(output.side);
  }

  return output;
};

/**
 * Clones a `CalcdexBattleField`.
 *
 * @since 1.1.6
 */
export const cloneField = (
  field: CalcdexBattleField,
): CalcdexBattleField => {
  // start by shallow-copying everything
  const output: CalcdexBattleField = {
    ...field,
  };

  // note all properties except for attackerSide & defenderSide are non-object types,
  // so they're already "deeply-copied" -- since we're not using the aforementioned
  // object types, we'll remove them in case they're preset in the `output` object
  if ('attackerSide' in output) {
    delete output.attackerSide;
  }

  if ('defenderSide' in output) {
    delete output.defenderSide;
  }

  return output;
};

/**
 * Clones the `CalcdexBattleRules`, typically attached to a `CalcdexBattleState`.
 *
 * @since 1.1.6
 */
export const cloneRules = (
  rules: CalcdexBattleRules,
): CalcdexBattleRules => {
  // start by shallow-copying everything
  const output: CalcdexBattleRules = {
    ...rules,
  };

  // actually, nothing in this object needs to be copied further (they're all non-object types),
  // so we're done! LOL
  return output;
};

/**
 * Clones a `CalcdexBattleState`, including all of the `CalcdexPlayer`'s & their `CalcdexPokemon`.
 *
 * @since 1.1.6
 */
export const cloneBattleState = (
  battle: CalcdexBattleState,
): CalcdexBattleState => {
  // start by shallow-copying everything
  const output: CalcdexBattleState = {
    ...battle,
  };

  // now we'll manually specify which object properties that need to be further copied
  // (note: see comments in clonePokemon() as to why we're using Array.isArray() instead of
  // nonEmptyObject() for some of these properties)
  if (nonEmptyObject(output.rules)) {
    output.rules = cloneRules(output.rules);
  }

  if (nonEmptyObject(output.field)) {
    output.field = cloneField(output.field);
  }

  if (Array.isArray(output.sheets)) {
    output.sheets = clonePresets(output.sheets);
  }

  AllPlayerKeys.forEach((playerKey) => {
    // note: don't care if the player is active or not, just as long as they're initialized
    if (nonEmptyObject(output[playerKey])) {
      output[playerKey] = clonePlayer(output[playerKey]);
    }
  });

  return output;
};
