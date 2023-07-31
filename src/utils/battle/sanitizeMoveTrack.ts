import { type GenerationNum, type MoveName } from '@smogon/calc';
import { type CalcdexPokemon } from '@showdex/redux/store';
import { getDexForFormat } from '@showdex/utils/dex';

/**
 * Internal helper function to `filter()` & `map()` the `moveTrack` to the dex entries via `dex.moves.get()`.
 *
 * * If `transformed` is `true`, only moves prepended with an asterisk (i.e., `*`) will be processed.
 *   - Otherwise, only moves that don't start with an asterisk will be processed (default).
 *   - Asterisk prefix in the move's name is how Showdown signifies it was inherited after transforming.
 *
 * @since 1.1.6
 */
const getDexMoveTrack = (
  dex: Showdown.ModdedDex,
  moveTrack: CalcdexPokemon['moveTrack'],
  transformed?: boolean,
): [
  move: Showdown.Move,
  ppUsed: number,
][] => moveTrack
  ?.filter((t) => (
    Array.isArray(t)
      && typeof t[0] === 'string'
      && !!t[0]
      && (transformed ? t[0].startsWith('*') : !t[0].startsWith('*'))
  ))
  .map(([moveName, ppUsed]) => [
    dex.moves.get(moveName?.replace('*', '')),
    ppUsed || 0,
  ] as [move: Showdown.Move, ppUsed: number])
  .filter(([move]) => move?.exists && !!move.name);

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
 * {
 *   moveTrack: [],
 *   revealedMoves: [],
 *   transformedMoves: [],
 * }
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
    transformedMoves: [],
  };

  if (!dex || !pokemon?.moveTrack?.length) {
    return output;
  }

  const moveTrack = pokemon.moveTrack as CalcdexPokemon['moveTrack'];
  const dexMoveTrack = getDexMoveTrack(dex, moveTrack);
  const dexTransformedMoveTrack = getDexMoveTrack(dex, moveTrack, true);

  if (!dexMoveTrack.length && !dexTransformedMoveTrack.length) {
    return output;
  }

  output.moveTrack = dexMoveTrack.map(([move, ppUsed]) => [
    move.name,
    ppUsed,
  ] as [moveName: MoveName, ppUsed: number]);

  output.transformedMoves = dexTransformedMoveTrack
    .map(([move]) => move.name as MoveName);

  // filter out any Z/Max moves from the moveTrack
  output.revealedMoves = dexMoveTrack
    .filter(([move]) => !move.isZ && !move.isMax)
    .map(([move]) => move.name as MoveName);

  return output;
};
