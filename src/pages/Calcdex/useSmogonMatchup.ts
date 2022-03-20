import * as React from 'react';
import type { GenerationNum } from '@pkmn/data';
import type {
  Field as SmogonField,
  Move as SmogonMove,
  Pokemon as SmogonPokemon,
} from '@smogon/calc';
import type { CalcdexMatchupResult } from './calcSmogonMatchup';
import { calcSmogonMatchup } from './calcSmogonMatchup';

export type SmogonMatchupHookCalculator = (
  playerMove: SmogonMove,
) => CalcdexMatchupResult;

/**
 * A memoized version of `calcSmogonMatchup()`.
 *
 * * Note that a memoized callback is returned that requires one argument, `playerMove`.
 *
 * @since 0.1.2
 */
export const useSmogonMatchup = (
  gen: GenerationNum,
  playerPokemon: SmogonPokemon,
  opponentPokemon: SmogonPokemon,
  field?: SmogonField,
): SmogonMatchupHookCalculator => React.useCallback<SmogonMatchupHookCalculator>((
  playerMove,
) => calcSmogonMatchup(
  gen,
  playerPokemon,
  opponentPokemon,
  playerMove,
  field,
), [
  gen,
  playerPokemon,
  opponentPokemon,
  field,
]);
