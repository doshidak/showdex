import * as React from 'react';
import { type GameType, type MoveName } from '@smogon/calc';
import { type ShowdexCalcdexSettings } from '@showdex/interfaces/app';
import { type CalcdexBattleField, type CalcdexPlayer, type CalcdexPokemon } from '@showdex/interfaces/calc';
import { type CalcdexMatchupResult, calcSmogonMatchup } from './calcSmogonMatchup';

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
  gameType: GameType,
  playerPokemon: CalcdexPokemon,
  opponentPokemon: CalcdexPokemon,
  player?: CalcdexPlayer,
  opponent?: CalcdexPlayer,
  allPlayers?: CalcdexPlayer[],
  field?: CalcdexBattleField,
  settings?: ShowdexCalcdexSettings,
): SmogonMatchupHookCalculator => React.useCallback<SmogonMatchupHookCalculator>((
  playerMove,
) => calcSmogonMatchup(
  format,
  gameType,
  playerPokemon,
  opponentPokemon,
  playerMove,
  player,
  opponent,
  allPlayers,
  field,
  settings,
), [
  allPlayers,
  field,
  format,
  gameType,
  opponent,
  opponentPokemon,
  player,
  playerPokemon,
  settings,
]);
