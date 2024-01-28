import { type MoveName } from '@smogon/calc';
import { type CalcdexPokemonAlt } from '@showdex/interfaces/calc';

/* eslint-disable @typescript-eslint/indent */

/**
 * Replaces *Iron Head* in the provided `moves[]` with *Behemoth Blade* or *Behemoth Bash* depending on the `speciesForme`.
 *
 * * No-op if `speciesForme` is not a doggo or `moves[]` contains none of the aforementioned moves.
 *   - Note: *Doggo* Pokemon refer to *Zacian* & *Zamazenta* bork bork
 * * Originally moved from `updatePokemon()` in the `useCalcdexContext()` hook from `@showdex/components/calc`.
 * * Guaranteed to return an empty array.
 *
 * @since 1.2.3
 */
export const replaceBehemothMoves = <
  TMove extends CalcdexPokemonAlt<MoveName>,
>(
  speciesForme: string,
  moves: TMove[],
): TMove[] => {
  const output: TMove[] = [...(moves || [])];

  const shouldBehemoth = [
    'Zacian',
    'Zamazenta',
  ].some((f) => speciesForme?.startsWith(f)) && output.some((m) => {
    const name: MoveName = Array.isArray(m) ? m[0] : m;

    return name === 'Iron Head' as MoveName || name?.startsWith('Behemoth');
  });

  if (!shouldBehemoth) {
    return output;
  }

  const bash = speciesForme.startsWith('Zamazenta');
  const crowned = speciesForme.endsWith('-Crowned');

  // tried setting Iron Head while Behemoth Bash was there, so changing the forme back to Zamazenta, then back to
  // the Crowned forme again will result in 2 Bash's !! LOL
  // mutated.moves = mutated.moves.map((move) => (
  //   move === 'Iron Head' as MoveName && crowned
  //     ? (bash ? 'Behemoth Bash' : 'Behemoth Blade') as MoveName
  //     : move
  // ));

  const bashMove = (bash ? 'Behemoth Bash' : 'Behemoth Blade') as MoveName;
  const sourceMove = crowned ? 'Iron Head' as MoveName : bashMove;
  const sourceIndex = output.findIndex((m) => (Array.isArray(m) ? m[0] : m) === sourceMove);

  if (sourceIndex < 0) {
    return output; // o_O
  }

  const replacementMove = crowned ? bashMove : 'Iron Head' as MoveName;

  output[sourceIndex] = (
    Array.isArray(output[sourceIndex])
      ? [replacementMove, ...output[sourceIndex].slice(1)]
      : replacementMove
  ) as TMove;

  return output;
};

/* eslint-enable @typescript-eslint/indent */
