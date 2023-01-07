import * as React from 'react';
import {
  buildAbilityOptions,
  buildItemOptions,
  buildMoveOptions,
  buildPresetOptions,
  detectUsageAlt,
  flattenAlt,
  flattenAlts,
  mergeRevealedMoves,
  usageAltPercentFinder,
  usageAltPercentSorter,
} from '@showdex/utils/battle';
import { upsizeArray } from '@showdex/utils/core';
import { sortUsageAlts } from '@showdex/utils/redux';
import type {
  // CalcdexBattleField,
  CalcdexPlayerKey,
  CalcdexPokemonUsageAlt,
} from '@showdex/redux/store';
import type { CalcdexPokemonMutation } from './CalcdexContext';
import type { CalcdexPokeContextConsumables } from './CalcdexPokeContext';
import { CalcdexPokeContext } from './CalcdexPokeContext';
import { useCalcdexContext } from './CalcdexProvider';
import { usePresets } from './usePresets';
import { useSmogonMatchup } from './useSmogonMatchup';
import { useUsageAltSorter } from './useUsageAltSorter';

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
  children?: React.ReactNode;
}

export const CalcdexPokeProvider = ({
  playerKey,
  movesCount = 4,
  children,
}: CalcdexPokeProviderProps): JSX.Element => {
  const ctx = useCalcdexContext();

  const {
    state,
    settings,
    updatePokemon,
    updateField,
    setActiveIndex,
    setActiveIndices,
    setSelectionIndex,
    setAutoSelect,
  } = ctx;

  const {
    gen,
    format,
    legacy,
    field,
  } = state;

  // update: don't flip the attackerSide/defenderSide since it's already being flipped in createSmogonField()
  // const field = React.useMemo<CalcdexBattleField>(() => ({
  //   ...fieldFromState,
  //   attackerSide: playerKey === 'p1' ? fieldFromState?.attackerSide : fieldFromState?.defenderSide,
  //   defenderSide: playerKey === 'p1' ? fieldFromState?.defenderSide : fieldFromState?.attackerSide,
  // }), [
  //   fieldFromState,
  //   playerKey,
  // ]);

  const opponentKey: CalcdexPlayerKey = playerKey === 'p1' ? 'p2' : 'p1';
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

  // fetch presets and usage stats for the player's currently selected Pokemon
  const {
    loading: presetsLoading,
    presets,
    usages,
  } = usePresets({
    format,
    pokemon: playerPokemon,
  });

  // note: `preset` is confusingly the `calcdexId` of the preset
  // (there's a todo for `preset` to update its name lol)
  const appliedPreset = (playerPokemon?.preset ? [
    ...presets,
    ...((!!playerPokemon.presets?.length && playerPokemon.presets) || []),
  ] : []).find((p) => !!p?.calcdexId && p.calcdexId === playerPokemon.preset);

  const usage = (usages?.length === 1 && usages[0])
    || (!!appliedPreset?.name && usages?.find((p) => p?.source === 'usage' && p.name?.includes(appliedPreset.name)))
    || usages?.find((p) => p?.source === 'usage');

  // build dropdown options
  const abilityOptions = React.useMemo(() => (legacy ? [] : buildAbilityOptions(
    format,
    playerPokemon,
    usage,
    settings?.showAllOptions,
  )), [
    format,
    legacy,
    playerPokemon,
    settings,
    usage,
  ]);

  const itemOptions = React.useMemo(() => (gen === 1 ? [] : buildItemOptions(
    format,
    playerPokemon,
    usage,
    // settings?.showAllOptions,
    true, // fuck it w/e lol (instead of using settings.showAllOptions)
  )), [
    format,
    gen,
    // legacy,
    playerPokemon,
    // settings,
    usage,
  ]);

  const moveOptions = React.useMemo(() => buildMoveOptions(
    format,
    playerPokemon,
    usage,
    settings?.showAllOptions,
  ), [
    format,
    playerPokemon,
    settings,
    usage,
  ]);

  const presetOptions = React.useMemo(() => buildPresetOptions(
    presets,
    usages,
  ), [
    presets,
    usages,
  ]);

  // build usage sorters
  const sortAbilitiesByUsage = useUsageAltSorter(usage?.altAbilities);
  const sortItemsByUsage = useUsageAltSorter(usage?.altItems);
  const sortMovesByUsage = useUsageAltSorter(usage?.altMoves);

  // handle applying presets
  const defaultIv = legacy ? 30 : 31;

  const applyPreset = React.useCallback<CalcdexPokeContextConsumables['applyPreset']>((
    presetOrId,
    additionalMutations,
  ) => {
    const preset = typeof presetOrId === 'string'
      ? presets.find((p) => p?.calcdexId === presetOrId)
      : presetOrId;

    if (!preset?.calcdexId) {
      return;
    }

    const mutation: CalcdexPokemonMutation = {
      ...additionalMutations,

      calcdexId: playerPokemon?.calcdexId,
      preset: preset.calcdexId,

      moves: preset.moves,
      nature: preset.nature,
      dirtyAbility: preset.ability,
      dirtyItem: preset.item,

      ivs: {
        hp: preset?.ivs?.hp ?? defaultIv,
        atk: preset?.ivs?.atk ?? defaultIv,
        def: preset?.ivs?.def ?? defaultIv,
        spa: preset?.ivs?.spa ?? defaultIv,
        spd: preset?.ivs?.spd ?? defaultIv,
        spe: preset?.ivs?.spe ?? defaultIv,
      },

      // not specifying the 0's may cause any unspecified EVs to remain!
      evs: {
        ...(!legacy && {
          hp: preset.evs?.hp || 0,
          atk: preset.evs?.atk || 0,
          def: preset.evs?.def || 0,
          spa: preset.evs?.spa || 0,
          spd: preset.evs?.spd || 0,
          spe: preset.evs?.spe || 0,
        }),
      },
    };

    if (!mutation.calcdexId) {
      return;
    }

    // update (2023/01/06): may need to grab an updated usage for the preset we're trying to switch to
    // (normally only an issue in Gen 9 Randoms with their role system, which has multiple usage presets)
    const detectedUsage = (usages?.length === 1 && usages[0])
      || (!!preset.name && usages?.find((u) => u?.source === 'usage' && u.name?.includes(preset.name)))
      || null;

    const altTeraTypes = preset.teraTypes?.filter((t) => !!t && flattenAlt(t) !== '???');

    // check if we have Tera typing usage data
    const teraTypesUsage = detectedUsage?.teraTypes?.filter(detectUsageAlt);

    if (teraTypesUsage?.length) {
      // mutation.altTeraTypes = flatAltTeraTypes
      //   .map((t) => [t, teraTypesUsage.find((u) => u[0] === t)?.[1] || 0] as CalcdexPokemonUsageAlt<Showdown.TypeName>)
      //   .sort(sortUsageAlts);
      mutation.altTeraTypes = teraTypesUsage.sort(sortUsageAlts);

      // update the teraType to the most likely one after sorting
      [mutation.teraType] = mutation.altTeraTypes[0] as CalcdexPokemonUsageAlt<Showdown.TypeName>;
    } else if (altTeraTypes?.[0]) {
      // apply the first teraType from the preset's teraTypes
      [mutation.teraType] = flattenAlts(altTeraTypes);
      mutation.altTeraTypes = altTeraTypes;
    }

    // don't apply the dirtyAbility/dirtyItem if we're applying the Pokemon's first preset and
    // their abilility/item was already revealed or it matches the Pokemon's revealed ability/item
    // const clearDirtyAbility = (!playerPokemon.preset && playerPokemon.ability)
    //   || playerPokemon.ability === preset.ability;

    // update (2022/10/07): don't apply the dirtyAbility/dirtyItem at all if their non-dirty
    // counterparts are revealed already
    const clearDirtyAbility = !!playerPokemon.ability && !playerPokemon.transformedForme;

    if (clearDirtyAbility) {
      mutation.dirtyAbility = null;
    }

    // const clearDirtyItem = (!playerPokemon.preset && playerPokemon.item && playerPokemon.item !== '(exists)')
    //   || playerPokemon.item === preset.item
    //   || (!playerPokemon.item && playerPokemon.prevItem && playerPokemon.prevItemEffect);
    const clearDirtyItem = (playerPokemon.item && playerPokemon.item !== '(exists)')
      || (playerPokemon.prevItem && playerPokemon.prevItemEffect);

    if (clearDirtyItem) {
      mutation.dirtyItem = null;
    }

    if (preset.altAbilities?.length) {
      mutation.altAbilities = [...preset.altAbilities];

      // apply the top usage ability (if available)
      const abilityUsageAvailable = detectedUsage?.altAbilities?.length > 1
        && mutation.altAbilities?.length > 1
        && !clearDirtyAbility;

      if (abilityUsageAvailable) {
        // update (2023/01/06): can't actually use sortedAbilitiesByUsage() since it may use usage from a prior set
        // (only a problem in Gen 9 Randoms since there are multiple "usages" due to the role system, so the sorters
        // will be referencing the current role's usage and not the one we're trying to switch to... if that makes sense lol)
        const sorter = usageAltPercentSorter(usageAltPercentFinder(detectedUsage.altAbilities));
        const sortedAbilities = flattenAlts(mutation.altAbilities).sort(sorter);
        const [topAbility] = sortedAbilities;

        if (sortedAbilities.length === mutation.altAbilities.length) {
          mutation.altAbilities = sortedAbilities;
        }

        if (topAbility && mutation.dirtyAbility !== topAbility) {
          mutation.dirtyAbility = topAbility;
        }
      }
    }

    if (preset.altItems?.length) {
      mutation.altItems = [...preset.altItems];

      // apply the top usage item (if available)
      const itemUsageAvailable = detectedUsage?.altItems?.length > 1
        && mutation.altItems?.length > 1
        && !clearDirtyItem;

      if (itemUsageAvailable) {
        const sorter = usageAltPercentSorter(usageAltPercentFinder(detectedUsage.altItems));
        const sortedItems = flattenAlts(mutation.altItems).sort(sorter);
        const [topItem] = sortedItems;

        if (sortedItems.length === mutation.altItems.length) {
          mutation.altItems = sortedItems;
        }

        if (topItem && mutation.dirtyItem !== topItem) {
          mutation.dirtyItem = topItem;
        }
      }
    }

    if (preset.altMoves?.length) {
      mutation.altMoves = [...preset.altMoves];

      // sort the moves by their usage stats (if available) and apply the top 4 moves
      // (otherwise, just apply the moves from the preset)
      const moveUsageAvailable = detectedUsage?.altMoves?.length > 1
        && mutation.altMoves?.length > 1;

      if (moveUsageAvailable) {
        const sorter = usageAltPercentSorter(usageAltPercentFinder(detectedUsage.altMoves));
        const sortedMoves = flattenAlts(mutation.altMoves).sort(sorter);

        if (sortedMoves.length) {
          mutation.altMoves = sortedMoves;

          /**
           * @todo Needs to be updated once we support more than 4 moves.
           */
          mutation.moves = sortedMoves.slice(0, 4);
        }
      }
    }

    // check if we already have revealed moves (typical of spectating or replaying a battle)
    mutation.moves = playerPokemon.transformedForme && playerPokemon.transformedMoves?.length
      ? [...playerPokemon.transformedMoves]
      : mergeRevealedMoves({ ...playerPokemon, moves: mutation.moves });

    // only apply the ability/item (and remove their dirty counterparts) if there's only
    // 1 possible ability/item in the pool (and their actual ability/item hasn't been revealed)
    // update (2022/10/06): nvm on the setting the actual ability/item cause it's screwy when switching formes,
    // so opting to use their dirty counterparts instead lol
    // if (preset.format?.includes('random')) {
    //   // apply the Gmax forme if that's all we have random sets for (cause they're most likely Gmax)
    //   if (preset.speciesForme.endsWith('-Gmax')) {
    //     mutation.speciesForme = preset.speciesForme;
    //   }
    //
    //   if (!clearDirtyAbility && mutation.altAbilities?.length === 1) {
    //     [mutation.dirtyAbility] = flattenAlts(mutation.altAbilities);
    //     // mutation.dirtyAbility = null;
    //   }
    //
    //   if (!playerPokemon.item && !playerPokemon.prevItem && mutation.altItems?.length === 1) {
    //     [mutation.dirtyItem] = flattenAlts(mutation.altItems);
    //     // mutation.dirtyItem = null;
    //   }
    // }

    // carefully apply the spread if Pokemon is transformed and a spread was already present prior
    const shouldTransformSpread = !!playerPokemon.transformedForme
      && !!playerPokemon.nature
      && !!Object.values({ ...playerPokemon.ivs, ...playerPokemon.evs }).filter(Boolean).length;

    if (shouldTransformSpread) {
      // since transforms inherit the exact stats of the target Pokemon (except for HP),
      // we actually need to copy the nature from the preset
      // delete mutation.nature;

      // we'll keep the original HP EVs/IVs (even if possibly illegal) since the max HP
      // of a transformed Pokemon is preserved, which is based off of the HP's base, IV & EV
      mutation.ivs.hp = playerPokemon.ivs.hp;
      mutation.evs.hp = playerPokemon.evs.hp;

      // if the Pokemon has an item set by a previous preset, ignore this preset's item
      if (playerPokemon.dirtyItem || playerPokemon.item) {
        delete mutation.dirtyItem;
      }
    }

    // only remove the dirtyAbility/dirtyItem from the mutation if they're undefined (but not null)
    // (means that the preset didn't define the ability/item, hence the undefined)
    if (mutation.dirtyAbility === undefined) {
      delete mutation.dirtyAbility;
    }

    if (mutation.dirtyItem === undefined) {
      delete mutation.dirtyItem;
    }

    // apply the defaultShowGenetics setting if the Pokemon is serverSourced
    // update (2022/11/15): defaultShowGenetics is deprecated in favor of lockGeneticsVisibility;
    // showGenetics's initial value is set in syncBattle() when the Pokemon is first init'd into Redux
    // if (playerPokemon.serverSourced) {
    //   mutation.showGenetics = settings?.defaultShowGenetics?.auth;
    // }

    // if the applied preset doesn't have a completed EV/IV spread, forcibly show them
    const forceShowGenetics = !playerPokemon.showGenetics && (
      !Object.values(mutation.ivs || {}).reduce((sum, val) => sum + (val || 0), 0)
        || !Object.values(mutation.evs || {}).reduce((sum, val) => sum + (val || 0), 0)
    );

    if (forceShowGenetics) {
      mutation.showGenetics = true;
    }

    // spreadStats will be recalculated in `updatePokemon()` from `CalcdexProvider`
    updatePokemon(playerKey, mutation);
  }, [
    defaultIv,
    legacy,
    playerKey,
    playerPokemon,
    presets,
    // sortAbilitiesByUsage,
    // sortItemsByUsage,
    // sortMovesByUsage,
    updatePokemon,
    // usage,
    usages,
  ]);

  // this will allow the user to switch back to the "Yours" preset for a transformed Pokemon
  // (using a ref instead of state since we don't want to cause an unnecessary re-render)
  const appliedTransformedPreset = React.useRef<boolean>(false);

  // automatically apply the first preset if the Pokemon has no/invalid preset
  // (invalid presets could be due to the forme changing, so new presets are loaded in)
  React.useEffect(() => {
    // if (!playerPokemon?.calcdexId || !playerPokemon.autoPreset || presetsLoading) {
    if (!playerPokemon?.calcdexId || presetsLoading) {
      return;
    }

    if (!playerPokemon.transformedForme && appliedTransformedPreset.current) {
      appliedTransformedPreset.current = false;
    }

    const existingPreset = playerPokemon.preset && presets?.length
      ? presets.find((p) => p?.calcdexId === playerPokemon.preset && (
        !playerPokemon.transformedForme
          // || formatId(p.name) !== 'yours'
          || p.source !== 'server' // i.e., the 'Yours' preset
          || appliedTransformedPreset.current
      ))
      : null;

    if (existingPreset) {
      return;
    }

    const {
      downloadUsageStats,
      prioritizeUsageStats,
    } = settings || {};

    // Setup the initial preset.
    // If we are playing random battles, grab the appropriate randombattles set.
    let initialPreset = presets[0]; // presets[0] as the default case

    // update (2022/10/27): will always be first preset in randoms
    // if (format.includes('random')) {
    //   initialPreset = presets.find((p) => (
    //     (p.format === format)
    //   ));
    // } else if (downloadUsageStats && prioritizeUsageStats) {

    // if the Pokemon is transformed (very special case), we'll check if the "Yours" preset is applied,
    // which only occurs for serverSourced CalcdexPokemon, in which case we need to apply the second preset... lol
    // kinda looks like: [{ name: 'Yours', ... }, { name: 'Some Set of a Transformed Pokemon', ... }, ...]
    if (playerPokemon.transformedForme && presets[1]) {
      [, initialPreset] = presets; // readability 100
      appliedTransformedPreset.current = true;
    }

    if (downloadUsageStats && prioritizeUsageStats) {
      // If we aren't in a random battle, check if we should prioritize
      // the showdown usage stats.
      // note: 'usage'-sourced sets won't exist in `presets` for Randoms formats
      const usagePreset = presets.find((p) => (
        // (p.format === format?.replace(/^gen\d/, '') && formatId(p.name) === 'showdownusage')
        p?.source === 'usage' && (!format || format.includes(p.format))
      ));

      // only update if we found a Showdown Usage preset for the format
      // (otherwise, no set would apply, despite the Pokemon having sets, albeit from other formats, potentially)
      if (usagePreset) {
        initialPreset = usagePreset;
      }
    }

    if (!initialPreset) {
      // it's likely that the Pokemon has no EVs/IVs set, so show the EVs/IVs if they're hidden
      const forceShowGenetics = !playerPokemon.showGenetics && (
        !Object.values(playerPokemon.ivs || {}).reduce((sum, val) => sum + (val || 0), 0)
          || !Object.values(playerPokemon.evs || {}).reduce((sum, val) => sum + (val || 0), 0)
      );

      if (forceShowGenetics) {
        updatePokemon(playerKey, {
          calcdexId: playerPokemon.calcdexId,
          showGenetics: true,
        });
      }

      return;
    }

    applyPreset(initialPreset);
  }, [
    applyPreset,
    format,
    playerKey,
    playerPokemon,
    presets,
    presetsLoading,
    settings,
    updatePokemon,
  ]);

  // calculate the current matchup
  const calculateMatchup = useSmogonMatchup(
    format,
    playerPokemon,
    opponentPokemon,
    playerKey,
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

  const consumables = React.useMemo<CalcdexPokeContextConsumables>(() => ({
    state,
    settings,

    playerKey,
    player,
    playerPokemon,
    opponent,
    opponentPokemon,
    field,

    presetsLoading,
    presets,
    usages,
    usage,

    abilityOptions,
    itemOptions,
    moveOptions,
    presetOptions,

    matchups,

    sortAbilitiesByUsage,
    sortItemsByUsage,
    sortMovesByUsage,

    applyPreset,

    updatePokemon: (pokemon) => updatePokemon(playerKey, {
      ...pokemon,
      calcdexId: playerPokemon?.calcdexId,
    }),

    updateField,
    setActiveIndex: (index) => setActiveIndex(playerKey, index),
    setActiveIndices: (indices) => setActiveIndices(playerKey, indices),
    setSelectionIndex: (index) => setSelectionIndex(playerKey, index),
    setAutoSelect: (autoSelect) => setAutoSelect(playerKey, autoSelect),
  }), [
    abilityOptions,
    applyPreset,
    field,
    itemOptions,
    matchups,
    moveOptions,
    opponent,
    opponentPokemon,
    player,
    playerKey,
    playerPokemon,
    presetOptions,
    presets,
    presetsLoading,
    setActiveIndex,
    setActiveIndices,
    setAutoSelect,
    setSelectionIndex,
    settings,
    sortAbilitiesByUsage,
    sortItemsByUsage,
    sortMovesByUsage,
    state,
    updateField,
    updatePokemon,
    usage,
    usages,
  ]);

  return (
    <CalcdexPokeContext.Provider value={consumables}>
      {children}
    </CalcdexPokeContext.Provider>
  );
};

export const useCalcdexPokeContext = (): CalcdexPokeContextConsumables => React.useContext(CalcdexPokeContext);
