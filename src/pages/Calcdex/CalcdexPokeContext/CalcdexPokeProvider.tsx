import * as React from 'react';
import { AllPlayerKeys } from '@showdex/consts/battle';
import { type CalcdexPlayerKey } from '@showdex/redux/store';
import { useSmogonMatchup } from '@showdex/utils/calc';
import { upsizeArray } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { flattenAlts, selectPokemonPresets, sortPresetsByUsage } from '@showdex/utils/presets';
import { CalcdexContext } from '../CalcdexContext';
import { type CalcdexPokeContextValue, CalcdexPokeContext } from './CalcdexPokeContext';

/**
 * Props passable to the `CalcdexPokeProvider` for initializing the Context for a specific Pokemon.
 *
 * @since 1.1.1
 */
export interface CalcdexPokeProviderProps {
  /**
   * Player that the Context will be attached to.
   *
   * @example 'p1'
   * @since 1.1.1
   */
  playerKey: CalcdexPlayerKey;

  /**
   * Number of moves to calculate matchups for.
   *
   * @default 4
   * @since 1.1.1
   */
  movesCount?: number;

  /**
   * Children of the Context for a specific Pokemon, of which any can be a Context Consumer.
   *
   * @since 1.1.1
   */
  children: React.ReactNode;
}

// const l = logger('@showdex/pages/Calcdex/CalcdexPokeProvider');

export const CalcdexPokeProvider = ({
  playerKey,
  movesCount = 4,
  children,
}: CalcdexPokeProviderProps): JSX.Element => {
  const ctx = React.useContext(CalcdexContext);

  const {
    state,
    settings,
    presets: battlePresets,
  } = ctx;

  const {
    // gen,
    format,
    // legacy,
    playerKey: topKey,
    opponentKey: bottomKey,
    field,
    sheets,
  } = state;

  // update (2023/07/28): oopsies ... forgot to update this for FFA :o
  const opponentKey = React.useMemo(
    () => (playerKey === topKey ? bottomKey : topKey),
    [bottomKey, playerKey, topKey],
  );

  const player = React.useMemo(() => state[playerKey] || {}, [playerKey, state]);
  const opponent = React.useMemo(() => state[opponentKey] || {}, [opponentKey, state]);

  const {
    pokemon: playerParty,
    selectionIndex: playerIndex,
  } = player;

  const {
    pokemon: opponentParty,
    selectionIndex: opponentIndex,
  } = opponent;

  const playerPokemon = playerParty?.[playerIndex];
  const opponentPokemon = opponentParty?.[opponentIndex];

  const {
    loading: presetsLoading,
    presets: allPresets,
    usages: allUsages,
  } = battlePresets;

  const pokemonSheets = React.useMemo(() => selectPokemonPresets(
    sheets,
    playerPokemon,
    {
      format,
      source: 'sheet',
      select: 'any',
    },
  ), [
    format,
    playerPokemon,
    sheets,
  ]);

  const usages = React.useMemo(() => selectPokemonPresets(
    allUsages,
    playerPokemon,
    {
      format,
      source: 'usage',
      select: 'any',
    },
  ), [
    allUsages,
    format,
    playerPokemon,
  ]);

  const pokemonPresets = React.useMemo(() => selectPokemonPresets(
    allPresets,
    playerPokemon,
    {
      format,
      source: 'smogon',
      select: 'any',
    },
  ).sort(sortPresetsByUsage(usages)), [
    allPresets,
    format,
    playerPokemon,
    usages,
  ]);

  const presets = React.useMemo(() => [
    ...(playerPokemon?.presets || []),
    ...pokemonSheets,
    ...(format?.includes('random') ? [] : usages),
    ...pokemonPresets,
  ], [
    format,
    playerPokemon?.presets,
    pokemonPresets,
    pokemonSheets,
    usages,
  ]);

  const usage = React.useMemo(() => {
    if (usages.length === 1) {
      return usages[0];
    }

    const moves = playerPokemon?.altMoves?.length
      ? flattenAlts(playerPokemon.altMoves)
      : playerPokemon?.moves;

    if (!moves?.length) {
      return usages[0];
    }

    return usages.find((u) => {
      const movePool = flattenAlts(u.altMoves);

      return moves.every((move) => movePool.includes(move));
    });
  }, [
    playerPokemon?.altMoves,
    playerPokemon?.moves,
    usages,
  ]);

  // calculate the current matchup
  const calculateMatchup = useSmogonMatchup(
    format,
    state?.gameType,
    playerPokemon,
    opponentPokemon,
    player,
    opponent,
    AllPlayerKeys.filter((k) => state[k]?.active).map((k) => state[k]),
    field,
    settings,
  );

  const matchups = React.useMemo(() => upsizeArray(
    playerPokemon?.moves || [],
    movesCount,
    null,
    true,
  ).map((moveName) => calculateMatchup?.(moveName) || null), [
    calculateMatchup,
    movesCount,
    playerPokemon,
  ]);

  const value = React.useMemo<CalcdexPokeContextValue>(() => ({
    state,
    settings,

    playerKey,
    player,
    playerPokemon,
    opponent,
    opponentPokemon,

    presetsLoading,
    presets,
    usages,
    usage,

    matchups,
  }), [
    matchups,
    opponent,
    opponentPokemon,
    player,
    playerKey,
    playerPokemon,
    presets,
    presetsLoading,
    settings,
    state,
    usage,
    usages,
  ]);

  return (
    <CalcdexPokeContext.Provider value={value}>
      {children}
    </CalcdexPokeContext.Provider>
  );
};
