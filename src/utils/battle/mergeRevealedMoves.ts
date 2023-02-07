import { PokemonPivotMoves } from '@showdex/consts/pokemon';
// import { formatId } from '@showdex/utils/app';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import { flattenAlts } from './flattenAlts';
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
    altMoves,
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
  // update (2023/01/06): changed the filter condition since using startsWith() will prevent something like
  // 'Toxic' from merging if 'Toxic Spikes' already exists ('Toxic Spikes'.startsWith('Toxic') -> true ... LOL)
  // update (2023/02/03): renamed this from `mergeableMoveNames` cause its name was confusing af tbh.
  // e.g., revealedMoves: ['Hidden Power', 'Calm Mind'],
  // moves: ['Diamond Storm', 'Protect', 'Moonblast', 'Hidden Power Fire']
  const revealedMoveNames = revealedMoves.filter((r) => ( // e.g., m = 'Hidden Power'
    !moves.some((m) => ( // e.g., n = 'Hidden Power Fire'
      (r.startsWith('Hidden Power') && m.startsWith(r)) // e.g., true, so 'Hidden Power' is ignored
        || m === r
    ))
  ));

  if (!revealedMoveNames.length) {
    return moves;
  }

  // 'Hidden Power' can still exist in revealedMoveNames if some typed equivalent doesn't exist in moves[],
  // so if altMoves[] are provided, we can look for a typed Hidden Power and replace its Normal-type
  // counterpart in revealedMoveNames
  // update (2023/02/03): reason why I'm back for round 4/5? of Hidden Power fixes is cause I forgot
  // to merge the altMoves in applyPreset() of the CalcdexPokeProvider (which also happens to be the
  // *only* place calling this utility that can provide an altMoves since they're from presets lmfaoo)
  if (revealedMoveNames.includes(<MoveName> 'Hidden Power') && altMoves?.length) {
    const revealedIndex = revealedMoveNames.findIndex((m) => m === 'Hidden Power');
    const hiddenPowerFromAlt = flattenAlts(altMoves).find((m) => m?.startsWith('Hidden Power'));

    if (revealedIndex > -1 && hiddenPowerFromAlt) {
      revealedMoveNames[revealedIndex] = hiddenPowerFromAlt;
    }
  }

  // this will be our final return value
  const output: MoveName[] = [
    ...moves,
  ];

  for (const revealedMoveName of revealedMoveNames) {
    // attempt a dex lookup of the current revealedMoveName
    const revealedMove = dex.moves.get(revealedMoveName);

    // HUH
    if (!revealedMove?.exists) {
      continue;
    }

    // look for status moves
    const statusMoveIndex = nonRevealedMoves.findIndex((m) => m?.category === 'Status');

    if (statusMoveIndex > -1) {
      const { name: statusMoveName } = nonRevealedMoves[statusMoveIndex];
      const moveIndex = output.findIndex((m) => m === statusMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = revealedMoveName;
        nonRevealedMoves.splice(statusMoveIndex, 1);

        continue;
      }
    }

    // look for damaging STAB moves (except pivot moves like U-turn),
    // but only if the current revealedMove is damaging
    if (revealedMove.category !== 'Status' && types.includes(revealedMove.type)) {
      const stabMoveIndex = nonRevealedMoves.findIndex((m) => (
        (!!m?.category && m.category !== 'Status')
          && types.includes(m.type)
          && !PokemonPivotMoves.includes(<MoveName> m.name)
      ));

      if (stabMoveIndex > -1) {
        const { name: stabMoveName } = nonRevealedMoves[stabMoveIndex];
        const moveIndex = output.findIndex((m) => m === stabMoveName);

        if (moveIndex > -1) {
          output[moveIndex] = revealedMoveName;
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
        output[moveIndex] = revealedMoveName;
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
        output[moveIndex] = revealedMoveName;
        nonRevealedMoves.splice(0, 1);
      }
    }
  }

  return output;
};
