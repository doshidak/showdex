import * as React from 'react';
import { type MoveName } from '@smogon/calc';
import { SandwichProvider } from '@showdex/components/layout';
import { AllPlayerKeys } from '@showdex/consts/battle';
// import { syncBattle } from '@showdex/redux/actions';
import {
  type CalcdexBattleState,
  type CalcdexMoveOverride,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type ShowdexCalcdexSettings,
  calcdexSlice,
  useCalcdexBattleState,
  useCalcdexSettings,
  useDispatch,
} from '@showdex/redux/store';
import {
  cloneAllPokemon,
  clonePlayer,
  countSideRuinAbilities,
  detectToggledAbility,
  toggleRuinAbilities,
  sanitizePlayerSide,
  sanitizePokemon,
} from '@showdex/utils/battle';
import {
  calcLegacyHpIv,
  calcPokemonCurrentHp,
  calcPokemonMaxHp,
  calcPokemonSpreadStats,
  convertLegacyDvToIv,
  getLegacySpcDv,
} from '@showdex/utils/calc';
import {
  formatId,
  nonEmptyObject,
  similarArrays,
  tolerance,
} from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { toggleableAbility } from '@showdex/utils/dex';
import {
  type CalcdexContextConsumables,
  type CalcdexPokemonMutation,
  CalcdexContext,
} from './CalcdexContext';

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
  children,
}: CalcdexProviderProps): JSX.Element => {
  const calcdexSettings = useCalcdexSettings();
  const battleState = useCalcdexBattleState(battleId);
  const dispatch = useDispatch();

  l.debug(
    'Providing Context for', battleId || '???',
    '\n', 'settings', calcdexSettings,
    '\n', 'state', battleState,
  );

  const consumables = React.useMemo<CalcdexContextConsumables>(() => ({
    state: battleState || ({} as CalcdexBattleState),
    settings: calcdexSettings || ({} as ShowdexCalcdexSettings),

    updatePokemon: (playerKey, pokemon, scopeFromArgs) => {
      // used for debugging purposes only
      const scope = `${baseScope}:updatePokemon()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active || !nonEmptyObject(pokemon)) {
        return endTimer('(invalid args)');
      }

      // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase;
      // should be fine for updatePokemon() that we're shallow-cloning instead
      // const updatedState = structuredClone(battleState);
      const playerState = clonePlayer(battleState[playerKey]);

      const pokemonIndex = playerState.pokemon
        ?.findIndex((p) => p?.calcdexId === pokemon?.calcdexId)
        ?? -1;

      if (pokemonIndex < 0) {
        return endTimer('(bad pokemonIndex)');
      }

      const prevPokemon = playerState.pokemon[pokemonIndex];

      if (!prevPokemon?.calcdexId) {
        return endTimer('(bad calcdexId)');
      }

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
        } = sanitizePokemon(payload, battleState.format);

        if (abilities?.length) {
          payload.abilities = [...abilities];

          // checking payload.ability so as to not overwrite what's actually revealed in battle
          if (!prevPokemon.ability && !payload.abilities.includes(prevPokemon.dirtyAbility)) {
            [payload.dirtyAbility] = payload.abilities;
          }
        }

        if (types?.length) {
          payload.types = [...types];

          // since the types change, clear the dirtyTypes, unless specified in the `pokemon` payload
          // (nothing stopping you from passing both speciesForme & dirtyTypes in the payload!)
          // (btw, even if pokemon.dirtyTypes[] was length 0 to clear it, for instance, we're still
          // setting it to an empty array, so all good fam... inb4 the biggest bug in Showdex hist--)
          if (!pokemon.dirtyTypes?.length) {
            payload.dirtyTypes = [];
          }
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
      if (battleState.legacy) {
        // update SPA and SPD to equal each other since we don't keep track of SPC separately
        payload.ivs.spa = convertLegacyDvToIv(getLegacySpcDv(payload.ivs));
        payload.ivs.spd = payload.ivs.spa;

        // recalculate & convert the HP DV into an IV
        payload.ivs.hp = calcLegacyHpIv(payload.ivs);

        // also, remove any incompatible mechanics (like abilities and natures) from the payload
        // (it's ok that the payload doesn't actually have these properties)
        delete payload.ability;
        delete payload.dirtyAbility;
        delete payload.nature;

        // note: only items were introduced in gen 2
        if (battleState.gen === 1) {
          delete payload.item;
          delete payload.dirtyItem;
        }
      }

      // handle clearing dirtyTypes if it matches the current types
      if (Array.isArray(pokemon.dirtyTypes) && similarArrays(payload.types, payload.dirtyTypes)) {
        payload.dirtyTypes = [];
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
      // update (2023/06/04): now checking for dirtyTypes in the `pokemon` payload for Libero/Protean toggles
      // (designed to toggle off in detectToggledAbility() when dirtyTypes[] is present, i.e., the user manually
      // modifies the Pokemon's types; btw, dirtyTypes[] should've been processed by now if it was present)
      if ('ability' in pokemon || 'dirtyAbility' in pokemon || 'dirtyTypes' in pokemon) {
        payload.abilityToggleable = toggleableAbility(payload);

        if (payload.abilityToggleable) {
          payload.abilityToggled = detectToggledAbility(payload, battleState);
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

      // update (2023/07/28): now allowing HP & non-volatile statuses to be edited
      if (typeof payload.dirtyHp === 'number') {
        // let clearDirtyHp = false;

        // determine if this value more or less is the current HP
        const maxHp = calcPokemonMaxHp(payload);
        const currentHp = calcPokemonCurrentHp(payload, true); // ignoreDirty = true (second arg)

        // update (2023/07/30): due to rounding errors, the percentage might be "close enough" to the currentHp,
        // but won't clear since they don't *exactly* match, hence the use of the tolerance() util
        const clearDirtyHp = !maxHp
          // || payload.dirtyHp === currentHp;
          || tolerance(currentHp, 1)(payload.dirtyHp);

        if (clearDirtyHp) {
          payload.dirtyHp = null;
        }
      }

      if ('dirtyStatus' in payload) {
        const clearDirtyStatus = (payload.dirtyStatus === 'ok' && !payload.status)
          || (payload.dirtyStatus === payload.status);

        if (clearDirtyStatus) {
          payload.dirtyStatus = null;
        }
      }

      if ('dirtyFaintCounter' in payload) {
        const clearDirtyFaintCounter = payload.dirtyFaintCounter === payload.faintCounter;

        if (clearDirtyFaintCounter) {
          payload.dirtyFaintCounter = null;
        }
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
      payload.spreadStats = calcPokemonSpreadStats(battleState.format, payload);

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
      if (battleState.gen > 8 && !('abilityToggled' in pokemon)) {
        toggleRuinAbilities(
          playerState,
          pokemonIndex,
          battleState.field?.gameType,
        );
      }

      // because of Ruin abilities, I have to do this, so here it is:
      // this is the payload that will be dispatched below (after placing the `payload` at `pokemonIndex` above)
      // const playerPayload: Partial<CalcdexPlayer> = {
      //   pokemon: playerState.pokemon,
      // };

      // handle recounting Ruin abilities when something changes of the Pokemon
      // if (battleState.gen > 8) {
      //   playerPayload.side = {
      //     ...playerPayload.side,
      //     ...countSideRuinAbilities(playerState),
      //   };
      // }

      // dispatch(calcdexSlice.actions.updatePlayer({
      //   scope,
      //   battleId,
      //   [playerKey]: playerPayload,
      // }));

      const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
        [playerKey]: {
          pokemon: playerState.pokemon,
        },
      };

      // handle recounting Ruin abilities when something changes about the Pokemon (including for other players!)
      if (battleState.gen > 8) {
        playersPayload[playerKey].side = {
          ...playersPayload[playerKey].side,
          ...countSideRuinAbilities(playerState),
        };

        const otherPlayerKeys = AllPlayerKeys
          .filter((k) => k !== playerKey && battleState[k]?.active);

        // update (2023/07/18): turns out my dumbass forgot that the updatePlayer() action
        // actually accepts multiple players, as long as their CalcdexPlayerKey exists in the
        // dispatched object, so no need dispatch() so many times!!
        // otherPlayerKeys.forEach((otherPlayerKey) => {
        //   dispatch(calcdexSlice.actions.updatePlayer({
        //     scope,
        //     battleId,
        //     [otherPlayerKey]: {
        //       side: countSideRuinAbilities(updatedState[otherPlayerKey]),
        //     },
        //   }));
        // });

        otherPlayerKeys.forEach((key) => {
          playersPayload[key] = {
            side: countSideRuinAbilities(battleState[key]),
          };
        });
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        ...playersPayload,
      }));

      endTimer('(update complete)');
    },

    updateSide: (playerKey, side, scopeFromArgs) => {
      // used for debugging purposes only
      const scope = `${baseScope}:updateSide()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active || !nonEmptyObject(side)) {
        return endTimer('(invalid args)');
      }

      // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase;
      // also, no need to deep-clone anything here, it looks like
      // const updatedState = structuredClone(battleState);
      const playerState = battleState[playerKey];

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        [playerKey]: {
          side: {
            ...playerState.side,
            ...side,

            conditions: {
              ...playerState.side?.conditions,
              ...side?.conditions,
            },
          },
        },
      }));

      endTimer('(update complete)');
    },

    updateField: (field, scopeFromArgs) => {
      // used for debugging purposes only
      const scope = `${baseScope}:updateField()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!nonEmptyObject(field)) {
        return endTimer('(invalid args)');
      }

      if (battleState.gen > 8 && ('weather' in field || 'terrain' in field)) {
        // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
        // const updatedState = structuredClone(battleState);

        const updatedField = {
          ...battleState.field,
          ...field,
        };

        const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};

        AllPlayerKeys.forEach((playerKey) => {
          if (!battleState[playerKey]?.active) {
            return;
          }

          const pokemon = cloneAllPokemon(battleState[playerKey].pokemon);

          const retoggleIds = pokemon
            .filter((p) => ['protosynthesis', 'quarkdrive'].includes(formatId(p?.dirtyAbility || p?.ability)))
            .map((p) => p.calcdexId);

          if (!retoggleIds.length) {
            return;
          }

          const shallowState = {
            ...battleState,
            field: updatedField,
            [playerKey]: {
              ...battleState[playerKey],
              pokemon,
            },
          };

          retoggleIds.forEach((id) => {
            const mon = pokemon.find((p) => p.calcdexId === id);

            if (!mon) {
              return;
            }

            mon.abilityToggled = detectToggledAbility(mon, shallowState);
          });

          playersPayload[playerKey] = {
            pokemon,
          };
        });

        if (nonEmptyObject(playersPayload)) {
          dispatch(calcdexSlice.actions.updatePlayer({
            scope,
            battleId,
            ...playersPayload,
          }));
        }
      }

      dispatch(calcdexSlice.actions.updateField({
        scope,
        battleId,
        field,
      }));

      endTimer('(update complete)');
    },

    setActiveIndex: (playerKey, activeIndex, scopeFromArgs) => {
      // used for debugging purposes only
      const scope = `${baseScope}:setActiveIndex()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active) {
        return endTimer('(invalid args)');
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        [playerKey]: { activeIndex },
      }));

      endTimer('(update complete)');
    },

    setActiveIndices: (playerKey, activeIndices, scopeFromArgs) => {
      // used for debugging purposes only
      const scope = `${baseScope}:setActiveIndices()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active || !nonEmptyObject(activeIndices)) {
        return endTimer('(invalid args)');
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        [playerKey]: { activeIndices },
      }));

      endTimer('(update complete)');
    },

    setSelectionIndex: (playerKey, selectionIndex, scopeFromArgs) => {
      // used for debugging purposes only
      const scope = `${baseScope}:setSelectionIndex()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active || selectionIndex < 0) {
        return endTimer('(invalid args)');
      }

      // update (2023/07/18): structuredClone() is slow af, so removing it from the codebase
      // const updatedState = structuredClone(battleState);
      const playerState = clonePlayer(battleState[playerKey]);

      if (selectionIndex === playerState.selectionIndex) {
        return endTimer('(no change)');
      }

      // technically don't need to specify this since toggleRuinAbilities() accepts a selectionIndex
      // override as its second argument, but just in case we forget to accept the same override for
      // future functions I may write & use here LOL
      playerState.selectionIndex = selectionIndex;

      const playerPayload: Partial<CalcdexPlayer> = {
        selectionIndex,
      };

      // smart toggle Ruin abilities (gen 9)
      // (note: toggleRuinAbilities() will directly mutate each CalcdexPokemon in the player's pokemon[])
      if (battleState.gen > 8) {
        toggleRuinAbilities(
          playerState,
          selectionIndex,
          battleState.field?.gameType,
        );

        playerPayload.pokemon = playerState.pokemon;
      }

      // in gen 1, field conditions (i.e., only Reflect & Light Screen) are volatiles applied to the
      // Pokemon itself, not in the `sideConditions` of Showdown.Side, which is the case for gen 2+.
      // regardless, we update the field here for screens in gen 1 & hazards in gen 2+.
      playerPayload.side = sanitizePlayerSide(
        battleState.gen,
        playerState,
        // battle[playerKey],
      );

      // don't sync screens here, otherwise, user's values will be overwritten when switching Pokemon
      // (normally should only be overwritten per sync at the end of the turn, via syncBattle())
      if (battleState.gen > 1) {
        delete playerPayload.side.isReflect;
        delete playerPayload.side.isLightScreen;
        delete playerPayload.side.isAuroraVeil;
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        [playerKey]: playerPayload,
      }));

      endTimer('(update complete)');
    },

    setAutoSelect: (playerKey, autoSelect, scopeFromArgs) => {
      // for debugging purposes only
      const scope = `${baseScope}:setAutoSelect()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active || typeof autoSelect !== 'boolean') {
        return endTimer('(invalid args)');
      }

      dispatch(calcdexSlice.actions.updatePlayer({
        scope,
        battleId,
        [playerKey]: { autoSelect },
      }));

      endTimer('(update complete)');
    },

    setPlayerKey: (playerKey, scopeFromArgs) => {
      // for debugging purposes only
      const scope = `${baseScope}:setPlayerKey()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!playerKey || !battleState?.[playerKey]?.active) {
        return endTimer('(invalid args)');
      }

      dispatch(calcdexSlice.actions.update({
        scope,
        battleId,
        playerKey,
        opponentKey: battleState[battleState.opponentKey === playerKey ? 'playerKey' : 'opponentKey'],
      }));

      endTimer('(update complete)');
    },

    setOpponentKey: (opponentKey, scopeFromArgs) => {
      // for debugging purposes only
      const scope = `${baseScope}:setOpponentKey()${scopeFromArgs ? ` via ${scopeFromArgs}` : ''}`;
      const endTimer = runtimer(scope, l);

      if (!opponentKey || !battleState?.[opponentKey]?.active) {
        return endTimer('(invalid args)');
      }

      dispatch(calcdexSlice.actions.update({
        scope,
        battleId,
        playerKey: battleState[battleState.playerKey === opponentKey ? 'opponentKey' : 'playerKey'],
        opponentKey,
      }));

      endTimer('(update complete)');
    },
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
      <SandwichProvider>
        {children}
      </SandwichProvider>
    </CalcdexContext.Provider>
  );
};

export const useCalcdexContext = (): CalcdexContextConsumables => React.useContext(CalcdexContext);
