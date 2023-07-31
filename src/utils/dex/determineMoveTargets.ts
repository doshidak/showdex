import { type MoveName, Move as SmogonMove } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/redux/store';
import { type SmogonMoveOverrides } from '@showdex/utils/calc';
import { formatId } from '@showdex/utils/core';
import { detectGenFromFormat } from './detectGenFromFormat';

/**
 * Performs a lookup via `@smogon/calc`'s internal dex from the detected `gen` from the passed-in `format`.
 *
 * * Provides the following properties that can be passed to `SmogonMove`'s `options` constructor parameter:
 *   - `ignoreDefensive`
 *   - `overrideDefensivePokemon`
 *   - `overrideDefensiveStat`
 *   - `overrideOffensivePokemon`
 *   - `overrideOffensiveStat`
 * * Showdown's global `Dex` object does not supply these properties, so moves like *Psyshock* and *Psystrike*
 *   will calculate against the incorrect defensive stat (e.g., SPD instead of DEF since they're both *Special* moves)
 *   unless these properties are specified.
 *   - For reference, *Psyshock* and *Psystrike* should calculate against DEF, not SPD, which is specified in the
 *     `overrideDefensiveStat` property from this function.
 * * Returns `null` if any of the passed-in arguments are invalid, or the lookup failed.
 *   - Can still be safely spread into an object.
 *
 * @since 1.0.6
 */
export const determineMoveTargets = (
  format: string,
  pokemon: CalcdexPokemon,
  moveName: MoveName,
): SmogonMoveOverrides => {
  const gen = detectGenFromFormat(format);

  if (!gen || !pokemon?.speciesForme || !moveName) {
    return null;
  }

  // may need to perform an additional lookup using @smogon/calc's internal Generation dex
  // (which is used when passing in a type number for the first constructor parameter)
  const lookupMove = new SmogonMove(gen, moveName);

  // if an invalid move, `type` here will be `undefined`
  if (!lookupMove?.type) {
    return null;
  }

  const moveId = formatId(moveName);

  const {
    ignoreDefensive,
    overrideDefensivePokemon,
    overrideDefensiveStat: defensiveStat,
    overrideOffensivePokemon,
    overrideOffensiveStat: offensiveStat,
  } = lookupMove;

  // for Beat Up, force using ATK & DEF
  // (but specifying those here to let the user override them, if they want)
  const forcePhysical = moveId === 'beatup';

  return {
    ignoreDefensive,
    overrideDefensivePokemon,
    overrideDefensiveStat: forcePhysical ? 'def' : defensiveStat,
    overrideOffensivePokemon,
    overrideOffensiveStat: forcePhysical ? 'atk' : offensiveStat,
  };
};
