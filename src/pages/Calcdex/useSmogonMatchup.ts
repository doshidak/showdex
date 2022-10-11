import * as React from 'react';
import { calcSmogonMatchup } from '@showdex/utils/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type {
  CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemon,
  ShowdexCalcdexSettings,
} from '@showdex/redux/store';
import type { CalcdexMatchupResult } from '@showdex/utils/calc';

export type SmogonMatchupHookCalculator = (
  playerMove: MoveName,
) => CalcdexMatchupResult;

/**
 * A memoized version of `calcSmogonMatchup()`.
 *
 * * Note that a memoized callback is returned that requires one argument, `playerMove`.
 *
 * @since 0.1.2
 */
export const useSmogonMatchup = (
  format: string,
  playerPokemon: CalcdexPokemon,
  opponentPokemon: CalcdexPokemon,
  playerKey?: CalcdexPlayerKey,
  field?: CalcdexBattleField,
  settings?: ShowdexCalcdexSettings,
): SmogonMatchupHookCalculator => React.useCallback<SmogonMatchupHookCalculator>((
  playerMove,
) => calcSmogonMatchup(
  format,
  playerPokemon,
  opponentPokemon,
  playerMove,
  playerKey,
  field,
  settings,
), [
  field,
  format,
  opponentPokemon,
  playerKey,
  playerPokemon,
  settings,
]);
