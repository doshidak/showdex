import { type GenerationNum, type MoveName } from '@smogon/calc';
import { PokemonPivotMoves } from '@showdex/consts/dex';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { dedupeArray } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getDexForFormat } from '@showdex/utils/dex';
import {
  detectUsageAlts,
  flattenAlts,
  usageAltPercentFinder,
  usageAltPercentSorter,
} from '@showdex/utils/presets';

// const l = logger('@showdex/utils/battle/mergeRevealedMoves()');

/**
 * Intelligently uses hardcoded intelligence to merge the `pokemon`'s currently set `moves[]` with its `revealedMoves[]`
 * or if available, its `transformedMoves[]`.
 *
 * * Actually not that intelligent.
 * * As of v1.2.4, this'll now avoid replacing any of the `pokemon`'s 100% guaranteed moves discerned from its `usageMoves[]`, if any.
 *   - For transformed `pokemon`, this assumes that its `usageMoves[]`, if provided, is of its `transformedForme`.
 *
 * @since 1.0.4
 */
export const mergeRevealedMoves = (
  pokemon: Partial<CalcdexPokemon>,
  config?: {
    format?: string | GenerationNum;
  },
): MoveName[] => {
  const { format } = { ...config };
  const dex = getDexForFormat(format);

  const {
    types,
    moves,
    altMoves,
    usageMoves,
    revealedMoves,
    transformedMoves,
  } = pokemon || {};

  const guaranteedMoves = (usageMoves || []).filter((m) => m?.[1] === 1).map((m) => m[0]);
  const revealedSource = [...((transformedMoves?.length ? transformedMoves : revealedMoves) || [])];

  /**
   * @todo Needs to be updated once we support more than 4 moves.
   */
  const movesSource = dedupeArray([...(moves || []), ...(revealedSource || [])]).slice(0, 4);

  /*
  l.debug(
    'Processing moves for', pokemon?.ident || pokemon?.speciesForme,
    '\n', 'moves[]', moves,
    '\n', 'altMoves[]', altMoves,
    '\n', 'usageMoves[]', usageMoves,
    '\n', 'movesSource[]', movesSource,
    '\n', 'revealedSource[]', '->', transformedMoves?.length ? 'transformedMoves[]' : 'revealedMoves[]', revealedSource,
    '\n', 'guaranteedMoves[]', guaranteedMoves,
    '\n', 'pokemon', pokemon,
  );
  */

  if (!moves?.length || !revealedSource.length) {
    return movesSource;
  }

  // first, find the non-revealed, non-100% guaranteed (if `usageMoves[]` are available) moves currently set in `moves[]`
  const replaceableMoves = movesSource.filter((m) => !revealedSource.includes(m) && !guaranteedMoves.includes(m));

  if (!replaceableMoves.length) {
    /*
    if (moves.length < 4) {
      return dedupeArray([...moves, ...revealedSource]).slice(0, 4);
    }
    */

    return movesSource;
  }

  // since the last default case of the replacement algorithm will just select the top-most move (i.e., index 0),
  // we'll sort the replaceable non-revealed moves by usage, then reverse() it!
  if (detectUsageAlts(usageMoves)) {
    replaceableMoves.sort(usageAltPercentSorter(usageAltPercentFinder(usageMoves))).reverse();
  }

  const nonRevealedMoves = replaceableMoves.map((m) => dex.moves.get(m));

  // then, find the revealed moves to process
  // (using some() here for 'Hidden Power', so an existing move like 'Hidden Power Electric' should match,
  // therefore, filtered out of this list; otherwise, 'Hidden Power' will replace another move!)
  // update (2023/01/06): changed the filter condition since using startsWith() will prevent something like
  // 'Toxic' from merging if 'Toxic Spikes' already exists ('Toxic Spikes'.startsWith('Toxic') -> true ... LOL)
  // update (2023/02/03): renamed this from `mergeableMoveNames` cause its name was confusing af tbh.
  // e.g., revealedSource: ['Hidden Power', 'Calm Mind'],
  // moves: ['Diamond Storm', 'Protect', 'Moonblast', 'Hidden Power Fire']
  const revealedSourceMoves = revealedSource.filter((r) => ( // e.g., m = 'Hidden Power'
    !movesSource.some((m) => ( // e.g., n = 'Hidden Power Fire'
      (r.startsWith('Hidden Power') && m.startsWith(r)) // e.g., true, so 'Hidden Power' is ignored
        || m === r
    ))
  ));

  /*
  l.debug(
    '\n', 'pokemon', pokemon.ident || pokemon.speciesForme, pokemon,
    '\n', 'replaceableMoves[]', replaceableMoves,
    '\n', 'nonRevealedMoves[]', nonRevealedMoves,
    '\n', 'revealedSourceMoves[]', revealedSourceMoves,
  );
  */

  if (!revealedSourceMoves.length) {
    return movesSource;
  }

  // 'Hidden Power' can still exist in revealedSourceMoves[] if some typed equivalent doesn't exist in moves[],
  // so if altMoves[] are provided, we can look for a typed Hidden Power & replace its Normal-type
  // counterpart in revealedSourceMoves[]
  // update (2023/02/03): reason why I'm back for round 4/5? of Hidden Power fixes is cause I forgot
  // to merge the altMoves in applyPreset() of the CalcdexPokeProvider (which also happens to be the
  // *only* place calling this utility that can provide an altMoves since they're from presets lmfaoo)
  if (revealedSourceMoves.includes('Hidden Power' as MoveName) && altMoves?.length) {
    const revealedIndex = revealedSourceMoves.findIndex((m) => m === 'Hidden Power');
    const hiddenPowerFromAlt = flattenAlts(altMoves).find((m) => m?.startsWith('Hidden Power'));

    if (revealedIndex > -1 && hiddenPowerFromAlt) {
      revealedSourceMoves[revealedIndex] = hiddenPowerFromAlt;
    }
  }

  // this will be our final return value
  const output: MoveName[] = [...movesSource];

  for (const revealedSourceMove of revealedSourceMoves) {
    // attempt a dex lookup of the current revealedSourceMove
    const revealedDexMove = dex.moves.get(revealedSourceMove);

    // HUH
    if (!revealedDexMove?.exists) {
      continue;
    }

    // look for status moves
    const statusMoveIndex = nonRevealedMoves.findIndex((m) => m?.category === 'Status');

    if (statusMoveIndex > -1) {
      const { name: statusMoveName } = nonRevealedMoves[statusMoveIndex];
      const moveIndex = output.findIndex((m) => m === statusMoveName);

      if (moveIndex > -1) {
        output[moveIndex] = revealedSourceMove;
        nonRevealedMoves.splice(statusMoveIndex, 1);

        continue;
      }
    }

    // look for damaging STAB moves (except pivot moves like U-turn),
    // but only if the current revealedMove is damaging
    if (revealedDexMove.category !== 'Status' && types.includes(revealedDexMove.type)) {
      const stabMoveIndex = nonRevealedMoves.findIndex((m) => (
        (!!m?.category && m.category !== 'Status')
          && types.includes(m.type)
          && !PokemonPivotMoves.includes(m.name as MoveName)
      ));

      if (stabMoveIndex > -1) {
        const { name: stabMoveName } = nonRevealedMoves[stabMoveIndex];
        const moveIndex = output.findIndex((m) => m === stabMoveName);

        if (moveIndex > -1) {
          output[moveIndex] = revealedSourceMove;
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
        output[moveIndex] = revealedSourceMove;
        nonRevealedMoves.splice(nonStabMoveIndex, 1);

        continue;
      }
    }

    if (!nonRevealedMoves.length) {
      break;
    }

    // at this point, pick the next move cause fuck it lol
    const [{ name: nextMoveName }] = nonRevealedMoves;

    if (!nextMoveName) {
      continue;
    }

    const moveIndex = output.findIndex((m) => m === nextMoveName);

    if (moveIndex < 0) {
      continue;
    }

    output[moveIndex] = revealedSourceMove;
    nonRevealedMoves.splice(0, 1);
  }

  /*
  l.debug(
    'Merged revealedSource[] moves for', pokemon.ident || pokemon.speciesForme,
    '\n', 'output[]', output,
    '\n', 'moves[]', moves,
    '\n', 'altMoves[]', altMoves,
    '\n', 'usageMoves[]', usageMoves,
    '\n', 'revealedSource[]', '->', transformedMoves?.length ? 'transformedMoves[]' : 'revealedMoves[]', revealedSource,
    '\n', 'guaranteedMoves[]', guaranteedMoves,
    '\n', 'replaceableMoves[]', replaceableMoves,
    '\n', 'nonRevealedMoves[]', nonRevealedMoves,
    '\n', 'revealedSourceMoves[]', revealedSourceMoves,
    '\n', 'pokemon', pokemon,
  );
  */

  return output;
};
