import { Move as SmogonMove } from '@smogon/calc';
import { detectGenFromFormat } from '@showdex/utils/battle';
import { env } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import type { SmogonMoveOverrides } from '@showdex/utils/calc';

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
  if (!pokemon?.speciesForme || !moveName || !format) {
    return null;
  }

  const gen = detectGenFromFormat(format, env.int<GenerationNum>('calcdex-default-gen'));

  // may need to perform an additional lookup using @smogon/calc's internal Generation dex
  // (which is used when passing in a type number for the first constructor parameter)
  const lookupMove = new SmogonMove(gen, moveName);

  // if an invalid move, `type` here will be `undefined`
  if (!lookupMove?.type) {
    return null;
  }

  const {
    ignoreDefensive,
    overrideDefensivePokemon,
    overrideDefensiveStat,
    overrideOffensivePokemon,
    overrideOffensiveStat,
  } = lookupMove;

  return {
    ignoreDefensive,
    overrideDefensivePokemon,
    overrideDefensiveStat,
    overrideOffensivePokemon,
    overrideOffensiveStat,
  };
};
