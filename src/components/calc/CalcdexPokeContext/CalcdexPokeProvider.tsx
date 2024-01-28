import * as React from 'react';
import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { useSmogonMatchup } from '@showdex/utils/calc';
import { upsizeArray } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import {
  flattenAlts,
  selectPokemonPresets,
  sortPresetsByFormat,
  usageAltPercentFinder,
  usageAltPercentSorter,
} from '@showdex/utils/presets';
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

// const l = logger('@showdex/components/calc/CalcdexPokeProvider');

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
    format,
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
    formatLabelMap,
    formeUsages,
    formeUsageFinder,
    formeUsageSorter,
  } = battlePresets;

  const pokemonSheets = React.useMemo(() => (playerPokemon?.speciesForme ? selectPokemonPresets(
    sheets,
    playerPokemon,
    {
      format,
      source: 'sheet',
      select: 'any',
    },
  ) : []), [
    format,
    playerPokemon,
    sheets,
  ]);

  const usages = React.useMemo(() => (playerPokemon?.speciesForme ? selectPokemonPresets(
    allUsages,
    playerPokemon,
    {
      format,
      source: 'usage',
      select: 'any',
    },
  ) : []), [
    allUsages,
    format,
    playerPokemon,
  ]);

  // note: in Randoms, teambuilder presets won't exist in allPresets[]
  const teamPresets = React.useMemo(() => (playerPokemon?.speciesForme ? selectPokemonPresets(
    allPresets,
    playerPokemon,
    {
      format,
      source: 'storage',
      select: 'any',
    },
  ) : []), [
    allPresets,
    format,
    playerPokemon,
  ]);

  const boxPresets = React.useMemo(() => (playerPokemon?.speciesForme ? selectPokemonPresets(
    allPresets,
    playerPokemon,
    {
      format,
      source: 'storage-box',
      select: 'any',
    },
  ) : []), [
    allPresets,
    format,
    playerPokemon,
  ]);

  const bundledPresets = React.useMemo(() => (playerPokemon?.speciesForme ? selectPokemonPresets(
    allPresets,
    playerPokemon,
    {
      format,
      source: 'bundle',
      select: 'any',
    },
  ) : []), [
    allPresets,
    format,
    playerPokemon,
  ]);

  const pokemonPresets = React.useMemo(() => (playerPokemon?.speciesForme ? selectPokemonPresets(
    allPresets,
    playerPokemon,
    {
      format,
      source: 'smogon',
      select: 'any',
    },
  ) : []), [
    allPresets,
    format,
    playerPokemon,
  ]);

  const presetSorter = React.useMemo(
    () => sortPresetsByFormat(format, formatLabelMap),
    [format, formatLabelMap],
  );

  const presets = React.useMemo(() => (playerPokemon?.speciesForme ? [
    ...(playerPokemon?.presets || []),
    ...pokemonSheets,
    ...(format?.includes('random') ? [] : usages),
    ...teamPresets,
    ...boxPresets,
    ...bundledPresets,
    ...pokemonPresets,
  ].sort(presetSorter) : []), [
    boxPresets,
    bundledPresets,
    format,
    // formatLabelMap,
    playerPokemon?.presets,
    playerPokemon?.speciesForme,
    pokemonPresets,
    pokemonSheets,
    presetSorter,
    teamPresets,
    usages,
  ]);

  const usage = React.useMemo(() => {
    if (!usages?.length) {
      return null;
    }

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

  const abilityUsageFinder = React.useMemo(
    () => usageAltPercentFinder(usage?.altAbilities, true),
    [usage?.altAbilities],
  );

  const abilityUsageSorter = React.useMemo(
    () => usageAltPercentSorter(abilityUsageFinder),
    [abilityUsageFinder],
  );

  const itemUsageFinder = React.useMemo(
    () => usageAltPercentFinder(usage?.altItems, true),
    [usage?.altItems],
  );

  const itemUsageSorter = React.useMemo(
    () => usageAltPercentSorter(itemUsageFinder),
    [itemUsageFinder],
  );

  const moveUsageFinder = React.useMemo(
    () => usageAltPercentFinder(usage?.altMoves, true),
    [usage?.altMoves],
  );

  const moveUsageSorter = React.useMemo(
    () => usageAltPercentSorter(moveUsageFinder),
    [moveUsageFinder],
  );

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
    ...ctx,

    playerKey,
    player,
    playerPokemon,
    opponent,
    opponentPokemon,

    presetsLoading,
    allUsages,
    presets,
    usages,
    usage,
    abilityUsageFinder,
    abilityUsageSorter,
    itemUsageFinder,
    itemUsageSorter,
    moveUsageFinder,
    moveUsageSorter,
    formatLabelMap,
    formeUsages,
    formeUsageFinder,
    formeUsageSorter,

    matchups,
  }), [
    abilityUsageFinder,
    abilityUsageSorter,
    allUsages,
    ctx,
    formatLabelMap,
    formeUsageFinder,
    formeUsages,
    formeUsageSorter,
    itemUsageFinder,
    itemUsageSorter,
    matchups,
    moveUsageFinder,
    moveUsageSorter,
    opponent,
    opponentPokemon,
    player,
    playerKey,
    playerPokemon,
    presets,
    presetsLoading,
    usage,
    usages,
  ]);

  return (
    <CalcdexPokeContext.Provider value={value}>
      {children}
    </CalcdexPokeContext.Provider>
  );
};
