import * as React from 'react';
import { syncBattle } from '@showdex/redux/actions';
import {
  calcdexSlice,
  useCalcdexBattleState,
  useCalcdexSettings,
  useDispatch,
} from '@showdex/redux/store';
import { formatId, getAuthUsername } from '@showdex/utils/app';
import {
  detectToggledAbility,
  sanitizeField,
  toggleableAbility,
  toggleRuinAbilities,
} from '@showdex/utils/battle';
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
  request?: Showdown.BattleRequest;
}

export interface CalcdexHookInterface {
  state: CalcdexBattleState;
  renderAsOverlay: boolean;
  shouldRender: boolean;

  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: DeepPartial<CalcdexPokemon>) => void;
  updateField: (field: DeepPartial<CalcdexBattleField>) => void;
  setActiveIndex: (playerKey: CalcdexPlayerKey, activeIndex: number) => void;
  setActiveIndices: (playerKey: CalcdexPlayerKey, activeIndices: number[]) => void;
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
  request,
}: CalcdexHookOptions = {}): CalcdexHookInterface => {
  const battleId = battle?.id || manualBattleId;
  const authUser = getAuthUsername();

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
      'Effect spawned reacting to a battle or battleState mutation!',
      '\n', 'battle.id', battle.id,
      '\n', 'nonce', '(prev)', battleState?.battleNonce, '(now)', battle.nonce,
      '\n', 'battle.p1.pokemon', battle.p1?.pokemon,
      '\n', 'battle.p2.pokemon', battle.p2?.pokemon,
      '\n', 'request', request,
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

      const joinedUsers = battle.stepQueue
        ?.filter?.((q) => q?.startsWith('|j|☆'))
        .map((q) => q.replace('|j|☆', ''));

      const p1Name = battle.p1?.name || joinedUsers?.[0];
      const p2Name = battle.p2?.name || joinedUsers?.[1];

      dispatch(calcdexSlice.actions.init({
        battleId,
        battleNonce: battle.nonce,
        gen: battle.gen as GenerationNum,
        format: battle.id.split('-')?.[1],
        turn: battle.turn || 0,
        active: !battle.ended,
        renderMode: renderAsOverlay ? 'overlay' : 'panel',

        p1: {
          name: p1Name,
          rating: battle.p1?.rating,
          autoSelect: !!authUser && p1Name === authUser
            ? settings.defaultAutoSelect?.auth
            : settings.defaultAutoSelect?.p1,
        },

        p2: {
          name: p2Name,
          rating: battle.p2?.rating,
          autoSelect: !!authUser && p2Name === authUser
            ? settings.defaultAutoSelect?.auth
            : settings.defaultAutoSelect?.p2,
        },
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
      void dispatch(syncBattle({
        battle,
        request,
      }));
    }

    // l.debug(
    //   'Completed battleState sync for', battle.id,
    //   '\n', 'battle.nonce', battle.nonce,
    //   '\n', 'battle', battle,
    //   '\n', 'battleState', battleState,
    // );
  }, [
    authUser,
    battle,
    battleId,
    battle?.nonce,
    battleState,
    dispatch,
    renderAsOverlay,
    request,
    request?.rqid,
    settings,
  ]);

  return {
    state: battleState || {
      battleId: null,
      gen: null,
      format: null,
      rules: null,
      turn: 0,
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

    updatePokemon: (playerKey, pokemon) => {
      const updatedState = structuredClone(battleState);
      const playerState = updatedState[playerKey];

      const pokemonIndex = playerState.pokemon
        ?.findIndex((p) => p?.calcdexId === pokemon?.calcdexId)
        ?? -1;

      if (pokemonIndex < 0) {
        return;
      }

      const updatedPokemon = {
        ...playerState.pokemon[pokemonIndex],
        ...pokemon,
      };

      // recheck for toggleable abilities if changed
      if ('ability' in pokemon || 'dirtyAbility' in pokemon) {
        updatedPokemon.abilityToggleable = toggleableAbility(updatedPokemon);

        if (updatedPokemon.abilityToggleable) {
          updatedPokemon.abilityToggled = detectToggledAbility(updatedPokemon, updatedState);
        }
      }

      playerState.pokemon[pokemonIndex] = updatedPokemon;

      // smart toggle Ruin abilities (gen 9), but only when abilityToggled was not explicitly updated
      if (updatedState.gen > 8 && !('abilityToggled' in pokemon)) {
        toggleRuinAbilities(
          playerState,
          pokemonIndex,
          updatedState.field?.gameType,
        );
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        battleId,
        // [playerKey]: playerState,
        [playerKey]: {
          pokemon: playerState.pokemon,
        },
      }));

      // handle recounting Ruin abilities when something changes of the Pokemon
      if (updatedState.gen > 8) {
        const {
          attackerSide,
          defenderSide,
        } = sanitizeField(battle, updatedState);

        dispatch(calcdexSlice.actions.updateField({
          battleId,
          field: {
            attackerSide: {
              ruinBeadsCount: attackerSide.ruinBeadsCount,
              ruinSwordCount: attackerSide.ruinSwordCount,
              ruinTabletsCount: attackerSide.ruinTabletsCount,
              ruinVesselCount: attackerSide.ruinVesselCount,
            },

            defenderSide: {
              ruinBeadsCount: defenderSide.ruinBeadsCount,
              ruinSwordCount: defenderSide.ruinSwordCount,
              ruinTabletsCount: defenderSide.ruinTabletsCount,
              ruinVesselCount: defenderSide.ruinVesselCount,
            },
          },
        }));
      }
    },

    updateField: (field) => {
      if (battleState.gen > 8 && ('weather' in field || 'terrain' in field)) {
        const updatedState = structuredClone(battleState);

        (<CalcdexPlayerKey[]> ['p1', 'p2']).forEach((playerKey) => {
          const { pokemon = [] } = updatedState[playerKey];

          const retoggleIds = pokemon
            .filter((p) => ['protosynthesis', 'quarkdrive'].includes(formatId(p?.dirtyAbility || p?.ability)))
            .map((p) => p.calcdexId);

          if (!retoggleIds.length) {
            return;
          }

          updatedState.field = {
            ...updatedState.field,
            ...field,
            attackerSide: { ...updatedState.field.attackerSide, ...field?.attackerSide },
            defenderSide: { ...updatedState.field.defenderSide, ...field?.defenderSide },
          };

          retoggleIds.forEach((id) => {
            const mon = pokemon.find((p) => p.calcdexId === id);

            if (!mon) {
              return;
            }

            mon.abilityToggled = detectToggledAbility(mon, updatedState);
          });

          dispatch(calcdexSlice.actions.updatePlayer({
            battleId,
            [playerKey]: { pokemon },
          }));
        });
      }

      dispatch(calcdexSlice.actions.updateField({
        battleId,
        field,
      }));
    },

    setActiveIndex: (playerKey, activeIndex) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId,
      [playerKey]: { activeIndex },
    })),

    setActiveIndices: (playerKey, activeIndices) => dispatch(calcdexSlice.actions.updatePlayer({
      battleId,
      [playerKey]: { activeIndices },
    })),

    setSelectionIndex: (playerKey, selectionIndex) => {
      if (!playerKey || !(playerKey in battleState) || selectionIndex < 0) {
        return;
      }

      const updatedState = structuredClone(battleState);
      const playerState = updatedState[playerKey];

      // purposefully made fatal (from "selectionIndex of null/undefined" errors) cause it shouldn't be
      // null/undefined by the time this helper function is invoked
      if (playerState.selectionIndex !== selectionIndex) {
        playerState.selectionIndex = selectionIndex;
      }

      // smart toggle Ruin abilities (gen 9)
      if (battleState.gen > 8) {
        toggleRuinAbilities(
          playerState,
          selectionIndex,
          updatedState.field?.gameType,
        );
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        battleId,
        [playerKey]: {
          selectionIndex: playerState.selectionIndex,
          pokemon: playerState.pokemon,
        },
      }));

      // in gen 1, field conditions (i.e., only Reflect and Light Screen) is a volatile applied to
      // the Pokemon itself, not in the Side, which is the case for gen 2+.
      // regardless, we update the field here for screens in gen 1 and hazards in gen 2+.
      const updatedField = sanitizeField(
        battle,
        updatedState,
        updatedState.gen === 1 && playerKey === 'p2', // ignore P1 (attackerSide) if playerKey is P2
        updatedState.gen === 1 && playerKey === 'p1', // ignore P2 (defenderSide) if playerKey is P1
      );

      // don't sync screens here, otherwise, user's values will be overwritten when switching Pokemon
      // (normally should only be overwritten per sync at the end of the turn, via syncBattle())
      if (updatedState.gen > 1) {
        delete updatedField.weather;
        delete updatedField.terrain;
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
