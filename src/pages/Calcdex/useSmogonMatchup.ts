import * as React from 'react';
import { calcSmogonMatchup } from '@showdex/utils/calc';
import type { Generation, MoveName } from '@pkmn/data';
// import type {
//   Field as SmogonField,
//   Move as SmogonMove,
//   // Pokemon as SmogonPokemon,
// } from '@smogon/calc';
import type { CalcdexBattleField, CalcdexPlayerKey, CalcdexPokemon } from '@showdex/redux/store';
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
  dex: Generation,
  playerPokemon: CalcdexPokemon,
  opponentPokemon: CalcdexPokemon,
  playerKey?: CalcdexPlayerKey,
  field?: CalcdexBattleField,
): SmogonMatchupHookCalculator => React.useCallback<SmogonMatchupHookCalculator>((
  playerMove,
) => calcSmogonMatchup(
  dex,
  playerPokemon,
  opponentPokemon,
  playerMove,
  playerKey,
  field,
), [
  dex,
  playerPokemon,
  opponentPokemon,
  playerKey,
  field,
]);
