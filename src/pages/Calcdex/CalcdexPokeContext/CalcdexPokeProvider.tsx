import * as React from 'react';
import { AllPlayerKeys } from '@showdex/consts/battle';
import { type CalcdexPlayerKey } from '@showdex/redux/store';
import { useSmogonMatchup } from '@showdex/utils/calc';
import { upsizeArray } from '@showdex/utils/core';
import {
  appliedPreset,
  applyPreset,
  usePresets,
  useUsageAltSorter,
} from '@showdex/utils/presets';
import {
  buildAbilityOptions,
  buildItemOptions,
  buildMoveOptions,
  buildPresetOptions,
} from '@showdex/utils/ui';
import { useCalcdexContext } from '../CalcdexContext';
import { type CalcdexPokeContextConsumables, CalcdexPokeContext } from './CalcdexPokeContext';

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
    playerKey: topKey,
    opponentKey: bottomKey,
    field,
  } = state;

  // update (2023/07/28): oopsies ... forgot to update this for FFA :o
  const opponentKey: CalcdexPlayerKey = playerKey === topKey ? bottomKey : topKey;
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
  const applyPresetCallback = React.useCallback<CalcdexPokeContextConsumables['applyPreset']>((
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

    if (appliedPreset(format, playerPokemon, preset)) {
      if (playerPokemon.presetId !== preset.calcdexId) {
        updatePokemon(playerKey, {
          ...additionalMutations,
          calcdexId: playerPokemon.calcdexId,
          presetId: preset.calcdexId,
        }, scope || `${baseScope}:applyPreset()`);
      }

      return;
    }

    // update (2023/01/06): may need to grab an updated usage for the preset we're trying to switch to
    // (normally only an issue in Gen 9 Randoms with their role system, which has multiple usage presets)
    const detectedUsage = (usages?.length === 1 && usages[0])
      || (!!preset.name && usages?.find((u) => u?.source === 'usage' && u.name?.includes(preset.name)))
      || null;

    // spreadStats will be recalculated in `updatePokemon()` from `CalcdexProvider`
    updatePokemon(playerKey, {
      ...additionalMutations,
      ...applyPreset(format, playerPokemon, preset, detectedUsage),
      calcdexId: playerPokemon.calcdexId, // applyPreset() provides this, but just in case lol
    }, `${baseScope}:applyPreset() via ${scope || '(anon)'}`);
  }, [
    format,
    playerKey,
    playerPokemon,
    presets,
    updatePokemon,
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

    applyPresetCallback(initialPreset, null, scope);
  }, [
    applyPresetCallback,
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

    applyPreset: applyPresetCallback,

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
    applyPresetCallback,
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
