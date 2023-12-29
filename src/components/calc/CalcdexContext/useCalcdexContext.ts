import * as React from 'react';
import { NIL as NIL_UUID } from 'uuid';
import { type ItemName, type MoveName } from '@smogon/calc';
import {
  PokemonBoosterAbilities,
  PokemonPresetFuckedBaseFormes,
  PokemonPresetFuckedBattleFormes,
  PokemonRuinAbilities,
} from '@showdex/consts/dex';
import {
  type CalcdexBattleField,
  type CalcdexBattleState,
  type CalcdexMoveOverride,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPlayerSide,
  type CalcdexPokemon,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { saveHonkdex } from '@showdex/redux/actions';
import { calcdexSlice, useDispatch } from '@showdex/redux/store';
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
import { env, nonEmptyObject, similarArrays } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import {
  detectDoublesFormat,
  determineDefaultLevel,
  getDexForFormat,
  getGenfulFormat,
  hasMegaForme,
  toggleableAbility,
} from '@showdex/utils/dex';
import { type CalcdexContextValue, CalcdexContext } from './CalcdexContext';

/**
 * Calcdex Context value with some abstracted dispatchers, available to Consumers of said Context.
 *
 * * Prior to v1.1.7, the abstracted dispatchers used to be part of the Context value itself, but to provide a "direct"
 *   path to the `state` & `settings` themselves (without the dispatchers), have been moved here.
 *   - For "direct" access, consume the `CalcdexContext` directly.
 *   - e.g., `const { state, settings } = React.useContext(CalcdexContext);`
 * * Dear future me: Sorry about the `scope` args I added in v1.1.3.
 *   - (And if it wasn't a problem, you're welcome.)
 *
 * @since 1.1.7
 */
export interface CalcdexContextConsumables extends CalcdexContextValue {
  updateBattle: (
    battle: DeepPartial<CalcdexBattleState>,
    scope?: string,
  ) => void;

  addPokemon: (
    playerKey: CalcdexPlayerKey,
    pokemon: PickRequired<CalcdexPokemon, 'speciesForme'>,
    scope?: string,
  ) => void;

  updatePokemon: (
    playerKey: CalcdexPlayerKey,
    pokemon: Partial<CalcdexPokemon>,
    scope?: string,
  ) => void;

  removePokemon: (
    playerKey: CalcdexPlayerKey,
    pokemonOrId: PickRequired<CalcdexPokemon, 'calcdexId'> | string,
    scope?: string,
  ) => void;

  updateSide: (
    playerKey: CalcdexPlayerKey,
    side: Partial<CalcdexPlayerSide>,
    scope?: string,
  ) => void;

  updateField: (
    field: Partial<CalcdexBattleField>,
    scope?: string,
  ) => void;

  activatePokemon: (
    playerKey: CalcdexPlayerKey,
    activeIndices: number[],
    scope?: string,
  ) => void;

  selectPokemon: (
    playerKey: CalcdexPlayerKey,
    pokemonIndex: number,
    scope?: string,
  ) => void;

  autoSelectPokemon: (
    playerKey: CalcdexPlayerKey,
    enabled: boolean,
    scope?: string,
  ) => void;

  assignPlayer: (
    playerKey: CalcdexPlayerKey,
    scope?: string,
  ) => void;

  assignOpponent: (
    playerKey: CalcdexPlayerKey,
    scope?: string,
  ) => void;

  saveHonk: () => void;
}

const l = logger('@showdex/components/calc/useCalcdexContext()');
const s = (local: string, via?: string): string => `${l.scope}:${local}${via ? ` via ${via}` : ''}`;

export const useCalcdexContext = (): CalcdexContextConsumables => {
  const ctx = React.useContext(CalcdexContext);
  const dispatch = useDispatch();

  const { state, saving } = ctx;
  const saveRequestTimeout = React.useRef<NodeJS.Timeout>(null);

  const saveHonk = () => void (async () => {
    await dispatch(saveHonkdex({
      battleId: state.battleId,
    }));

    saving[1](false);
    saveRequestTimeout.current = null;
  })();

  const queueHonkSave = () => {
    // this seemingly redundant check is for calls outside of this hook, such as in BattleInfo
    if (state.operatingMode !== 'standalone') {
      return;
    }

    if (saveRequestTimeout.current) {
      clearTimeout(saveRequestTimeout.current);
    }

    if (!saving[0]) {
      saving[1](true);
    }

    saveRequestTimeout.current = setTimeout(saveHonk, 3000);
  };

  const updateBattle: CalcdexContextConsumables['updateBattle'] = (
    battle,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('updateBattle()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!nonEmptyObject(battle) || (battle?.battleId && battle.battleId !== state.battleId)) {
      return void endTimer('(bad args)');
    }

    const payload = {
      ...battle,
      battleId: state.battleId,
    };

    if (payload.gen && payload.gen !== state.gen) {
      payload.format = getGenfulFormat(payload.gen, env('honkdex-default-format', payload.format));
    }

    if (payload.format && payload.format !== state.format) {
      payload.gameType = detectDoublesFormat(payload.format) ? 'Doubles' : 'Singles';
      payload.defaultLevel = determineDefaultLevel(payload.format) || 100;
    }

    // only requirement to save a honk is to give it a name
    if (state.operatingMode === 'standalone' && (state.name || payload.name)) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      ...payload,
    }));

    endTimer('(dispatched)');
  };

  const addPokemon: CalcdexContextConsumables['addPokemon'] = (
    playerKey,
    pokemon,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('addPokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId || !state.format) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !pokemon?.speciesForme) {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    const payload: Partial<CalcdexPlayer> = {
      pokemon: cloneAllPokemon(state[playerKey].pokemon),
    };

    const newPokemon = sanitizePokemon({
      ...pokemon,

      playerKey,
      source: 'user',
      level: pokemon?.level || state.defaultLevel,
      hp: 100, // maxhp will also be 1 as this will be a percentage as a decimal (not server-sourced here)
      maxhp: 100,
    }, state.format);

    // no need to provide activeIndices[] & selectionIndex to detectToggledAbility() since it will just read `active`
    newPokemon.abilityToggled = detectToggledAbility(newPokemon, {
      gameType: state.gameType,
      weather: state.field.weather,
      terrain: state.field.terrain,
    });

    newPokemon.ident = `${playerKey}: ${newPokemon.calcdexId.slice(-7)}`;
    newPokemon.spreadStats = calcPokemonSpreadStats(state.format, newPokemon);

    payload.selectionIndex = payload.pokemon.push(newPokemon) - 1;

    if (state.operatingMode === 'standalone') {
      payload.activeIndices = [...(state[playerKey].activeIndices || [])];

      const shouldActivate = (state.gameType === 'Singles' && !payload.activeIndices.length)
        || (state.gameType === 'Doubles' && payload.activeIndices.length < 2);

      if (shouldActivate) {
        payload.activeIndices.push(payload.selectionIndex);
        payload.pokemon = payload.pokemon.map((p, i) => ({
          ...p,
          active: payload.activeIndices.includes(i),
        }));
      }

      // add a couple empty slots to display if we've reached the max
      if (payload.pokemon.length >= state[playerKey].maxPokemon) {
        payload.maxPokemon = state[playerKey].maxPokemon + Math.abs(env.int('honkdex-player-extend-pokemon', 0));
      }
    }

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      [playerKey]: payload,
    }));

    endTimer('(dispatched)');
  };

  // note: don't bother memozing these; may do more harm than good! :o
  const updatePokemon: CalcdexContextConsumables['updatePokemon'] = (
    playerKey,
    pokemon,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('updatePokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId || !state.format) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !state[playerKey] || !pokemon?.calcdexId) {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    const player = clonePlayer(state[playerKey]);
    const pokemonIndex = player.pokemon?.findIndex((p) => p?.calcdexId === pokemon.calcdexId);

    if ((pokemonIndex ?? -1) < 0) {
      return void endTimer('(bad pokemonIndex)');
    }

    const prevPokemon = player.pokemon[pokemonIndex];

    // this is what we'll be replacing the one at pokemonIndex (i.e., the prevPokemon)
    const mutated: Partial<CalcdexPokemon> = {
      ...prevPokemon,
      ...pokemon,

      // just in case lol
      calcdexId: prevPokemon.calcdexId,
    };

    // kinda unnecessary local helper function for that sweet syntactic diabeetus
    const mutating = (
      ...keys: Exclude<keyof CalcdexPokemon, 'calcdexId'>[]
    ) => keys.some((key) => key in pokemon);

    // note: using `prevPokemon` & `pokemon` over `mutated` is important here !!
    if (mutating('speciesForme') && prevPokemon.speciesForme !== pokemon.speciesForme) {
      const {
        altFormes,
        types,
        abilities,
        baseStats,
      } = sanitizePokemon(
        mutated,
        state.format,
      );

      // note: altFormes[] can be empty! (i.e., a Pokemon has no other formes)
      if (!similarArrays(mutated.altFormes, altFormes)) {
        mutated.altFormes = [...altFormes];
      }

      if (abilities?.length) {
        mutated.abilities = [...abilities];

        // checking payload.ability so as to not overwrite what's actually revealed in battle
        // note: checking `ability` first instead of the usual `dirtyAbility` here;
        // specifically for Mega formes & server-sourced Pokemon, we'll need to update its ability when it Mega evo's
        if (!abilities.includes(mutated.ability || mutated.dirtyAbility)) {
          [mutated.dirtyAbility] = abilities;
        }

        const clearInvalidDirtyAbility = !!mutated.dirtyAbility
          && abilities.includes(mutated.ability)
          && !abilities.includes(mutated.dirtyAbility);

        if (clearInvalidDirtyAbility) {
          mutated.dirtyAbility = null;
        }
      }

      if (types?.length) {
        mutated.types = [...types];

        // since the types change, clear the dirtyTypes, unless specified in the `pokemon` payload
        // (nothing stopping you from passing both speciesForme & dirtyTypes in the payload!)
        // (btw, even if pokemon.dirtyTypes[] was length 0 to clear it, for instance, we're still
        // setting it to an empty array, so all good fam... inb4 the biggest bug in Showdex hist--)
        if (mutated.dirtyTypes?.length) {
          mutated.dirtyTypes = [];
        }
      }

      if (nonEmptyObject(baseStats)) {
        mutated.baseStats = { ...baseStats };

        if (Object.values(mutated.dirtyBaseStats || {}).some((v) => (v || 0) > 0)) {
          mutated.dirtyBaseStats = {};
        }
      }

      // if the particular Pokemon is the Crowned forme of either Zacian or Zamazenta, make sure Iron Head &
      // Behemoth Blade/Bash are being properly replaced
      const shouldBehemoth = [
        'Zacian',
        'Zamazenta',
      ].some((f) => mutated.speciesForme.startsWith(f)) && (
        mutated.moves.includes('Iron Head' as MoveName)
          || mutated.moves.some((move) => move.startsWith('Behemoth'))
      );

      if (shouldBehemoth) {
        const bash = mutated.speciesForme.startsWith('Zamazenta');
        const crowned = mutated.speciesForme.endsWith('-Crowned');

        // tried setting Iron Head while Behemoth Bash was there, so changing the forme back to Zamazenta, then back to
        // the Crowned forme again will result in 2 Bash's !! LOL
        // mutated.moves = mutated.moves.map((move) => (
        //   move === 'Iron Head' as MoveName && crowned
        //     ? (bash ? 'Behemoth Bash' : 'Behemoth Blade') as MoveName
        //     : move
        // ));

        const bashMove = (bash ? 'Behemoth Bash' : 'Behemoth Blade') as MoveName;
        const sourceMove = crowned ? 'Iron Head' as MoveName : bashMove;
        const sourceIndex = mutated.moves.indexOf(sourceMove);

        if (sourceIndex > -1) {
          mutated.moves[sourceIndex] = crowned ? bashMove : 'Iron Head' as MoveName;
        }
      }

      // clear the currently applied preset if not a sourced from a 'server' or 'sheet'
      if (mutated.source !== 'server' && mutated.presetId) {
        const dex = getDexForFormat(state.format);
        const prevBaseForme = dex.species.get(prevPokemon.speciesForme)?.baseSpecies;
        const baseForme = dex.species.get(mutated.speciesForme)?.baseSpecies;
        const baseChanged = prevBaseForme !== baseForme;

        const shouldClearPreset = (
          // presetId would be NIL_UUID when the user manually fills in everything, but we'd want to clear it for the
          // auto-preset to kick in when the base formes no longer match (e.g., mutating from 'Dragapult' -> 'Garchomp')
          (mutated.presetId === NIL_UUID || mutated.presetSource === 'user')
            && !prevPokemon.speciesForme.includes(baseForme)
        ) || (
          (!mutated.presetSource || !['server', 'sheet'].includes(mutated.presetSource))
            && !PokemonPresetFuckedBaseFormes.includes(baseForme)
            && !PokemonPresetFuckedBattleFormes.includes(mutated.speciesForme)
            && (baseChanged || (!hasMegaForme(prevPokemon.speciesForme) && !hasMegaForme(pokemon.speciesForme)))
        );

        if (shouldClearPreset) {
          mutated.presetId = null;
          mutated.presetSource = null;
        }
      }
    }

    if (mutating('ivs')) {
      mutated.ivs = {
        ...prevPokemon.ivs,
        ...pokemon.ivs,
      };
    }

    if (mutating('evs')) {
      mutated.evs = {
        ...prevPokemon.evs,
        ...pokemon.evs,
      };
    }

    // processing if ye olde Pokemone, like handling DVs & removing abilities, natures, etc.
    if (state.legacy) {
      if (mutating('ivs')) {
        // make SPA & SPD equal each other since we don't keep track of SPC separately
        mutated.ivs.spa = convertLegacyDvToIv(getLegacySpcDv(mutated.ivs));
        mutated.ivs.spd = mutated.ivs.spa;

        // recalculate & convert the HP DV into an IV
        mutated.ivs.hp = calcLegacyHpIv(mutated.ivs);
      }

      // needed to prevent @smogon/calc from throwing an legacy SPA/SPD mismatch error since we also allow this case
      if (mutating('evs')) {
        mutated.evs.spd = mutated.evs.spa;
      }

      // no-op if these keys don't exist (i.e., no need to check if `mutating('abililty')` beforehand)
      delete mutated.ability;
      delete mutated.dirtyAbility;
      delete mutated.nature;

      // note: items were introduced in gen 2
      if (state.gen === 1) {
        delete mutated.item;
        delete mutated.dirtyItem;
      }
    }

    if (mutating('dirtyTypes') && similarArrays(mutated.types, mutated.dirtyTypes)) {
      mutated.dirtyTypes = [];
    }

    if (mutating('dirtyTeraType') && mutated.teraType === mutated.dirtyTeraType) {
      mutated.dirtyTeraType = null;
    }

    if (mutating('dirtyAbility') && mutated.ability === mutated.dirtyAbility) {
      mutated.dirtyAbility = null;
    }

    if (mutating('dirtyItem')) {
      if (mutated.item === mutated.dirtyItem) {
        mutated.dirtyItem = null;
      }

      // for Protosynthesis/Quark Drive (gen 9), if the user sets the item back to Booster Energy, toggle it back on
      if (PokemonBoosterAbilities.includes(mutated.dirtyAbility)) {
        mutated.abilityToggled = mutated.dirtyItem === 'Booster Energy' as ItemName;
      }
    }

    // update (2022/11/06): now allowing base stat editing as a setting lul
    if (mutating('dirtyBaseStats')) {
      // if we receive nothing valid in payload.dirtyBaseStats, means all dirty values should be cleared
      mutated.dirtyBaseStats = {
        ...(nonEmptyObject(pokemon.dirtyBaseStats) && {
          ...prevPokemon.dirtyBaseStats,
          ...pokemon.dirtyBaseStats,
        }),
      };

      // remove any dirtyBaseStat entry that matches its original value
      Object.entries(mutated.dirtyBaseStats).forEach(([
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
          delete mutated.dirtyBaseStats[stat];
        }
      });
    }

    // update (2023/07/28): now allowing HP & non-volatile statuses to be edited
    if (mutating('dirtyHp')) {
      const maxHp = calcPokemonMaxHp(mutated);
      const currentHp = calcPokemonCurrentHp(mutated, true);
      const dirtyHp = calcPokemonCurrentHp(mutated);

      if (!maxHp || currentHp === dirtyHp) {
        mutated.dirtyHp = null;
      }
    }

    if (mutating('dirtyStatus') && (mutated.status || 'ok') === mutated.dirtyStatus) {
      mutated.dirtyStatus = null;
    }

    if (mutating('dirtyFaintCounter') && mutated.dirtyFaintCounter === mutated.faintCounter) {
      mutated.dirtyFaintCounter = null;
    }

    // recheck for toggleable abilities if changed
    // update (2023/06/04): now checking for dirtyTypes in the `pokemon` payload for Libero/Protean toggles
    // (designed to toggle off in detectToggledAbility() when dirtyTypes[] is present, i.e., the user manually
    // modifies the Pokemon's types; btw, dirtyTypes[] should've been processed by now if it was present)
    if (mutating('dirtyHp', 'ability', 'dirtyAbility', 'dirtyTypes', 'dirtyItem')) {
      // note: these are now independent of each other & will probably rename abilityToggled to abilityActive soon
      mutated.abilityToggled = detectToggledAbility(mutated, {
        gameType: state.gameType,
        // pokemonIndex: playerParty.findIndex((p) => p.calcdexId === mutated.calcdexId),
        selectionIndex: state[playerKey].selectionIndex,
        // activeIndices,
        weather: state.field?.weather,
        terrain: state.field?.terrain,
      });
    }

    // individually spread each overridden move w/ the move's defaults, if any
    if (nonEmptyObject(pokemon.moveOverrides)) {
      // note: it's important that `pokemon` is accessed here, not `mutated` !!
      // (`mutated.moveOverrides` may have hard-replaced overrides for existing moves)
      Object.entries(pokemon.moveOverrides).forEach(([
        moveName,
        overrides,
      ]: [
        moveName: MoveName,
        overrides: CalcdexMoveOverride,
      ]) => {
        // clear all the overrides if we didn't get an object or we have an empty object
        mutated.moveOverrides[moveName] = {
          ...(nonEmptyObject(overrides) && {
            ...prevPokemon.moveOverrides[moveName],
            ...overrides,
          }),
        };
      });

      // this is the crucial bit, otherwise we'll remove any existing overrides
      mutated.moveOverrides = {
        ...prevPokemon.moveOverrides,
        ...mutated.moveOverrides,
      };
    }

    // recalculate the stats with the updated base stats/EVs/IVs
    mutated.spreadStats = calcPokemonSpreadStats(state.format, mutated);

    if (mutating('dirtyBoosts')) {
      mutated.dirtyBoosts = {
        ...prevPokemon.dirtyBoosts,
        ...pokemon.dirtyBoosts,
      };

      // we can only reset dirtyBoosts if there are reported boosts from the current battle, obviously!
      if (nonEmptyObject(mutated.boosts)) {
        Object.entries(mutated.dirtyBoosts).forEach(([
          stat,
          dirtyBoost,
        ]: [
          stat: Showdown.StatNameNoHp,
          dirtyBoost: number,
        ]) => {
          const boost = mutated.boosts?.[stat] || 0;

          if (dirtyBoost === boost) {
            mutated.dirtyBoosts[stat] = null;
          }
        });
      }
    }

    // when the user manually fills in a preset-less Pokemon, set its presetId to some value so that the auto-preset
    // doesn't clear the changes when another Pokemon is added (auto-preset runs on each pokemon[] mutation)
    // (note: also checking if the manualPreset was previously applied in case it's no longer "complete")
    if (mutating('speciesForme') ? mutated.presetId === NIL_UUID : !mutated.presetId) {
      /*
      // create a pseudo-preset based on the user's current inputs to feed into detectCompletePreset()
      const manualPreset: CalcdexPokemonPreset = {
        calcdexId: NIL_UUID,
        id: NIL_UUID,
        name: 'User',
        source: 'user',
        gen: state.gen,
        format: getGenlessFormat(state.format),
        speciesForme: mutated.speciesForme,
        level: mutated.level,
        teraTypes: [mutated.dirtyTeraType].filter(Boolean),
        ability: mutated.dirtyAbility,
        item: mutated.dirtyItem,
        nature: mutated.nature,
        ivs: { ...mutated.ivs },
        evs: { ...mutated.evs },

        // note: purposefully defaulting to [null] to satisfy the moves[].length check in detectCompletePreset()
        moves: mutated.moves.length ? [...mutated.moves] : [null],
      };

      const manuallyComplete = detectCompletePreset(manualPreset);

      mutated.presetId = manuallyComplete ? manualPreset.calcdexId : null;
      mutated.presetSource = manuallyComplete ? manualPreset.source : null;
      */

      const manuallyDirtied = !!mutated.dirtyTypes?.length
        || !!mutated.dirtyTeraType
        || !!mutated.dirtyHp
        || !!mutated.dirtyStatus
        || !!mutated.dirtyItem
        || !!mutated.moves?.filter(Boolean).length
        || Object.values(mutated.dirtyBaseStats || {}).some((v) => (v ?? -1) > 0)
        || Object.values(mutated.evs || {}).some((v) => (v ?? -1) > 0)
        || Object.values(mutated.dirtyBoosts || {}).some((v) => !!v);

      if (manuallyDirtied) {
        mutated.presetId = NIL_UUID;
        mutated.presetSource = 'user';
      }
    }

    player.pokemon[pokemonIndex] = mutated;

    // smart toggle Ruin abilities (gen 9), but only when abilityToggled was not explicitly updated
    if (state.gen > 8 && mutating('abilityToggled')) {
      /*
      toggleRuinAbilities(
        player,
        state.gameType,
        false,
        pokemonIndex,
      );
      */

      player.side = {
        ...player.side,
        ...countSideRuinAbilities(player),
      };
    }

    // because of Ruin abilities, I have to do this
    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: {
        pokemon: player.pokemon,
        side: player.side,
      },
    };

    // handle recounting Ruin abilities when something changes about the Pokemon (including for other players!)
    if (state.gen > 8) {
      AllPlayerKeys.forEach((key) => {
        if (key === playerKey || !state[key].active) {
          return;
        }

        playersPayload[key] = {
          side: {
            ...state[key].side,
            ...countSideRuinAbilities(state[key]),
          },
        };
      });
    }

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      ...playersPayload,
    }));

    endTimer('(dispatched)');
  };

  const removePokemon: CalcdexContextConsumables['removePokemon'] = (
    playerKey,
    pokemonOrId,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('removePokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    const pokemonId = typeof pokemonOrId === 'string'
      ? pokemonOrId
      : pokemonOrId?.calcdexId;

    if (!playerKey || !pokemonId || !state[playerKey]?.active) {
      return void endTimer('(bad args)');
    }

    const pokemonIndex = state[playerKey].pokemon.findIndex((p) => p?.calcdexId === pokemonId);

    if (pokemonIndex < 0) {
      return void endTimer('(404 pokemonId)');
    }

    const payload: Partial<CalcdexPlayer> = {
      pokemon: cloneAllPokemon(state[playerKey].pokemon),
    };

    payload.pokemon.splice(pokemonIndex, 1);

    const activeIndicesIndex = state[playerKey].activeIndices.indexOf(pokemonIndex);

    if (activeIndicesIndex > -1) {
      payload.activeIndices = [...state[playerKey].activeIndices];
      payload.activeIndices.splice(activeIndicesIndex, 1);
    }

    if (state[playerKey].selectionIndex === pokemonIndex) {
      payload.selectionIndex = Math.max(payload.pokemon.length - 1, 0);
    }

    const extendAmount = Math.abs(env.int('honkdex-player-extend-pokemon', 0));
    const maxPokemonPrime = state[playerKey].maxPokemon - extendAmount;

    if (maxPokemonPrime > payload.pokemon.length) {
      payload.maxPokemon = Math.max(
        maxPokemonPrime,
        Math.abs(env.int('honkdex-player-min-pokemon', 0)),
      );
    }

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      [playerKey]: payload,
    }));

    endTimer('(dispatched)');
  };

  const updateSide: CalcdexContextConsumables['updateSide'] = (
    playerKey,
    side,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('updateSide()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !state[playerKey] || !nonEmptyObject(side)) {
      return void endTimer('(bad args)');
    }

    // note: no need to clone the player here
    const player = state[playerKey];

    if (!player?.active) {
      return void endTimer('(bad player state)');
    }

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,

      [playerKey]: {
        side: {
          ...player.side,
          ...side,

          conditions: {
            ...player.side?.conditions,
            ...side?.conditions,
          },
        },
      },
    }));

    endTimer('(dispatched)');
  };

  const updateField: CalcdexContextConsumables['updateField'] = (
    field,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('updateField()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!nonEmptyObject(field)) {
      return void endTimer('(bad args)');
    }

    if (state.gen > 8 && ('weather' in field || 'terrain' in field)) {
      const updatedField = { ...state.field, ...field };
      const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};

      AllPlayerKeys.forEach((playerKey) => {
        const playerState = state[playerKey];

        if ((state.operatingMode === 'battle' && !playerState?.active) || !playerState.pokemon?.length) {
          return;
        }

        const retoggleIds = playerState.pokemon
          // .filter((p) => PokemonRuinAbilities.includes(p?.dirtyAbility || p?.ability))
          .filter((p) => toggleableAbility(p))
          .map((p) => p.calcdexId);

        if (!retoggleIds.length) {
          return;
        }

        const pokemon = cloneAllPokemon(playerState.pokemon);

        retoggleIds.forEach((id) => {
          const retoggleIndex = pokemon.findIndex((p) => p.calcdexId === id);

          if (retoggleIndex < 0) {
            return;
          }

          const retoggle = pokemon[retoggleIndex];

          retoggle.abilityToggled = detectToggledAbility(retoggle, {
            gameType: state.gameType,
            pokemonIndex: retoggleIndex,
            selectionIndex: playerState.selectionIndex,
            activeIndices: playerState.activeIndices,
            weather: updatedField.weather,
            terrain: updatedField.terrain,
          });
        });

        playersPayload[playerKey] = {
          pokemon,
        };
      });

      if (nonEmptyObject(playersPayload)) {
        dispatch(calcdexSlice.actions.updatePlayer({
          scope,
          battleId: state.battleId,
          ...playersPayload,
        }));
      }
    }

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.updateField({
      scope,
      battleId: state.battleId,
      field,
    }));

    endTimer('(dispatched)');
  };

  const activatePokemon: CalcdexContextConsumables['activatePokemon'] = (
    playerKey,
    activeIndices,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('activatePokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !state[playerKey] || !Array.isArray(activeIndices)) {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    if (similarArrays(state[playerKey].activeIndices, activeIndices)) {
      return void endTimer('(no change)');
    }

    const pokemon = cloneAllPokemon(state[playerKey].pokemon).map((p, i) => ({
      ...p,
      active: activeIndices.includes(i),
    }));

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,

      [playerKey]: {
        activeIndices,
        pokemon,
      },
    }));

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    endTimer('(dispatched)');
  };

  const selectPokemon: CalcdexContextConsumables['selectPokemon'] = (
    playerKey,
    pokemonIndex,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('selectPokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !state[playerKey] || (pokemonIndex || 0) < 0) {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    // note: this is being cloned (instead of just directly populating `payload` below) to freely allow functions
    // like toggleRuinAbilities() to freely mutate the pokemon[] without affecting the original state
    const player = clonePlayer(state[playerKey]);

    const playerPayload: Partial<CalcdexPlayer> = {
      selectionIndex: Math.min(pokemonIndex, player.pokemon.length), // allowing + 1 to add
    };

    if (player.selectionIndex === playerPayload.selectionIndex) {
      switch (state.operatingMode) {
        case 'battle': {
          return void endTimer('(no change)');
        }

        case 'standalone': {
          if (!Array.isArray(player.activeIndices)) {
            player.activeIndices = [];
          }

          // when the same Pokemon is selected, toggle its activation state (i.e., whether it's `active` on the field)
          const activeIndicesIndex = player.activeIndices.indexOf(player.selectionIndex);

          // note: splice(-1, 1, 'foo') is functionally similar to push('foo').
          // indexOf() will return -1 if the selectionIndex wasn't found.
          // also, providing the `items[]` arg to splice() will insert them as-is, including null's & undefined's,
          // e.g., ['foo', 'bar'].splice(-1, 1, undefined) -> ['foo', undefined], which we **don't** want!
          // hence the spread array args in order to get ['foo'], while achieving that "1-liner" for max street cred LOL
          player.activeIndices.splice(...([
            activeIndicesIndex,
            state.gameType === 'Doubles' && player.pokemon.length < 2 ? 0 : 1,
            activeIndicesIndex < 0 && player.selectionIndex,
          ].filter((v) => typeof v === 'number') as Parameters<typeof player.activeIndices.splice>));

          player.pokemon = player.pokemon.map((p, i) => ({
            ...p,
            active: player.activeIndices.includes(i),
          }));

          playerPayload.activeIndices = [...player.activeIndices];
          playerPayload.pokemon = [...player.pokemon];

          break;
        }

        default: {
          break;
        }
      }
    }

    // technically don't need to specify this since toggleRuinAbilities() accepts a selectionIndex
    // override as its second argument, but just in case we forget to accept the same override for
    // future functions I may write & use here LOL
    player.selectionIndex = playerPayload.selectionIndex;

    // smart toggle Ruin abilities (gen 9)
    // (note: toggleRuinAbilities() will directly mutate each CalcdexPokemon in the player's pokemon[])
    if (state.gameType === 'Singles' && state.gen > 8) {
      toggleRuinAbilities(
        player,
        state.gameType,
        false,
        playerPayload.selectionIndex,
      );

      playerPayload.pokemon = player.pokemon;
    }

    // in gen 1, field conditions (i.e., only Reflect & Light Screen) are volatiles applied to the
    // Pokemon itself, not in the `sideConditions` of Showdown.Side, which is the case for gen 2+.
    // regardless, we update the field here for screens in gen 1 & hazards in gen 2+.
    playerPayload.side = sanitizePlayerSide(
      state.gen,
      player,
    );

    // don't sync screens here, otherwise, user's values will be overwritten when switching Pokemon
    // (normally should only be overwritten per sync at the end of the turn, via syncBattle())
    if (state.gen > 1) {
      delete playerPayload.side.isReflect;
      delete playerPayload.side.isLightScreen;
      delete playerPayload.side.isAuroraVeil;
    }

    // ;-;
    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: playerPayload,
    };

    // now we do a thing for auto-toggling Stakeout lmao
    // hmm... I feel kinda disgusted after writing this bit lol
    [
      state.playerKey,
      state.opponentKey,
    ].forEach((pKey) => {
      const playerSource = pKey === playerKey ? playerPayload : state[pKey];

      if ((state.operatingMode === 'battle' && !playerSource?.active) || !playerSource.pokemon?.length) {
        return;
      }

      const opponentKey = pKey === state.playerKey ? state.opponentKey : state.playerKey;
      const opponent = opponentKey === playerKey ? playerPayload : state[opponentKey];
      const opponentSelectionIndex = opponentKey === playerKey ? playerPayload.selectionIndex : opponent?.selectionIndex;
      const opponentPokemon = opponent?.pokemon?.[opponentSelectionIndex];

      playerSource.pokemon.forEach((pokemon, i) => {
        // update (2023/11/13): though detectToggledAbility() handles Ruin abilities, we don't want that here!
        const ability = pokemon.dirtyAbility || pokemon.ability;

        if (PokemonRuinAbilities.includes(ability)) {
          return;
        }

        const toggled = detectToggledAbility(pokemon, {
          gameType: state.gameType,
          opponentPokemon,
          selectionIndex: pKey === playerKey ? playerPayload.selectionIndex : opponentSelectionIndex,
          weather: state.field?.weather,
          terrain: state.field?.terrain,
        });

        if (pokemon.abilityToggled === toggled) {
          return;
        }

        if (!playersPayload[pKey]?.pokemon?.length) {
          playersPayload[pKey] = {
            ...playersPayload[pKey],
            pokemon: cloneAllPokemon(playerSource.pokemon),
          };
        }

        const index = pokemon.slot ?? i;

        playersPayload[pKey].pokemon[index].abilityToggled = toggled;
      });
    });

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      ...playersPayload,
    }));

    endTimer('(dispatched)');
  };

  const autoSelectPokemon: CalcdexContextConsumables['autoSelectPokemon'] = (
    playerKey,
    autoSelect,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('autoSelectPokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !state[playerKey] || typeof autoSelect !== 'boolean') {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      [playerKey]: { autoSelect },
    }));

    endTimer('(dispatched)');
  };

  const assignPlayer: CalcdexContextConsumables['assignPlayer'] = (
    playerKey,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('assignPlayer()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!playerKey || !state[playerKey]) {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      playerKey,
      opponentKey: state[state.opponentKey === playerKey ? 'playerKey' : 'opponentKey'],
    }));

    endTimer('(dispatched)');
  };

  const assignOpponent: CalcdexContextConsumables['assignOpponent'] = (
    opponentKey,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('assignOpponent()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    if (!opponentKey || !state[opponentKey]) {
      return void endTimer('(bad args)');
    }

    if (!state[opponentKey]?.active) {
      return void endTimer('(bad opponent state)');
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      playerKey: state[state.playerKey === opponentKey ? 'opponentKey' : 'playerKey'],
      opponentKey,
    }));

    endTimer('(dispatched)');
  };

  return {
    ...ctx,

    updateBattle,
    addPokemon,
    updatePokemon,
    removePokemon,
    updateSide,
    updateField,
    activatePokemon,
    selectPokemon,
    autoSelectPokemon,
    assignPlayer,
    assignOpponent,
    saveHonk: queueHonkSave,
  };
};
