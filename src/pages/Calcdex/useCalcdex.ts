import * as React from 'react';
import { syncBattle } from '@showdex/redux/actions';
import {
  calcdexSlice,
  useCalcdexBattleState,
  useCalcdexSettings,
  useDispatch,
} from '@showdex/redux/store';
import { sanitizeField } from '@showdex/utils/battle';
import { logger } from '@showdex/utils/debug';
import { dehydrateCalcdex } from '@showdex/utils/redux';
import type { GenerationNum } from '@smogon/calc';
import type {
  CalcdexBattleField,
  CalcdexBattleState,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from '@showdex/redux/store';

export interface CalcdexHookOptions {
  battle?: Showdown.Battle;
  battleId?: string;
}

export interface CalcdexHookInterface {
  state: CalcdexBattleState;
  renderAsOverlay: boolean;
  shouldRender: boolean;

  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: DeepPartial<CalcdexPokemon>) => void;
  updateField: (field: DeepPartial<CalcdexBattleField>) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, activeIndex: number) => void;
  setSelectionIndex: (playerKey: CalcdexPlayerKey, selectionIndex: number) => void;
  setAutoSelect: (playerKey: CalcdexPlayerKey, autoSelect: boolean) => void;
}

const l = logger('@showdex/pages/Calcdex/useCalcdex');

// we're using the `Dex` from `window.Dex` that the Showdown client uses
// const gens = new Generations(($.extend(true, PkmnDex, Dex) as unknown) as ModdedDex);
// const gens = new Generations(PkmnDex);

export const useCalcdex = ({
  battle,
  battleId: manualBattleId,
}: CalcdexHookOptions = {}): CalcdexHookInterface => {
  const battleId = battle?.id || manualBattleId;

  const settings = useCalcdexSettings();
  const battleState = useCalcdexBattleState(battleId);
  const dispatch = useDispatch();

  l.debug(
    battleId || '(missing battle.id)',
    '\n', battleState?.p1?.name || '(p1)', 'vs', battleState?.p2?.name || '(p2)',
    '\n', 'battle', battle,
    '\n', 'battleState', battleState, __DEV__ && { dehydrated: dehydrateCalcdex(battleState) },
  );

  // determine if this Calcdex is set up by the bootstrapper to open as an overlay
  const renderAsOverlay = !!settings?.openAs
    // && settings.openAs === 'overlay' // bad cause user can change the setting post-bootstrap :o
    && !battle?.calcdexRoom // shouldn't be present in overlay mode
    && typeof battle?.calcdexOverlayVisible === 'boolean'; // should've been set by the bootstrapper

  // determine if we should render the Calcdex
  const shouldRender = !battle?.calcdexDestroyed
    && (!renderAsOverlay || settings?.preserveRenderStates || battle?.calcdexOverlayVisible);

  // handles `battle` changes
  React.useEffect(() => {
    if (!battle?.id) {
      return;
    }

    l.debug(
      'Received battle update; determining sync changes...',
      '\n', 'battle.id', battle.id,
      '\n', 'nonce', '(prev)', battleState?.battleNonce, '(now)', battle.nonce,
      '\n', 'battle.p1.pokemon', battle.p1?.pokemon,
      '\n', 'battle.p2.pokemon', battle.p2?.pokemon,
      '\n', 'battle', battle,
      '\n', 'battleState', battleState,
    );

    if (!battle.p1 && !battle.p2 && !battle.p3 && !battle.p4) {
      // l.debug(
      //   'Ignoring battle update due to missing players... w0t ??',
      //   '\n', 'battle.p1.pokemon', battle?.p1?.pokemon,
      //   '\n', 'battle.p2.pokemon', battle?.p2?.pokemon,
      //   '\n', 'battle.p3.pokemon', battle?.p3?.pokemon,
      //   '\n', 'battle.p4.pokemon', battle?.p4?.pokemon,
      //   '\n', 'battle', battle,
      //   '\n', 'battleState', battleState,
      // );

      return;
    }

    if (battle.calcdexDestroyed) {
      l.debug(
        'Ignoring battle due to destroyed battleState for', battle?.id || '(missing battle.id)',
        '\n', 'nonce', '(prev)', battleState?.battleNonce, '(now)', battle?.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      return;
    }

    if (!battle.nonce) {
      // this means the passed-in `battle` object is not from the bootstrapper
      l.debug(
        'Ignoring battle due to missing nonce for', battle?.id || '(missing battle.id)',
        '\n', 'nonce', '(prev)', battleState?.battleNonce, '(now)', battle?.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      return;
    }

    if (!battleState?.battleId) {
      l.debug(
        'Initializing battleState for', battle.id,
        '\n', 'battle.nonce', battle.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      dispatch(calcdexSlice.actions.init({
        battleId,
        battleNonce: battle.nonce,
        gen: battle.gen as GenerationNum,
        format: battle.id.split('-')?.[1],
        active: !battle.ended,
        renderMode: renderAsOverlay ? 'overlay' : 'panel',
        p1: { name: battle.p1?.name, rating: battle.p1?.rating },
        p2: { name: battle.p2?.name, rating: battle.p2?.rating },
      }));
    } else if (!battleState?.battleNonce || battle.nonce !== battleState.battleNonce) {
      l.debug(
        'Syncing battleState for', battle.id,
        '\n', 'battle.nonce', battle.nonce,
        '\n', 'battle', battle,
        '\n', 'battleState', battleState,
      );

      // note: syncBattle() is no longer async, but since it's still wrapped in an async thunky,
      // we're keeping the `void` to keep TypeScript happy lol (`void` does nothing here btw)
      void dispatch(syncBattle({ battle }));
    }

    // l.debug(
    //   'Completed battleState sync for', battle.id,
    //   '\n', 'battle.nonce', battle.nonce,
    //   '\n', 'battle', battle,
    //   '\n', 'battleState', battleState,
    // );
  }, [
    battle,
    battleId,
    battle?.nonce,
    battleState,
    dispatch,
    renderAsOverlay,
  ]);

  return {
    state: battleState || {
      battleId: null,
      gen: null,
      format: null,
      rules: null,
      playerKey: 'p1',
      authPlayerKey: null,
      opponentKey: 'p2',
      p1: null,
      p2: null,
      p3: null,
      p4: null,
      field: null,
    },

    renderAsOverlay,
    shouldRender,

    updatePokemon: (playerKey, pokemon) => dispatch(calcdexSlice.actions.updatePokemon({
      battleId,
      playerKey,
      pokemon,
    })),

    updateField: (field) => dispatch(calcdexSlice.actions.updateField({
      battleId,
      field,
    })),

    setActiveIndex: (playerKey, activeIndex) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId,
      [playerKey]: { activeIndex },
    })),

    setSelectionIndex: (playerKey, selectionIndex) => {
      dispatch(calcdexSlice.actions.updatePlayer({
        battleId,
        [playerKey]: { selectionIndex },
      }));

      const updatedBattleState = structuredClone(battleState);

      // purposefully made fatal (from "selectionIndex of null/undefined" errors) cause it shouldn't be
      // null/undefined by the time this helper function is invoked
      if (updatedBattleState[playerKey].selectionIndex !== selectionIndex) {
        updatedBattleState[playerKey].selectionIndex = selectionIndex;
      }

      // in gen 1, field conditions (i.e., only Reflect and Light Screen) is a volatile applied to
      // the Pokemon itself, not in the Side, which is the case for gen 2+.
      // regardless, we update the field here for screens in gen 1 and hazards in gen 2+.
      const updatedField = sanitizeField(
        battle,
        updatedBattleState,
        updatedBattleState.gen === 1 && playerKey === 'p2', // ignore P1 (attackerSide) if playerKey is P2
        updatedBattleState.gen === 1 && playerKey === 'p1', // ignore P2 (defenderSide) if playerKey is P1
      );

      // don't sync screens here, otherwise, user's values will be overwritten when switching Pokemon
      // (normally should only be overwritten per sync at the end of the turn, via syncBattle())
      if (updatedBattleState.gen > 1) {
        delete updatedField.attackerSide.isReflect;
        delete updatedField.attackerSide.isLightScreen;
        delete updatedField.attackerSide.isAuroraVeil;
        delete updatedField.defenderSide.isReflect;
        delete updatedField.defenderSide.isLightScreen;
        delete updatedField.defenderSide.isAuroraVeil;
      }

      dispatch(calcdexSlice.actions.updateField({
        battleId,
        field: updatedField,
      }));
    },

    setAutoSelect: (playerKey, autoSelect) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId,
      [playerKey]: { autoSelect },
    })),
  };
};
