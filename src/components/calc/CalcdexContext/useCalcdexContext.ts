import * as React from 'react';
import { type ItemName, type MoveName } from '@smogon/calc';
import { AllPlayerKeys } from '@showdex/consts/battle';
import {
  PokemonBoosterAbilities,
  PokemonPresetFuckedBaseFormes,
  PokemonPresetFuckedBattleFormes,
  PokemonRuinAbilities,
} from '@showdex/consts/dex';
import {
  type CalcdexBattleField,
  type CalcdexMoveOverride,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPlayerSide,
  type CalcdexPokemon,
} from '@showdex/interfaces/calc';
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
import { nonEmptyObject, similarArrays, tolerance } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { getDexForFormat, hasMegaForme } from '@showdex/utils/dex';
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
  updatePokemon: (
    playerKey: CalcdexPlayerKey,
    pokemon: Partial<CalcdexPokemon>,
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
}

const l = logger('@showdex/components/calc/useCalcdexContext()');
const s = (local: string, via?: string): string => `${l.scope}:${local}${via ? ` via ${via}` : ''}`;

export const useCalcdexContext = (): CalcdexContextConsumables => {
  const ctx = React.useContext(CalcdexContext);
  const dispatch = useDispatch();

  const {
    state,
  } = ctx;

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
      return void endTimer('(invalid args)');
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
        types,
        abilities,
        baseStats,
      } = sanitizePokemon(
        mutated,
        state.format,
      );

      if (abilities?.length) {
        mutated.abilities = [...abilities];

        // checking payload.ability so as to not overwrite what's actually revealed in battle
        // note: checking `ability` first instead of the usual `dirtyAbility` here;
        // specifically for Mega formes & serverSourced Pokemon, we'll need to update its ability when it Mega evo's
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
      // (which should only be in the Pokemon's unique `presets[]`, not in RTK Query or something lol)
      if (!mutated.serverSourced && mutated.presetId) {
        const dex = getDexForFormat(state.format);
        const baseForme = dex.species.get(mutated.speciesForme)?.baseSpecies;
        // const preset = mutated.presets?.find((p) => p?.calcdexId === mutated.presetId);

        const shouldClearPreset = (!mutated.presetSource || !['server', 'sheet'].includes(mutated.presetSource))
          && !PokemonPresetFuckedBaseFormes.includes(baseForme)
          && !PokemonPresetFuckedBattleFormes.includes(mutated.speciesForme)
          && !hasMegaForme(prevPokemon.speciesForme)
          && !hasMegaForme(pokemon.speciesForme);

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

      // no-op if these keys don't exist (i.e., no need to check if `mutating('abililty')` beforehand)
      delete mutated.ability;
      delete mutated.dirtyAbility;
      delete mutated.nature;

      // note: items were introduced in gen 2
      if ((state.gen || 0) === 1) {
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

    // recheck for toggleable abilities if changed
    // update (2023/06/04): now checking for dirtyTypes in the `pokemon` payload for Libero/Protean toggles
    // (designed to toggle off in detectToggledAbility() when dirtyTypes[] is present, i.e., the user manually
    // modifies the Pokemon's types; btw, dirtyTypes[] should've been processed by now if it was present)
    if (mutating('ability', 'dirtyAbility', 'dirtyTypes', 'dirtyItem')) {
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

      // update (2023/07/30): due to rounding errors, the percentage might be "close enough" to the currentHp,
      // but won't clear since they don't *exactly* match, hence the use of the tolerance() util
      const clearDirtyHp = !maxHp
        || (mutated.serverSourced && currentHp === dirtyHp)
        || tolerance(currentHp, Math.ceil(maxHp * 0.01))(dirtyHp);

      if (clearDirtyHp) {
        mutated.dirtyHp = null;
      }
    }

    if (mutating('dirtyStatus') && (mutated.status || 'ok') === mutated.dirtyStatus) {
      mutated.dirtyStatus = null;
    }

    if (mutating('dirtyFaintCounter') && mutated.dirtyFaintCounter === mutated.faintCounter) {
      mutated.dirtyFaintCounter = null;
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

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      ...playersPayload,
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
      return void endTimer('(invalid args)');
    }

    // note: no need to clone the player here
    const player = state[playerKey];

    if (!player?.active) {
      return void endTimer('(bad player state)');
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
      return void endTimer('(invalid args)');
    }

    if (state.gen > 8 && ('weather' in field || 'terrain' in field)) {
      const updatedField = { ...state.field, ...field };
      const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};

      AllPlayerKeys.forEach((playerKey) => {
        if (!state[playerKey]?.active || !state[playerKey].pokemon?.length) {
          return;
        }

        const pokemon = cloneAllPokemon(state[playerKey].pokemon);

        const retoggleIds = pokemon
          .filter((p) => PokemonRuinAbilities.includes(p?.dirtyAbility || p?.ability))
          .map((p) => p.calcdexId);

        if (!retoggleIds.length) {
          return;
        }

        retoggleIds.forEach((id) => {
          const retoggleIndex = pokemon.findIndex((p) => p.calcdexId === id);

          if (retoggleIndex < 0) {
            return;
          }

          const retoggle = pokemon[retoggleIndex];

          retoggle.abilityToggled = detectToggledAbility(retoggle, {
            gameType: state.gameType,
            pokemonIndex: retoggleIndex,
            selectionIndex: state[playerKey].selectionIndex,
            activeIndices: state[playerKey].activeIndices,
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
      return void endTimer('(invalid args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    if (similarArrays(state[playerKey].activeIndices, activeIndices)) {
      return void endTimer('(no change)');
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      [playerKey]: { activeIndices },
    }));

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
      return void endTimer('(invalid args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    if (state[playerKey].selectionIndex === pokemonIndex) {
      return void endTimer('(no change)');
    }

    // note: this is being cloned (instead of just directly populating `payload` below) to freely allow functions
    // like toggleRuinAbilities() to freely mutate the pokemon[] without affecting the original state
    const player = clonePlayer(state[playerKey]);

    const playerPayload: Partial<CalcdexPlayer> = {
      selectionIndex: pokemonIndex,
    };

    // technically don't need to specify this since toggleRuinAbilities() accepts a selectionIndex
    // override as its second argument, but just in case we forget to accept the same override for
    // future functions I may write & use here LOL
    player.selectionIndex = pokemonIndex;

    // smart toggle Ruin abilities (gen 9)
    // (note: toggleRuinAbilities() will directly mutate each CalcdexPokemon in the player's pokemon[])
    if (state.gameType === 'Singles' && state.gen > 8) {
      toggleRuinAbilities(
        player,
        state.gameType,
        false,
        pokemonIndex,
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

      if (!playerSource?.active || !playerSource.pokemon?.length) {
        return;
      }

      const opponentKey = pKey === state.playerKey ? state.opponentKey : state.playerKey;
      const opponent = opponentKey === playerKey ? playerPayload : state[opponentKey];
      const opponentSelectionIndex = opponentKey === playerKey ? pokemonIndex : opponent?.selectionIndex;
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
          selectionIndex: pKey === playerKey ? pokemonIndex : opponentSelectionIndex,
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
      return void endTimer('(invalid args)');
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
      return void endTimer('(invalid args)');
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
      return void endTimer('(invalid args)');
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

    updatePokemon,
    updateSide,
    updateField,
    activatePokemon,
    selectPokemon,
    autoSelectPokemon,
    assignPlayer,
    assignOpponent,
  };
};
