import { PokemonPivotMoves } from '@showdex/consts/pokemon';
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
    return revealedMoves?.length ? revealedMoves : [];
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
    /**
     * @todo Needs to be updated once we support more than 4 moves.
     */
    if (moves.length < 4) {
      return Array.from(new Set([...moves, ...revealedMoves])).slice(0, 4);
    }

    return moves;
  }

  // then, find the revealed moves to process
  // (using some() here for 'Hidden Power', so an existing move like 'Hidden Power Electric' should match,
  // therefore, filtered out of this list; otherwise, 'Hidden Power' will replace another move!)
  const mergeableMoveNames = revealedMoves.filter((m) => !moves.some((n) => n.startsWith(m)));

  if (!mergeableMoveNames.length) {
    return moves;
  }

  const output: MoveName[] = [
    ...moves,
  ];

  for (const mergeableMoveName of mergeableMoveNames) {
    const mergeableMove = dex.moves.get(mergeableMoveName);

    // HUH
    if (!mergeableMove?.exists) {
      continue;
    }

    // look for status moves
    const statusMoveIndex = nonRevealedMoves.findIndex((m) => m?.category === 'Status');

    if (statusMoveIndex > -1) {
      const { name: statusMoveName } = nonRevealedMoves[statusMoveIndex];
      const moveIndex = output.findIndex((m) => m === statusMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = mergeableMoveName;
        nonRevealedMoves.splice(statusMoveIndex, 1);

        continue;
      }
    }

    // look for damaging STAB moves (except pivot moves like U-turn),
    // but only if the current mergeableMove is damaging
    if (mergeableMove.category !== 'Status' && types.includes(mergeableMove.type)) {
      const stabMoveIndex = nonRevealedMoves.findIndex((m) => (
        (!!m?.category && m.category !== 'Status')
          && types.includes(m.type)
          && !PokemonPivotMoves.includes(<MoveName> m.name)
      ));

      if (stabMoveIndex > -1) {
        const { name: stabMoveName } = nonRevealedMoves[stabMoveIndex];
        const moveIndex = output.findIndex((m) => m === stabMoveName);

        if (moveIndex > -1) {
          output[moveIndex] = mergeableMoveName;
          nonRevealedMoves.splice(stabMoveIndex, 1);

          continue;
        }
      }
    }

    // look for non-STAB moves
    const nonStabMoveIndex = types?.length
      ? nonRevealedMoves.findIndex((m) => !!m?.type && !types.includes(m.type))
      : -1;

    if (nonStabMoveIndex > -1) {
      const { name: nonStabMoveName } = nonRevealedMoves[nonStabMoveIndex];
      const moveIndex = output.findIndex((m) => m === nonStabMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = mergeableMoveName;
        nonRevealedMoves.splice(nonStabMoveIndex, 1);

        continue;
      }
    }

    if (!nonRevealedMoves.length) {
      break;
    }

    // at this point, pick the next move cause fuck it lol
    const [{ name: nextMoveName }] = nonRevealedMoves;

    if (nextMoveName) {
      const moveIndex = output.findIndex((m) => m === nextMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = mergeableMoveName;
        nonRevealedMoves.splice(0, 1);
      }
    }
  }

  return output;
};
