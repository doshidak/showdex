import { getDexForFormat } from '@showdex/utils/dex';
import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';

/**
 * Sanitizes the `moveTrack` from the passed-in `pokemon` and constructs the `revealedMoves`
 * from the resulting sanitized `moveTrack`, if any.
 *
 * * Partialed `CalcdexPokemon` is returned with only the `moveTrack` and `revealedMoves` defined.
 *   - Meant to be spread into an existing `CalcdexPokemon` object.
 * * Even if `pokemon` is not provided or has no `moveTrack`, the sanitized `moveTrack` and
 *   `revealedMoves` are guaranteed to be arrays (albeit empty).
 *
 * @default
 * ```ts
 * { moveTrack: [], revealedMoves: [] }
 * ```
 * @since 1.0.3
 */
export const sanitizeMoveTrack = (
  pokemon: DeepPartial<Showdown.Pokemon> | DeepPartial<CalcdexPokemon> = {},
  format?: GenerationNum | string,
): DeepPartial<CalcdexPokemon> => {
  const dex = getDexForFormat(format);

  // this is the output object we'll return later
  const output: DeepPartial<CalcdexPokemon> = {
    moveTrack: [],
    revealedMoves: [],
  };

  if (!dex || !pokemon?.moveTrack?.length) {
    return output;
  }

  const dexMoveTrack = pokemon.moveTrack
    .filter((t) => Array.isArray(t) && !!t[0])
    .map(([moveName, ppUsed]) => <[move: Showdown.Move, ppUsed: number]> [
      // transformed moves will sometimes have an asterisk (*) in the name
      dex.moves.get(moveName?.replace('*', '')),
      ppUsed || 0,
    ])
    .filter(([move]) => move?.exists && !!move.name);

  if (!dexMoveTrack.length) {
    return output;
  }

  output.moveTrack = dexMoveTrack
    .map(([move, ppUsed]) => <[moveName: MoveName, ppUsed: number]> [
      move?.name,
      ppUsed,
    ]);

  // filter out any Z/Max moves from the moveTrack
  output.revealedMoves = dexMoveTrack
    .filter(([move]) => !move.isZ && !move.isMax)
    .map(([move]) => <MoveName> move.name);

  return output;
};
