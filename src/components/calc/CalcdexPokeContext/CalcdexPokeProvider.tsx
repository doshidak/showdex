import * as React from 'react';
import { type CalcdexPlayerKey, CalcdexPlayerKeys as AllPlayerKeys } from '@showdex/interfaces/calc';
import { useSmogonMatchup } from '@showdex/utils/calc';
import { upsizeArray } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import {
  findMatchingUsage,
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

  const presets = React.useMemo(() => {
    if (!playerPokemon?.speciesForme) {
      return [];
    }

    const output = [...(playerPokemon?.presets || []), ...pokemonSheets];
    const smogonPresets = [...bundledPresets, ...pokemonPresets];

    if (format?.includes('random')) {
      output.push(...smogonPresets);
      output.sort(presetSorter);

      return output;
    }

    const teambuilderPresets = [...teamPresets, ...boxPresets];

    /**
     * @todo these are out of order af, so you actually don't get the orderings you'd expect below; probably because of
     * the presetSorter() -- but tbh, might be better to just rewrite the preset logic to sort in format "buckets" first,
     * then sort the buckets themselves, i.e., don't do both at the same time cause who cares about efficiency if it
     * doesn't even display properly LOL
     */
    switch (settings?.prioritizePresetSource) {
      case 'storage': {
        output.push(...teambuilderPresets, ...smogonPresets, ...usages);

        break;
      }

      case 'usage': {
        output.push(...usages, ...smogonPresets, ...teambuilderPresets);

        break;
      }

      case 'smogon':
      default: {
        // for instance, you'd expect smogon -> usages -> teambuilder, but what you actually get is: usages -> teambuilder -> smogon
        // ...actually, you get'd this for any of the prioritizePresetSource values LOL
        output.push(...smogonPresets, ...usages, ...teambuilderPresets);

        break;
      }
    }

    output.sort(presetSorter);

    return output;
  }, [
    boxPresets,
    bundledPresets,
    format,
    playerPokemon?.presets,
    playerPokemon?.speciesForme,
    pokemonPresets,
    pokemonSheets,
    presetSorter,
    settings?.prioritizePresetSource,
    teamPresets,
    usages,
  ]);

  const usage = React.useMemo(() => findMatchingUsage(usages, playerPokemon), [playerPokemon, usages]);
  const abilityUsageFinder = React.useMemo(() => usageAltPercentFinder(usage?.altAbilities, true), [usage?.altAbilities]);
  const abilityUsageSorter = React.useMemo(() => usageAltPercentSorter(abilityUsageFinder), [abilityUsageFinder]);
  const itemUsageFinder = React.useMemo(() => usageAltPercentFinder(usage?.altItems, true), [usage?.altItems]);
  const itemUsageSorter = React.useMemo(() => usageAltPercentSorter(itemUsageFinder), [itemUsageFinder]);
  const moveUsageFinder = React.useMemo(() => usageAltPercentFinder(usage?.altMoves, true), [usage?.altMoves]);
  const moveUsageSorter = React.useMemo(() => usageAltPercentSorter(moveUsageFinder), [moveUsageFinder]);

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
