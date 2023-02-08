import * as React from 'react';
import { AllPlayerKeys } from '@showdex/consts/battle';
import {
  buildAbilityOptions,
  buildItemOptions,
  buildMoveOptions,
  buildPresetOptions,
  detectUsageAlt,
  flattenAlt,
  flattenAlts,
  hasMegaForme,
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

const baseScope = '@showdex/pages/Calcdex/CalcdexPokeProvider';

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
  const currentPreset = (playerPokemon?.presetId ? [
    ...presets,
    ...((!!playerPokemon.presets?.length && playerPokemon.presets) || []),
  ] : []).find((p) => !!p?.calcdexId && p.calcdexId === playerPokemon.presetId);

  const usage = (usages?.length === 1 && usages[0])
    || (!!currentPreset?.name && usages?.find((p) => p?.source === 'usage' && p.name?.includes(currentPreset.name)))
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
    scope,
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
      presetId: preset.calcdexId,

      // update (2023/02/02): specifying empty arrays for the alt properties to clear them for
      // the new preset (don't want alts from a previous set to persist if none are defined)
      altTeraTypes: [],
      altAbilities: [],
      dirtyAbility: preset.ability,
      nature: preset.nature,
      altItems: [],
      dirtyItem: preset.item,
      altMoves: [],
      moves: preset.moves,

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

    // update (2023/02/02): for Mega Pokemon, we may need to remove the dirtyItem set from the preset
    // if the preset was for its non-Mega forme (since they could have different abilities)
    if (hasMegaForme(playerPokemon.speciesForme) && !hasMegaForme(preset.speciesForme)) {
      delete mutation.dirtyAbility;
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
      // update the teraType to the most likely one after sorting
      mutation.altTeraTypes = teraTypesUsage.sort(sortUsageAlts);
      [mutation.teraType] = mutation.altTeraTypes[0] as CalcdexPokemonUsageAlt<Showdown.TypeName>;
    } else if (altTeraTypes?.[0]) {
      // apply the first teraType from the preset's teraTypes
      [mutation.teraType] = flattenAlts(altTeraTypes);
      mutation.altTeraTypes = altTeraTypes;
    }

    // don't apply the dirtyAbility/dirtyItem if we're applying the Pokemon's first preset and
    // their abilility/item was already revealed or it matches the Pokemon's revealed ability/item
    // const clearDirtyAbility = (!playerPokemon.presetId && playerPokemon.ability)
    //   || playerPokemon.ability === preset.ability;

    // update (2022/10/07): don't apply the dirtyAbility/dirtyItem at all if their non-dirty
    // counterparts are revealed already
    // const clearDirtyAbility = !!playerPokemon.ability && !playerPokemon.transformedForme;

    // update (2023/02/07): always clear the dirtyAbility from the preset if its actual ability
    // has been already revealed (even when transformed)
    const clearDirtyAbility = !!playerPokemon.ability;

    if (clearDirtyAbility) {
      mutation.dirtyAbility = null;
    }

    // const clearDirtyItem = (!playerPokemon.presetId && playerPokemon.item && playerPokemon.item !== '(exists)')
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
    // update (2023/02/03): merging all mutations to provide altMoves[] (for Hidden Power moves)
    mutation.moves = playerPokemon.transformedForme && playerPokemon.transformedMoves?.length
      ? [...playerPokemon.transformedMoves]
      : mergeRevealedMoves({ ...playerPokemon, ...mutation });

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
        || (!legacy && !Object.values(mutation.evs || {}).reduce((sum, val) => sum + (val || 0), 0))
    );

    if (forceShowGenetics) {
      mutation.showGenetics = true;
    }

    // spreadStats will be recalculated in `updatePokemon()` from `CalcdexProvider`
    updatePokemon(
      playerKey,
      mutation,
      `${baseScope}:applyPreset() via ${scope || '(anon)'}`,
    );
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
  const appliedTransformedPreset = React.useRef(false);

  // automatically apply the first preset if the Pokemon has no/invalid preset
  // (invalid presets could be due to the forme changing, so new presets are loaded in)
  React.useEffect(() => {
    // if (!playerPokemon?.calcdexId || !playerPokemon.autoPreset || presetsLoading) {
    if (!playerPokemon?.calcdexId || presetsLoading) {
      return;
    }

    // used for debugging purposes only
    const scope = `${baseScope}:React.useEffect()`;

    if (!playerPokemon.transformedForme && appliedTransformedPreset.current) {
      appliedTransformedPreset.current = false;
    }

    // const existingPreset = playerPokemon.presetId && presets?.length
    //   ? presets.find((p) => p?.calcdexId === playerPokemon.presetId && (
    //     !playerPokemon.transformedForme
    //       || p.source !== 'server' // i.e., the 'Yours' preset
    //       || appliedTransformedPreset.current
    //   ))
    //   : null;

    const existingPreset = (
      !!playerPokemon.presetId
        && !!presets?.length
        && presets.find((p) => p?.calcdexId === playerPokemon.presetId)
    ) || null;

    const shouldAutoPreset = !!presets?.length
      && (
        // auto-preset if one hasn't been found or no longer exists in `presets`
        !existingPreset?.calcdexId
          // allow another round of auto-presetting if they are transformed
          || (!!playerPokemon.transformedForme && !appliedTransformedPreset.current)
      )
      && (
        !existingPreset?.source
          // don't auto-preset if we already know the exact preset or usage is currently applied
          || !['server', 'sheet', 'usage'].includes(existingPreset.source)
      );

    if (!shouldAutoPreset) {
      if (!existingPreset?.calcdexId && !playerPokemon.showGenetics) {
        updatePokemon(playerKey, {
          calcdexId: playerPokemon.calcdexId,
          showGenetics: true,
        }, scope);
      }

      return;
    }

    const {
      downloadUsageStats,
      prioritizeUsageStats,
    } = settings || {};

    // Setup the initial preset.
    // If we are playing random battles, grab the appropriate randombattles set.
    let initialPreset = presets[0]; // presets[0] as the default case

    // if the Pokemon is transformed (very special case), we'll check if the "Yours" preset is applied,
    // which only occurs for serverSourced CalcdexPokemon, in which case we need to apply the second preset... lol
    // kinda looks like: [{ name: 'Yours', ... }, { name: 'Some Set of a Transformed Pokemon', ... }, ...]
    if (playerPokemon.transformedForme) {
      // [, initialPreset] = presets; // readability 100; fancy JS way of writing initialPresets = presets[1]
      const nonServerPreset = presets.find((p) => p.source !== 'server');

      if (nonServerPreset) {
        initialPreset = nonServerPreset;
      }

      // update (2023/02/07): if we don't set this, this effect will infinite loop, causing Showdown to hang indefinitely
      appliedTransformedPreset.current = true;
    }

    if (downloadUsageStats && prioritizeUsageStats) {
      // If we aren't in a random battle, check if we should prioritize
      // the showdown usage stats.
      // note: 'usage'-sourced sets won't exist in `presets` for Randoms formats
      const usagePreset = presets.find((p) => p?.source === 'usage' && (
        !format
          || format.includes(p.format)
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
          || (!legacy && !Object.values(playerPokemon.evs || {}).reduce((sum, val) => sum + (val || 0), 0))
      );

      if (forceShowGenetics) {
        updatePokemon(playerKey, {
          calcdexId: playerPokemon.calcdexId,
          showGenetics: true,
        }, scope);
      }

      return;
    }

    applyPreset(initialPreset, null, scope);
  }, [
    applyPreset,
    format,
    legacy,
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

    updatePokemon: (pokemon, scope) => updatePokemon(playerKey, {
      ...pokemon,
      calcdexId: playerPokemon?.calcdexId,
    }, scope || `${baseScope}:updatePokemon()`),

    updateField,
    setActiveIndex: (index, scope) => setActiveIndex(playerKey, index, scope || `${baseScope}:setActiveIndex()`),
    setActiveIndices: (indices, scope) => setActiveIndices(playerKey, indices, scope || `${baseScope}:setActiveIndices()`),
    setSelectionIndex: (index, scope) => setSelectionIndex(playerKey, index, scope || `${baseScope}:setSelectionIndex()`),
    setAutoSelect: (autoSelect, scope) => setAutoSelect(playerKey, autoSelect, scope || `${baseScope}:setAutoSelect()`),
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
