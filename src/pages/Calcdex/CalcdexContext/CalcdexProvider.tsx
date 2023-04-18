import * as React from 'react';
import { AllPlayerKeys } from '@showdex/consts/battle';
// import { syncBattle } from '@showdex/redux/actions';
import {
  calcdexSlice,
  useCalcdexBattleState,
  useCalcdexSettings,
  useDispatch,
} from '@showdex/redux/store';
import { formatId } from '@showdex/utils/app';
import {
  detectToggledAbility,
  toggleRuinAbilities,
  sanitizePlayerSide,
  sanitizePokemon,
  countSideRuinAbilities,
} from '@showdex/utils/battle';
import {
  calcLegacyHpDv,
  calcPokemonSpreadStats,
  convertLegacyDvToIv,
  getLegacySpcDv,
} from '@showdex/utils/calc';
import { logger } from '@showdex/utils/debug';
import { toggleableAbility } from '@showdex/utils/dex';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type {
  CalcdexBattleState,
  CalcdexMoveOverride,
  CalcdexPlayer,
  // CalcdexPlayerKey,
  // CalcdexRenderMode,
  ShowdexCalcdexSettings,
} from '@showdex/redux/store';
import type { CalcdexContextConsumables, CalcdexPokemonMutation } from './CalcdexContext';
import { CalcdexContext } from './CalcdexContext';

/**
 * Props passable to the `CalcdexProvider` for initializing the Calcdex Context.
 *
 * @since 1.1.1
 */
export interface CalcdexProviderProps {
  /*
   * Battle state from the Showdown client, typically available under `app.curRoom.battle`.
   *
   * * You must provide either this or `battleId`.
   *   - If both are provided, this will take precedence over `battleId`.
   *
   * @deprecated As of v1.1.3, the `battle` object is strictly handled in the bootstrapper only,
   *   including dispatching battle syncs. React will only have access to the battle through its
   *   state in Redux.
   * @since 1.1.1
   */
  // battle?: Showdown.Battle;

  /**
   * ID of a previously initialized battle.
   *
   * * Typically used for opening a Calcdex for a battle that's been previously initialized,
   *   but the battle in the Showdown client has been destroyed (e.g., user left the battle room).
   *   - This is possible since the Calcdex state for the given battle may still exist in Redux.
   * * Won't be passed to Context consumers, but can be read from the returned `state.battleId`.
   * * You must provide either this or `battle`.
   *   - If both are provided, `battle` will take precedence over this.
   *
   * @since 1.1.1
   */
  battleId?: string;

  /*
   * Battle request state from the Showdown client, typically available under `app.curRoom.request`.
   *
   * * Contains information such as G-max and Tera type.
   *   - For Tera types, you should not use this object, but rather, read the `teraType` from `Showdown.ServerPokemon`
   *     or `terastallized` from `Showdown.Pokemon`.
   * * Note that the client will typically only send information about the Pokemon currently active on the field.
   *
   * @deprecated As of v1.1.3, the `battle` object is strictly handled in the bootstrapper only,
   *   including dispatching battle syncs. React will only have access to the battle through its
   *   state in Redux.
   * @since 1.1.1
   */
  // request?: Showdown.BattleRequest;

  /**
   * Children of the Calcdex Context, of which any can be a Context Consumer.
   *
   * @since 1.1.1
   */
  children?: React.ReactNode;
}

const baseScope = '@showdex/pages/Calcdex/CalcdexProvider';
const l = logger(baseScope);

export const CalcdexProvider = ({
  // battle,
  battleId,
  // battleId: battleIdFromProps,
  // request,
  children,
}: CalcdexProviderProps): JSX.Element => {
  // const battleId = battle?.id || battleIdFromProps;
  // const authUser = getAuthUsername();

  const calcdexSettings = useCalcdexSettings();
  const battleState = useCalcdexBattleState(battleId);
  const dispatch = useDispatch();

  // const debugBattle = React.useMemo(() => ({
  //   id: battleId || '(missing battleId)',
  //   nonce: ['nonce', '(prev)', battleState?.battleNonce, '(now)', battle?.nonce],
  //   info: ['gen', battleState?.gen, 'format', battleState?.format, 'turn', battleState?.turn],
  //   vs: [battleState?.p1?.name || '(p1)', 'vs', battleState?.p2?.name || '(p2)'],
  //   state: ['battle', battle, '\n', 'state', battleState],
  // }), [
  //   battle,
  //   battleId,
  //   battleState,
  // ]);

  l.debug(
    'Providing Context for', battleId || '???',
    '\n', 'settings', calcdexSettings,
    '\n', 'state', battleState,
  );

  // determine if this Calcdex is set up by the bootstrapper to open as an overlay
  // const renderAsOverlay = !!calcdexSettings?.openAs
  //   // && calcdexSettings.openAs === 'overlay' // bad cause user can change the setting post-bootstrap :o
  //   && !battle?.calcdexRoom // shouldn't be present in overlay mode
  //   && typeof battle?.calcdexOverlayVisible === 'boolean'; // should've been set by the bootstrapper

  // const renderMode: CalcdexRenderMode = renderAsOverlay ? 'overlay' : 'panel';

  // determine if the Calcdex should render
  // const shouldRender = !battle?.calcdexDestroyed
  //   // && (!renderAsOverlay || calcdexSettings?.preserveRenderStates || battle?.calcdexOverlayVisible);
  //   && (!renderAsOverlay || battle?.calcdexOverlayVisible);

  // handle `battle` changes from the client
  // (this is the sauce that invokes the syncBattle())
  // React.useEffect(() => {
  //   if (!battle?.id) {
  //     return;
  //   }
  //
  //   if (AllPlayerKeys.every((key) => !battle[key])) {
  //     // l.debug(
  //     //   'Ignoring battle update for', debugBattle.id, 'due to missing players... w0t ???',
  //     //   '\n', ...debugBattle.info,
  //     //   '\n', ...debugBattle.vs,
  //     //   '\n', 'p1', battle?.p1,
  //     //   '\n', 'p2', battle?.p2,
  //     //   // '\n', 'p3', battle?.p3,
  //     //   // '\n', 'p4', battle?.p4,
  //     //   '\n', ...debugBattle.nonce,
  //     //   '\n', ...debugState.state,
  //     // );
  //
  //     return;
  //   }
  //
  //   if (battle.calcdexDestroyed) {
  //     l.debug(
  //       'Ignoring battle update for', debugBattle.id, 'due to destroyed state',
  //       '\n', ...debugBattle.info,
  //       '\n', ...debugBattle.vs,
  //       '\n', ...debugBattle.nonce,
  //       '\n', ...debugBattle.state,
  //     );
  //
  //     return;
  //   }
  //
  //   // check for the injected `nonce` to make sure `battle` passed through the bootstrapper
  //   if (!battle.nonce) {
  //     l.debug(
  //       'Ignoring battle update for', debugBattle.id, 'due to missing nonce',
  //       '\n', ...debugBattle.info,
  //       '\n', ...debugBattle.vs,
  //       '\n', ...debugBattle.nonce,
  //       '\n', ...debugBattle.state,
  //     );
  //
  //     return;
  //   }
  //
  //   l.debug(
  //     'Received battle update for', debugBattle.id,
  //     '\n', ...debugBattle.info,
  //     '\n', ...debugBattle.vs,
  //     '\n', ...debugBattle.nonce,
  //     '\n', ...debugBattle.state,
  //   );
  //
  //   // check if we need to initialize a new Calcdex state for the current `battle`
  //   if (!battleState?.battleId) {
  //     l.debug(
  //       'Initializing Calcdex state for', debugBattle.id,
  //       '\n', ...debugBattle.info,
  //       '\n', ...debugBattle.vs,
  //       '\n', ...debugBattle.nonce,
  //       '\n', ...debugBattle.state,
  //     );
  //
  //     const joinedUsers = Array.from(new Set(
  //       battle.stepQueue
  //         ?.filter?.((q) => q?.startsWith('|j|☆'))
  //         .map((q) => q.replace('|j|☆', ''))
  //       || [],
  //     ));
  //
  //     const p1Name = battle.p1?.name || joinedUsers[0] || null;
  //     const p2Name = battle.p2?.name || joinedUsers[1] || null;
  //     const p3Name = battle.p3?.name || joinedUsers[2] || null;
  //     const p4Name = battle.p4?.name || joinedUsers[3] || null;
  //
  //     dispatch(calcdexSlice.actions.init({
  //       battleId,
  //       battleNonce: battle.nonce,
  //       gen: battle.gen as GenerationNum,
  //       format: battle.id.split('-')?.[1],
  //       turn: battle.turn || 0,
  //       active: !battle.ended,
  //       renderMode,
  //
  //       p1: {
  //         active: !!p1Name,
  //         name: p1Name,
  //         rating: battle.p1?.rating,
  //         autoSelect: !!authUser && p1Name === authUser
  //           ? calcdexSettings.defaultAutoSelect?.auth
  //           : calcdexSettings.defaultAutoSelect?.p1,
  //         usedMax: usedDynamax('p1', battle.stepQueue),
  //         usedTera: usedTerastallization('p1', battle.stepQueue),
  //       },
  //
  //       p2: {
  //         active: !!p2Name,
  //         name: p2Name,
  //         rating: battle.p2?.rating,
  //         autoSelect: !!authUser && p2Name === authUser
  //           ? calcdexSettings.defaultAutoSelect?.auth
  //           : calcdexSettings.defaultAutoSelect?.p2,
  //         usedMax: usedDynamax('p2', battle.stepQueue),
  //         usedTera: usedTerastallization('p2', battle.stepQueue),
  //       },
  //
  //       p3: {
  //         active: !!p3Name,
  //         name: p3Name,
  //         rating: battle.p3?.rating,
  //         autoSelect: !!authUser && p3Name === authUser
  //           ? calcdexSettings.defaultAutoSelect?.auth
  //           : calcdexSettings.defaultAutoSelect?.p3,
  //         usedMax: usedDynamax('p3', battle.stepQueue),
  //         usedTera: usedTerastallization('p3', battle.stepQueue),
  //       },
  //
  //       p4: {
  //         active: !!p4Name,
  //         name: p4Name,
  //         rating: battle.p3?.rating || null,
  //         autoSelect: !!authUser && p4Name === authUser
  //           ? calcdexSettings.defaultAutoSelect?.auth
  //           : calcdexSettings.defaultAutoSelect?.p4,
  //         usedMax: usedDynamax('p4', battle.stepQueue),
  //         usedTera: usedTerastallization('p4', battle.stepQueue),
  //       },
  //     }));
  //
  //     return;
  //   }
  //
  //   // otherwise, check if we should sync the updated `battle` from its `nonce`
  //   if (battleState?.battleNonce && battle.nonce === battleState.battleNonce) {
  //     // l.debug(
  //     //   'Ignoring battle update for', debugBattle.id, 'due to same nonce',
  //     //   '\n', ...debugBattle.info,
  //     //   '\n', ...debugBattle.vs,
  //     //   '\n', ...debugBattle.nonce,
  //     //   '\n', ...debugBattle.state,
  //     // );
  //
  //     return;
  //   }
  //
  //   l.debug(
  //     'Syncing battle update for', debugBattle.id,
  //     '\n', ...debugBattle.info,
  //     '\n', ...debugBattle.vs,
  //     '\n', ...debugBattle.nonce,
  //     '\n', ...debugBattle.state,
  //   );
  //
  //   // note: syncBattle() is no longer async, but since it's still wrapped in an async thunky,
  //   // we're keeping the `void` to keep TypeScript happy lol (`void` does nothing here btw)
  //   void dispatch(syncBattle({
  //     battle,
  //     request,
  //   }));
  // }, [
  //   authUser,
  //   battle,
  //   battle?.nonce,
  //   battleId,
  //   battleState,
  //   calcdexSettings,
  //   debugBattle,
  //   dispatch,
  //   renderMode,
  //   request,
  // ]);

  const consumables = React.useMemo<CalcdexContextConsumables>(() => ({
    state: battleState || ({} as CalcdexBattleState),
    settings: calcdexSettings || ({} as ShowdexCalcdexSettings),

    // renderMode,
    // shouldRender,

    updatePokemon: (playerKey, pokemon, scopeFromArgs) => {
      const updatedState = structuredClone(battleState);
      const playerState = updatedState[playerKey];

      const pokemonIndex = playerState.pokemon
        ?.findIndex((p) => p?.calcdexId === pokemon?.calcdexId)
        ?? -1;

      if (pokemonIndex < 0) {
        return;
      }

      const prevPokemon = playerState.pokemon[pokemonIndex];

      if (!prevPokemon?.calcdexId) {
        return;
      }

      // used for debugging purposes only
      const scope = scopeFromArgs || `${baseScope}:updatePokemon()`;

      // this is what we'll be replacing the one at pokemonIndex (i.e., the prevPokemon)
      const payload: CalcdexPokemonMutation = {
        ...prevPokemon,
        ...pokemon,

        // don't allow the calcdexId to be changed
        calcdexId: prevPokemon.calcdexId,

        ivs: { ...prevPokemon?.ivs, ...pokemon?.ivs },
        evs: { ...prevPokemon?.evs, ...pokemon?.evs },
        dirtyBoosts: { ...prevPokemon?.dirtyBoosts, ...pokemon?.dirtyBoosts },
      };

      // check for any possible abilities, base stat & type updates due to speciesForme changes
      if ('speciesForme' in pokemon && pokemon.speciesForme !== prevPokemon.speciesForme) {
        const {
          abilities,
          baseStats,
          types,
        } = sanitizePokemon(payload, updatedState.format);

        if (abilities?.length) {
          payload.abilities = [...abilities];

          // checking payload.ability so as to not overwrite what's actually revealed in battle
          if (!prevPokemon.ability && !payload.abilities.includes(prevPokemon.dirtyAbility)) {
            [payload.dirtyAbility] = payload.abilities;
          }
        }

        if (types?.length) {
          payload.types = [...types];
        }

        if (Object.keys(baseStats || {}).length) {
          payload.baseStats = { ...baseStats };
        }

        // clear the currently applied preset if not a sourced from a 'server' or 'sheet'
        // (this will make the auto-preset applier in CalcdexPokeProvider apply the first preset
        // for the new speciesForme again)
        const preset = (
          !!prevPokemon.presetId
            && !!prevPokemon.presets?.length // 'server' or 'sheets' would be present here only
            && prevPokemon.presets.find((p) => p?.calcdexId === prevPokemon.presetId)
        ) || null;

        if (!['server', 'sheet'].includes(preset?.source)) {
          payload.presetId = null;
        }
      }

      // perform special processing for IVs if we're in a legacy gen
      if (updatedState.legacy) {
        // update SPA and SPD to equal each other since we don't keep track of SPC separately
        payload.ivs.spa = convertLegacyDvToIv(getLegacySpcDv(payload.ivs));
        payload.ivs.spd = payload.ivs.spa;

        // recalculate & convert the HP DV into an IV
        payload.ivs.hp = convertLegacyDvToIv(calcLegacyHpDv(payload.ivs));

        // also, remove any incompatible mechanics (like abilities and natures) from the payload
        // (it's ok that the payload doesn't actually have these properties)
        delete payload.ability;
        delete payload.dirtyAbility;
        delete payload.nature;

        // note: only items were introduced in gen 2
        if (updatedState.gen === 1) {
          delete payload.item;
          delete payload.dirtyItem;
        }
      }

      // clear the dirtyAbility, if any, if it matches the ability
      if ('dirtyAbility' in pokemon && pokemon.dirtyAbility === prevPokemon.ability) {
        payload.dirtyAbility = null;
      }

      const ability = payload.dirtyAbility || prevPokemon.dirtyAbility || prevPokemon.ability;
      const abilityId = formatId(ability);

      if ('dirtyItem' in pokemon) {
        // clear the dirtyItem, if any, if it matches the item
        if (pokemon.dirtyItem === prevPokemon.item) {
          payload.dirtyItem = null;
        }

        // for Protosynthesis/Quark Drive (gen 9), if the user sets the item back to Booster Energy, toggle it back on
        if (['protosynthesis', 'quarkdrive'].includes(abilityId)) {
          payload.abilityToggled = formatId(payload.dirtyItem) === 'boosterenergy';
        }
      }

      // recheck for toggleable abilities if changed
      if ('ability' in pokemon || 'dirtyAbility' in pokemon) {
        payload.abilityToggleable = toggleableAbility(payload);

        if (payload.abilityToggleable) {
          payload.abilityToggled = detectToggledAbility(payload, updatedState);
        }
      }

      // update (2022/11/06): now allowing base stat editing as a setting lul
      if ('dirtyBaseStats' in pokemon) {
        // if we receive nothing valid in payload.dirtyBaseStats, means all dirty values should be cleared
        payload.dirtyBaseStats = {
          ...(!!Object.keys(pokemon.dirtyBaseStats || {}).length && {
            ...prevPokemon?.dirtyBaseStats,
            ...pokemon.dirtyBaseStats,
          }),
        };

        // remove any dirtyBaseStat entry that matches its original value
        Object.entries(payload.dirtyBaseStats).forEach(([
          stat,
          value,
        ]: [
          Showdown.StatName,
          number,
        ]) => {
          const baseValue = (
            prevPokemon.transformedForme && stat !== 'hp'
              ? prevPokemon.transformedBaseStats?.[stat]
              : prevPokemon.baseStats?.[stat]
          ) ?? -1;

          if (baseValue === value) {
            delete payload.dirtyBaseStats[stat];
          }
        });
      }

      // individually spread each overridden move w/ the move's defaults, if any
      if ('moveOverrides' in pokemon) {
        Object.entries(pokemon.moveOverrides || {}).forEach(([
          moveName,
          overrides,
        ]: [
          MoveName,
          CalcdexMoveOverride,
        ]) => {
          // clear all the overrides if we didn't get an object or we have an empty object
          payload.moveOverrides[moveName] = {
            ...(!!Object.keys(overrides || {}).length && {
              ...prevPokemon.moveOverrides?.[moveName],
              ...overrides,
            }),
          };
        });

        // this is the crucial bit, otherwise we'll remove any existing overrides
        payload.moveOverrides = {
          ...prevPokemon.moveOverrides,
          ...payload.moveOverrides,
        };
      }

      // recalculate the stats with the updated base stats/EVs/IVs
      payload.spreadStats = calcPokemonSpreadStats(updatedState.format, payload);

      // clear any dirtyBoosts that match the current boosts
      Object.entries(prevPokemon.boosts).forEach(([
        stat,
        boost,
      ]: [
        Showdown.StatNameNoHp,
        number,
      ]) => {
        const dirtyBoost = payload.dirtyBoosts[stat];

        const validBoost = typeof boost === 'number';
        const validDirtyBoost = typeof dirtyBoost === 'number';

        if (validBoost && validDirtyBoost && dirtyBoost === boost) {
          payload.dirtyBoosts[stat] = undefined;
        }
      });

      playerState.pokemon[pokemonIndex] = payload;

      // smart toggle Ruin abilities (gen 9), but only when abilityToggled was not explicitly updated
      if (updatedState.gen > 8 && !('abilityToggled' in pokemon)) {
        toggleRuinAbilities(
          playerState,
          pokemonIndex,
          updatedState.field?.gameType,
        );
      }

      // because of Ruin abilities, I have to do this, so here it is:
      // this is the payload that will be dispatched below (after placing the `payload` at `pokemonIndex` above)
      const playerPayload: Partial<CalcdexPlayer> = {
        pokemon: playerState.pokemon,
      };

      // handle recounting Ruin abilities when something changes of the Pokemon
      if (updatedState.gen > 8) {
        playerPayload.side = {
          ...playerPayload.side,
          ...countSideRuinAbilities(playerState),
        };
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        [playerKey]: playerPayload,
      }));

      // handle recounting Ruin abilities for other players
      if (updatedState.gen > 8) {
        const otherPlayerKeys = AllPlayerKeys
          .filter((k) => k !== playerKey && updatedState[k]?.active);

        otherPlayerKeys.forEach((otherPlayerKey) => {
          dispatch(calcdexSlice.actions.updatePlayer({
            scope,
            battleId,
            [otherPlayerKey]: {
              side: countSideRuinAbilities(updatedState[otherPlayerKey]),
            },
          }));
        });
      }
    },

    updateSide: (playerKey, side, scope) => {
      const updatedState = structuredClone(battleState);
      const playerState = updatedState[playerKey];

      if (!playerState?.sideid || !Object.keys(side || {}).length) {
        return;
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope: scope || `${baseScope}:updateSide()`,
        battleId,
        [playerKey]: {
          side: {
            ...playerState.side,
            ...side,
          },
        },
      }));
    },

    updateField: (field, scopeFromArgs) => {
      const scope = scopeFromArgs || `${baseScope}:updateField()`;

      if (battleState.gen > 8 && ('weather' in field || 'terrain' in field)) {
        const updatedState = structuredClone(battleState);

        updatedState.field = {
          ...updatedState.field,
          ...field,
          // attackerSide: { ...updatedState.field.attackerSide, ...field?.attackerSide },
          // defenderSide: { ...updatedState.field.defenderSide, ...field?.defenderSide },
        };

        AllPlayerKeys.forEach((playerKey) => {
          const { pokemon = [] } = updatedState[playerKey];

          const retoggleIds = pokemon
            .filter((p) => ['protosynthesis', 'quarkdrive'].includes(formatId(p?.dirtyAbility || p?.ability)))
            .map((p) => p.calcdexId);

          if (!retoggleIds.length) {
            return;
          }

          retoggleIds.forEach((id) => {
            const mon = pokemon.find((p) => p.calcdexId === id);

            if (!mon) {
              return;
            }

            mon.abilityToggled = detectToggledAbility(mon, updatedState);
          });

          dispatch(calcdexSlice.actions.updatePlayer({
            scope,
            battleId,
            [playerKey]: { pokemon },
          }));
        });
      }

      dispatch(calcdexSlice.actions.updateField({
        scope,
        battleId,
        field,
      }));
    },

    setActiveIndex: (playerKey, activeIndex, scope) => dispatch(
      calcdexSlice.actions.updatePlayer({
        scope: scope || `${baseScope}:setActiveIndex()`,
        battleId,
        [playerKey]: { activeIndex },
      }),
    ),

    setActiveIndices: (playerKey, activeIndices, scope) => dispatch(
      calcdexSlice.actions.updatePlayer({
        scope: scope || `${baseScope}:setActiveIndices()`,
        battleId,
        [playerKey]: { activeIndices },
      }),
    ),

    setSelectionIndex: (playerKey, selectionIndex, scope) => {
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

      const playerPayload: Partial<CalcdexPlayer> = {
        selectionIndex: playerState.selectionIndex,
        pokemon: playerState.pokemon,

        // in gen 1, field conditions (i.e., only Reflect and Light Screen) is a volatile applied to
        // the Pokemon itself, not in the Side, which is the case for gen 2+.
        // regardless, we update the field here for screens in gen 1 and hazards in gen 2+.
        side: sanitizePlayerSide(
          updatedState.gen,
          playerState,
          // battle[playerKey],
        ),
      };

      // don't sync screens here, otherwise, user's values will be overwritten when switching Pokemon
      // (normally should only be overwritten per sync at the end of the turn, via syncBattle())
      if (updatedState.gen > 1) {
        delete playerPayload.side.isReflect;
        delete playerPayload.side.isLightScreen;
        delete playerPayload.side.isAuroraVeil;
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope: scope || `${baseScope}:setSelectionIndex()`,
        battleId,
        [playerKey]: playerPayload,
      }));
    },

    setAutoSelect: (playerKey, autoSelect, scope) => dispatch(
      calcdexSlice.actions.updatePlayer({
        scope: scope || `${baseScope}:setAutoSelect()`,
        battleId,
        [playerKey]: { autoSelect },
      }),
    ),

    setPlayerKey: (playerKey, scope) => dispatch(
      calcdexSlice.actions.update({
        scope: scope || `${baseScope}:setPlayerKey()`,
        battleId,
        playerKey,
        opponentKey: battleState[battleState.opponentKey === playerKey ? 'playerKey' : 'opponentKey'],
      }),
    ),

    setOpponentKey: (opponentKey, scope) => dispatch(
      calcdexSlice.actions.update({
        scope: scope || `${baseScope}:setOpponentKey()`,
        battleId,
        playerKey: battleState[battleState.playerKey === opponentKey ? 'opponentKey' : 'playerKey'],
        opponentKey,
      }),
    ),
  }), [
    // battle,
    battleId,
    battleState,
    calcdexSettings,
    dispatch,
    // renderMode,
    // shouldRender,
  ]);

  return (
    <CalcdexContext.Provider value={consumables}>
      {children}
    </CalcdexContext.Provider>
  );
};

export const useCalcdexContext = (): CalcdexContextConsumables => React.useContext(CalcdexContext);
