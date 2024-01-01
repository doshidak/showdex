import { type MoveName } from '@smogon/calc';
import { type CalcdexBattleField, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
import { getMoveOverrideDefaults } from './getMoveOverrideDefaults';

/**
 * Determines if the corresponding `CalcdexMoveOverride` in `pokemon` for the passed-in `moveName`
 * differs from the default properties of the `moveName`.
 *
 * * Useful for allowing users to "reset" their overrides if this returns `true`.
 *
 * @since 1.0.6
 */
export const hasMoveOverrides = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
  opponentPokemon?: CalcdexPokemon,
  field?: CalcdexBattleField,
): boolean => {
  if (!pokemon?.speciesForme || !moveName || !format) {
    return false;
  }

  if (!nonEmptyObject(pokemon.moveOverrides) || !(moveName in pokemon.moveOverrides)) {
    return false;
  }

  const defaults = getMoveOverrideDefaults(format, pokemon, moveName, opponentPokemon, field) || {};
  const current = pokemon.moveOverrides[moveName] || {};

  // only compare overrides that currently exist, otherwise, this will frequently return true
  // just because a particular property wasn't overwritten
  return Object.entries(defaults).some(([key, value]) => (
    key in current
      && typeof current[key] === typeof value
      && current[key] !== value
  ));
};
