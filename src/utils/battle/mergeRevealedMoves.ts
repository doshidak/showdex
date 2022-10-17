import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { getDexForFormat } from './getDexForFormat';

/**
 * Intelligently uses hardcoded intelligence to merge the `pokemon`'s currently set `moves`
 * with its `revealedMoves`.
 *
 * * Actually not that intelligent.
 *
 * @since 1.0.4
 */
export const mergeRevealedMoves = (
  pokemon: DeepPartial<CalcdexPokemon>,
): MoveName[] => {
  const {
    types,
    moves,
    revealedMoves,
  } = pokemon || {};

  if (!moves?.length) {
    return [];
  }

  const dex = getDexForFormat();

  if (!dex || !revealedMoves?.length) {
    return moves;
  }

  // first, find the non-revealed moves in `moves`
  const nonRevealedMoves = moves
    .filter((m) => !revealedMoves.includes(m))
    .map((m) => dex.moves.get(m));

  // don't do anything if there are no more non-revealed moves
  if (!nonRevealedMoves.length) {
    return moves;
  }

  // then, find the revealed moves to process
  const mergeableMoveNames = revealedMoves.filter((m) => !moves.includes(m));

  if (!mergeableMoveNames.length) {
    return moves;
  }

  const output: MoveName[] = [
    ...moves,
  ];

  for (const mergeableMove of mergeableMoveNames) {
    // look for status moves
    const statusMoveIndex = nonRevealedMoves.findIndex((m) => m?.category === 'Status');

    if (statusMoveIndex > -1) {
      const { name: statusMoveName } = nonRevealedMoves[statusMoveIndex];
      const moveIndex = output.findIndex((m) => m === statusMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = mergeableMove;
      }

      nonRevealedMoves.splice(statusMoveIndex, 1);

      continue;
    }

    // look for non-STAB moves
    const nonStabMoveIndex = types?.length
      ? nonRevealedMoves.findIndex((m) => !!m?.type && !types.includes(m.type))
      : -1;

    if (nonStabMoveIndex > -1) {
      const { name: nonStabMoveName } = nonRevealedMoves[nonStabMoveIndex];
      const moveIndex = output.findIndex((m) => m === nonStabMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = mergeableMove;
      }

      nonRevealedMoves.splice(nonStabMoveIndex, 1);

      continue;
    }

    if (!nonRevealedMoves.length) {
      break;
    }

    // at this point, pick the next move cause fuck it lol
    const [{ name: nextMoveName }] = nonRevealedMoves;

    if (nextMoveName) {
      const moveIndex = output.findIndex((m) => m === nextMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = mergeableMove;
      }

      nonRevealedMoves.splice(0, 1);
    }
  }

  return output;
};
