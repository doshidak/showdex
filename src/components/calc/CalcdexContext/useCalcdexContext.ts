import * as React from 'react';
import { NIL as NIL_UUID } from 'uuid';
import { type AbilityName, type ItemName } from '@smogon/calc';
import {
  PokemonBoostNames,
  PokemonBoosterAbilities,
  PokemonPresetFuckedBaseFormes,
  PokemonPresetFuckedBattleFormes,
  PokemonRuinAbilities,
} from '@showdex/consts/dex';
import {
  type CalcdexBattleField,
  type CalcdexBattleState,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPlayerSide,
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  CalcdexPlayerKeys as AllPlayerKeys,
} from '@showdex/interfaces/calc';
import { saveHonkdex } from '@showdex/redux/actions';
import { calcdexSlice, useDispatch } from '@showdex/redux/store';
import {
  detectPlayerKeyFromPokemon,
  cloneAllPokemon,
  clonePlayer,
  clonePlayerSide,
  clonePokemon,
  clonePreset,
  countSideRuinAbilities,
  detectToggledAbility,
  reassignPokemon,
  replaceBehemothMoves,
  sanitizePlayerSide,
  sanitizePokemon,
  toggleRuinAbilities,
} from '@showdex/utils/battle';
import {
  calcLegacyHpIv,
  calcMaxPokemon,
  calcPokemonCurrentHp,
  calcPokemonMaxHp,
  calcPokemonSpreadStats,
  calcStatAutoBoosts,
  convertLegacyDvToIv,
  getDynamaxHpModifier,
  getLegacySpcDv,
  populateStatsTable,
} from '@showdex/utils/calc';
import {
  clamp,
  env,
  nonEmptyObject,
  similarArrays,
} from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import {
  detectDoublesFormat,
  determineAutoBoostEffect,
  determineDefaultLevel,
  determineSpeciesForme,
  determineTerrain,
  determineWeather,
  getDexForFormat,
  getGenfulFormat,
  hasMegaForme,
  toggleableAbility,
} from '@showdex/utils/dex';
import {
  appliedPreset,
  applyPreset,
  findMatchingUsage,
  flattenAlt,
  getPresetFormes,
  selectPokemonPresets,
} from '@showdex/utils/presets';
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
  updateBattle: (battle: DeepPartial<CalcdexBattleState>, scope?: string) => void;
  assignPlayer: (playerKey: CalcdexPlayerKey, scope?: string) => void;
  assignOpponent: (playerKey: CalcdexPlayerKey, scope?: string) => void;

  addPokemon: (playerKey: CalcdexPlayerKey, pokemon: CalcdexPokemon | CalcdexPokemon[], index?: number, scope?: string) => void;
  importPresets: (
    playerKey: CalcdexPlayerKey,
    presets: CalcdexPokemonPreset[], // alwaysAdd = true -> always addPokemon(); otherwise, only apply to player's pokemon[]
    additionalMutations?: Record<string, Partial<CalcdexPokemon>>, // key = preset's calcdexId
    alwaysAdd?: boolean,
    scope?: string,
  ) => number; // returns # of successfully imported presets
  updatePokemon: (playerKey: CalcdexPlayerKey, pokemon: Partial<CalcdexPokemon>, scope?: string) => void;
  removePokemon: (playerKey: CalcdexPlayerKey, pokemonOrId: CalcdexPokemon | string, reselectLast?: boolean, scope?: string) => void;
  dupePokemon: (playerKey: CalcdexPlayerKey, pokemonOrId: CalcdexPokemon | string, scope?: string) => void;
  movePokemon: (
    sourceKey: CalcdexPlayerKey,
    pokemonOrId: CalcdexPokemon | string,
    destKey: CalcdexPlayerKey,
    index?: number,
    scope?: string,
  ) => void;

  updateSide: (playerKey: CalcdexPlayerKey, side: Partial<CalcdexPlayerSide>, scope?: string) => void;
  updateField: (field: Partial<CalcdexBattleField>, scope?: string) => void;

  activatePokemon: (playerKey: CalcdexPlayerKey, activeIndices: number[], scope?: string) => void;
  selectPokemon: (playerKey: CalcdexPlayerKey, pokemonIndex: number, scope?: string) => void;
  autoSelectPokemon: (playerKey: CalcdexPlayerKey, enabled: boolean, scope?: string) => void;

  saveHonk: () => void;
}

const l = logger('@showdex/components/calc/useCalcdexContext()');
const s = (local: string, via?: string): string => `${l.scope}:${local}${via ? ` via ${via}` : ''}`;

/**
 * not just a `CalcdexContext` consumer, but implements a bunch of core functions used by a bunch of different components,
 * so this hook's name is misleading af lmao
 *
 * * this basically contains all the logic for a given Calcdex so the button does something when you click it
 *   - this logic is then used by sub `CalcdexPokeContext`'s & sub-sequently the `useCalcdexPokeContext()` hook,
 *     which more or less also has the same misleading name as this LOL
 *   - also used by other hooks with slightly less misleading names like `useCalcdexPresets()`, which actually contains
 *     the logic for the auto-presetter & `battle.stepQueue[]` OTS (Open Team Sheets) detector LOL
 *   - hence why I call these *core* functions
 *   - (they weren't initially, but ended up being that way as shit built up cuz *c'est la vie* ¯\\\_(ツ)_/¯)
 * * I'ma clean this shiz up dw
 *
 * @todo note to self: refactor me plz (like all of the context shit)
 * @since 1.1.7
 */
export const useCalcdexContext = (): CalcdexContextConsumables => {
  const ctx = React.useContext(CalcdexContext);
  const dispatch = useDispatch();

  const { state, saving, presets: battlePresets } = ctx;
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

  const applyAutoBoostEffects = (
    playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>>,
    field?: Partial<CalcdexBattleField>,
  ) => {
    if (!playersPayload) {
      return;
    }

    const activePokemon = AllPlayerKeys.flatMap((k) => state[k]?.pokemon?.filter((p) => !!p?.active) || []);
    const playerKeys = [state.playerKey, state.opponentKey] as CalcdexPlayerKey[];

    playerKeys.forEach((playerKey) => {
      if (!Array.isArray(playersPayload[playerKey]?.pokemon)) {
        playersPayload[playerKey] = {
          ...playersPayload[playerKey],
          pokemon: cloneAllPokemon(state[playerKey]?.pokemon),
        };
      }

      if ('selectionIndex' in playersPayload[playerKey]) {
        return;
      }

      playersPayload[playerKey].selectionIndex = state[playerKey]?.selectionIndex;
    });

    playerKeys.forEach((playerKey) => {
      const { pokemon: sourceParty, selectionIndex, side: sourceSide } = playersPayload[playerKey];
      const sourcePokemon = sourceParty[selectionIndex];

      if (!sourcePokemon?.speciesForme) {
        return;
      }

      const ability = sourcePokemon.dirtyAbility || sourcePokemon.ability;
      const opponentKey = playerKey === state.playerKey ? state.opponentKey : state.playerKey;
      const shouldTargetOpposing = ability === 'Intimidate' as AbilityName;
      const targetKey = shouldTargetOpposing ? opponentKey : playerKey;

      const { pokemon: targetParty, selectionIndex: targetSelectionIndex } = playersPayload[targetKey];
      const targetPokemon = targetParty[targetSelectionIndex];

      if (!targetPokemon?.speciesForme) {
        return;
      }

      const fx = determineAutoBoostEffect(sourcePokemon, {
        format: state.format,
        targetPokemon,
        activePokemon: state?.gameType === 'Singles'
          ? [playersPayload[opponentKey]?.pokemon?.[playersPayload[opponentKey]?.selectionIndex]].filter(Boolean)
          : activePokemon.filter((p) => p.calcdexId !== sourcePokemon.calcdexId),
        sourceSide,
        field: { ...state.field, ...field },
      });

      [
        sourcePokemon.calcdexId !== targetPokemon.calcdexId && sourcePokemon,
        targetPokemon,
      ].filter(Boolean).forEach((pokemon) => {
        if (!nonEmptyObject(pokemon.autoBoostMap)) {
          pokemon.autoBoostMap = {};

          return;
        }

        // const debugPreEffects = Object.keys(pokemon.autoBoostMap); // used for debugging purposes only

        // warning: don't include alt props (e.g., altAbilities[]) since they're (potentially) populated by a preset for
        // the previous Pokemon if the speciesForme was changed
        // (also, we don't care about dupes here; e.g., abilities = ['Dauntless Shield', 'Dauntless Shield'] is ok for our purposes)
        const abilities = [pokemon.dirtyAbility, pokemon.ability, ...(pokemon.abilities || [])].filter(Boolean);
        const items = [pokemon.dirtyItem, pokemon.item, pokemon.prevItem].filter(Boolean);

        // update (2024/07/23): as opposed to "soft"-removing by setting `active` to false (which is what deactivateEffects[] does),
        // this will hard-remove (via `delete`) any effects NOT received by another Pokémon (e.g., Intimidate), discernable
        // from whether sourceKey & sourcePid are both populated; this is to make sure (esp. in the Honkdex) when you switch
        // from, say, Zamazenta w/ Dauntless Shield (receiving a +1 DEF auto-boost), to Arceus w/ Multitype, the Dauntless
        // Shield auto-boost doesn't incorrectly persist after switching to Arceus
        const removeEffects = (Object.entries(pokemon.autoBoostMap) as Entries<typeof pokemon.autoBoostMap>).map(([n, f]) => {
          if (!f?.name || !f.dict) {
            return n;
          }

          // allow effects from other Pokemon (such as an opposing Landorous-Therian's Intimidate ability) to remain
          if (f.sourceKey && f.sourcePid) {
            return null;
          }

          switch (f.dict) {
            case 'abilities': {
              if (!abilities.includes(f.name as AbilityName)) {
                return n;
              }

              break;
            }

            case 'items': {
              if (!items.includes(f.name as ItemName)) {
                return n;
              }

              break;
            }

            // note: allowing 'moves' to pass thru; although at the time of writing this, don't think this is being used LOL
            // case 'moves': break;

            default: {
              break;
            }
          }

          // default case is to leave it alone & let deactivateEffects[] decide
          return null;
        }).filter(Boolean) as (AbilityName | ItemName)[];

        if (removeEffects.length) {
          removeEffects.forEach((name) => {
            delete pokemon.autoBoostMap[name];
          });
        }

        const deactivateEffects = (Object.entries(pokemon.autoBoostMap) as Entries<typeof pokemon.autoBoostMap>).map(([n, f]) => {
          // note: always resetting 'items' as a shitty way of dealing with Seed items for now lol
          if (!f?.name || f.dict === 'items' || !nonEmptyObject(f.boosts) || (typeof f.turn === 'number' && f.turn < 0)) {
            return n;
          }

          // at this point, we're now *only* handling effects from other Pokemon (unlike the similar guard statement above)
          if (!f.sourceKey || !f.sourcePid) {
            return null;
          }

          // & this is the shitty way of dealing with abilities like Intimidate that target opposing Pokemon
          const fxIndex = playersPayload[f.sourceKey]?.pokemon?.findIndex((p) => p?.calcdexId === f.sourcePid);
          const selIndex = playersPayload[f.sourceKey]?.selectionIndex;

          return fxIndex !== selIndex ? n : null;
        }).filter(Boolean) as (AbilityName | ItemName)[];

        /*
        l.debug(
          'applyAutoBoostEffects()', 'for', playerKey, pokemon.speciesForme,
          '\n', 'effects', '(pre)', debugPreEffects, '(post)', Object.keys(pokemon.autoBoostMap),
          '\n', 'abilities[]', abilities,
          '\n', 'items[]', items,
          '\n', 'autoBoostMap', '(post-remove)', pokemon.autoBoostMap,
          '\n', 'remove[]', removeEffects,
          '\n', 'deactivate[]', deactivateEffects,
        );
        */

        if (!deactivateEffects.length) {
          return;
        }

        const index = playersPayload[pokemon.playerKey].pokemon.indexOf(pokemon);

        if (index < 0) {
          return;
        }

        // l.debug('deactivateEffects for', pokemon.ident, deactivateEffects);

        deactivateEffects.forEach((name) => {
          pokemon.autoBoostMap[name] = {
            ...pokemon.autoBoostMap[name],
            active: false,
          };
        });

        PokemonBoostNames.forEach((stat) => {
          pokemon.dirtyBoosts[stat] = clamp(-6, pokemon.dirtyBoosts[stat], 6) || null;
        });
      });

      if (!fx?.name) {
        return;
      }

      if (fx.name in { ...targetPokemon.autoBoostMap }) {
        targetPokemon.autoBoostMap[fx.name].active = nonEmptyObject(fx.boosts);
        targetPokemon.autoBoostMap[fx.name].boosts = { ...fx.boosts };

        return;
      }

      fx.active = nonEmptyObject(fx.boosts);

      targetPokemon.autoBoostMap = {
        ...targetPokemon.autoBoostMap,
        [fx.name]: fx,
      };
    });
  };

  const applyAutoFieldConditions = (
    pokemon: CalcdexPokemon,
    field: Partial<CalcdexBattleField>,
  ) => {
    if (!pokemon?.speciesForme || !field) {
      return;
    }

    const autoWeather = determineWeather(pokemon, state.format);
    const autoTerrain = determineTerrain(pokemon);

    // update (2024/07/28): keeping user-specified overrides in-tact except when an empty string (i.e., `''`),
    // which indicates the user cleared their override so we should be good to nullify it to fallback to the auto value
    if (autoWeather) {
      field.autoWeather = autoWeather;

      // also intentionally accessing the one from the state, not the passed-in field arg
      if (state.field.dirtyWeather === '' as typeof field.dirtyWeather) {
        field.dirtyWeather = null;
      }
    }

    if (autoTerrain) {
      field.autoTerrain = autoTerrain;

      if (state.field.dirtyTerrain === '' as typeof field.dirtyTerrain) {
        field.dirtyTerrain = null;
      }
    }

    /*
    l.debug(
      'applyAutoFieldConditions()', 'for', pokemon.ident || pokemon.speciesForme,
      '\n', 'autoWeather', autoWeather,
      '\n', 'autoTerrain', autoTerrain,
      '\n', 'field', field,
    );
    */
  };

  const recountRuinAbilities = (
    playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>>,
  ) => {
    if ((state?.gen || 0) < 9 || !playersPayload) {
      return;
    }

    AllPlayerKeys.forEach((playerKey) => {
      const player = state[playerKey];

      if (!player?.active || !player.pokemon?.length) {
        return;
      }

      if (!nonEmptyObject(playersPayload[playerKey])) {
        playersPayload[playerKey] = {};
      }

      playersPayload[playerKey].side = {
        ...playersPayload[playerKey].side,
        ...countSideRuinAbilities({ ...player, ...playersPayload[playerKey] }, state.gameType),
      };
    });
  };

  const mutatePokemon = (
    mutated: CalcdexPokemon,
    prev: CalcdexPokemon,
    mutations: Partial<CalcdexPokemon>,
    field?: Partial<CalcdexBattleField>,
  ) => {
    const playerKey = detectPlayerKeyFromPokemon(prev);

    // kinda unnecessary local helper function for that sweet syntactic diabeetus
    const mutating = (
      ...keys: Exclude<keyof CalcdexPokemon, 'calcdexId'>[]
    ) => keys.some((key) => key in mutations);

    if (mutating('dirtyBoosts')) {
      mutated.dirtyBoosts = {
        ...prev.dirtyBoosts,
        ...mutations.dirtyBoosts,
      };

      // we can only reset dirtyBoosts if there are reported boosts from the current battle, obviously!
      if (nonEmptyObject(mutated.boosts)) {
        (Object.entries(mutated.dirtyBoosts) as Entries<typeof mutated.dirtyBoosts>).forEach(([
          stat,
          dirtyBoost,
        ]) => {
          const boost = mutated.boosts?.[stat] || 0;
          const autoBoost = calcStatAutoBoosts(mutated, stat) || 0;

          if (dirtyBoost !== boost + autoBoost) {
            return;
          }

          mutated.dirtyBoosts[stat] = null;
        });
      }
    }

    mutated.speciesForme = determineSpeciesForme(mutated, true);

    if (mutated.transformedForme) {
      mutated.transformedForme = determineSpeciesForme(mutated);
    }

    if (prev.speciesForme !== mutated.speciesForme) {
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
        // (btw, even if mutations.dirtyTypes[] was length 0 to clear it, for instance, we're still
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

      // clear the currently applied preset if not a sourced from a 'server' or 'sheet'
      if (mutated.source !== 'server' && mutated.presetId) {
        const dex = getDexForFormat(state.format);
        const prevBaseForme = dex.species.get(prev.speciesForme)?.baseSpecies;
        const baseForme = dex.species.get(mutated.speciesForme)?.baseSpecies;
        const baseChanged = prevBaseForme !== baseForme;

        const shouldClearPreset = (
          // presetId would be NIL_UUID when the user manually fills in everything, but we'd want to clear it for the
          // auto-preset to kick in when the base formes no longer match (e.g., mutating from 'Dragapult' -> 'Garchomp')
          (mutated.presetId === NIL_UUID || mutated.presetSource === 'user')
            && !prev.speciesForme.includes(baseForme)
        ) || (
          (!mutated.presetSource || !['server', 'sheet'].includes(mutated.presetSource))
            && prev.speciesForme.replace('-Tera', '') !== mutated.speciesForme.replace('-Tera', '')
            && !PokemonPresetFuckedBaseFormes.includes(baseForme)
            && !PokemonPresetFuckedBattleFormes.includes(mutated.speciesForme)
            && (baseChanged || (!hasMegaForme(prev.speciesForme) && !hasMegaForme(mutations.speciesForme)))
        );

        if (shouldClearPreset) {
          mutated.presetId = null;
          mutated.presetSource = null;
        }
      }

      // make sure any presets added to the Pokemon still apply to the updated speciesForme
      if (mutated.presets?.length) {
        const presetFormes = getPresetFormes(mutated.speciesForme, {
          format: state.format,
          source: 'sheet', // include otherFormes[] (normally omitted when not 'server' / 'sheet')
        });

        mutated.presets = mutated.presets.filter((p) => !!p?.speciesForme && presetFormes.includes(p.speciesForme));
      }
    }

    if (mutating('ivs')) {
      mutated.ivs = { ...prev.ivs, ...mutations.ivs };
    }

    if (mutating('evs')) {
      mutated.evs = { ...prev.evs, ...mutations.evs };
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
        ...(nonEmptyObject(mutations.dirtyBaseStats) && {
          ...prev.dirtyBaseStats,
          ...mutations.dirtyBaseStats,
        }),
      };

      // remove any dirtyBaseStat entry that matches its original value
      (Object.entries(mutated.dirtyBaseStats) as Entries<typeof mutated.dirtyBaseStats>).forEach(([
        stat,
        value,
      ]) => {
        const baseValue = (
          prev.transformedForme && stat !== 'hp'
            ? prev.transformedBaseStats?.[stat]
            : prev.baseStats?.[stat]
        ) ?? -1;

        if (baseValue !== value) {
          return;
        }

        delete mutated.dirtyBaseStats[stat];
      });
    }

    // update (2023/07/28): now allowing HP & non-volatile statuses to be edited
    if (mutating('dirtyHp')) {
      if (typeof mutated.dirtyHp === 'number') { // since null = clear it & use hp instead
        mutated.dirtyHp /= getDynamaxHpModifier(mutated);
      }

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

    // if the particular Pokemon is the Crowned forme of either Zacian or Zamazenta, make sure Iron Head &
    // Behemoth Blade/Bash are being properly replaced (also accounting for transformed doggos)
    mutated.moves = replaceBehemothMoves(mutated.transformedForme || mutated.speciesForme, mutated.moves);

    // individually spread each overridden move w/ the move's defaults, if any
    if (nonEmptyObject(mutations.moveOverrides)) {
      (Object.entries(mutations.moveOverrides) as Entries<typeof mutations.moveOverrides>).forEach(([
        moveName,
        overrides,
      ]) => {
        // clear all the overrides if we didn't get an object or we have an empty object
        mutated.moveOverrides[moveName] = {
          ...(nonEmptyObject(overrides) && {
            ...prev.moveOverrides[moveName],
            ...overrides,
          }),
        };
      });

      // this is the crucial bit, otherwise we'll remove any existing overrides
      mutated.moveOverrides = {
        ...prev.moveOverrides,
        ...mutated.moveOverrides,
      };
    }

    // recalculate the stats with the updated base stats/EVs/IVs
    mutated.spreadStats = calcPokemonSpreadStats(state.format, mutated);

    // when the user manually fills in a preset-less Pokemon, set its presetId to some value so that the auto-preset
    // doesn't clear the changes when another Pokemon is added (auto-preset runs on each pokemon[] mutation)
    // (note: also checking if the manualPreset was previously applied in case it's no longer "complete")
    if (mutating('speciesForme') ? mutated.presetId === NIL_UUID : !mutated.presetId) {
      const manuallyDirtied = !!mutated.dirtyTypes?.length
        || !!mutated.dirtyTeraType
        || !!mutated.dirtyHp
        || !!mutated.dirtyStatus
        || !!mutated.dirtyItem
        || (!!mutated.moves?.filter(Boolean).length && !mutated.revealedMoves?.length)
        || Object.values({ ...mutated.dirtyBaseStats }).some((v) => (v ?? -1) > 0)
        || Object.values({ ...mutated.evs }).some((v) => (v ?? -1) > 0)
        || Object.values({ ...mutated.dirtyBoosts }).some((v) => !!v);

      if (manuallyDirtied) {
        mutated.presetId = NIL_UUID;
        mutated.presetSource = 'user';
      }
    }

    if (nonEmptyObject(field)) {
      applyAutoFieldConditions(mutated, field);
    }

    // recheck for toggleable abilities if changed
    // update (2023/06/04): now checking for dirtyTypes in the `pokemon` payload for Libero/Protean toggles
    // (designed to toggle off in detectToggledAbility() when dirtyTypes[] is present, i.e., the user manually
    // modifies the Pokemon's types; btw, dirtyTypes[] should've been processed by now if it was present)
    if (mutating('dirtyHp', 'ability', 'dirtyAbility', 'dirtyTypes', 'dirtyItem')) {
      const nextField: CalcdexBattleField = { ...state.field, ...field };
      const weather = (nextField.dirtyWeather ?? (nextField.autoWeather || nextField.weather)) || null;
      const terrain = (nextField.dirtyTerrain ?? (nextField.autoTerrain || nextField.terrain)) || null;

      // note: these are now independent of each other & will probably rename abilityToggled to abilityActive soon
      mutated.abilityToggled = detectToggledAbility(mutated, {
        gameType: state.gameType,
        selectionIndex: state[playerKey].selectionIndex,
        weather,
        terrain,
      });
    }
  };

  // note: don't bother memozing these; may do more harm than good! :o
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

    const payload: typeof battle = {
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

    const playersPayload = AllPlayerKeys.reduce((prev, playerKey) => {
      prev[playerKey] = { ...payload[playerKey] };

      if (!payload.gameType || payload.gameType === 'Doubles') {
        return prev;
      }

      const pokemonPayload = Array.isArray(prev[playerKey].pokemon);
      const playerParty = (pokemonPayload ? prev[playerKey] : state[playerKey])?.pokemon;
      const actives = playerParty?.filter((p) => p?.active);

      if ((actives?.length || 0) < 2) {
        return prev;
      }

      if (!pokemonPayload) {
        prev[playerKey].pokemon = cloneAllPokemon(state[playerKey]?.pokemon);
      }

      const [{ calcdexId: firstActiveId }] = actives;
      const activePokemon = prev[playerKey].pokemon.find((p) => p?.calcdexId === firstActiveId);

      if (activePokemon?.calcdexId) {
        activePokemon.active = false;
      }

      return prev;
    }, {} as Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>>);

    recountRuinAbilities(playersPayload);

    // only requirement to save a honk is to give it a name
    // (note: state.defaultName is typically undefined, so essentially falls back to a falsy check)
    if (state.operatingMode === 'standalone' && (state.name || payload.name) !== state.defaultName) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      ...payload,
      ...playersPayload,
    }));

    endTimer('(dispatched)');
  };

  const addPokemon: CalcdexContextConsumables['addPokemon'] = (
    playerKey,
    pokemon,
    index,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('addPokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId || !state.format) {
      return void endTimer('(bad state)');
    }

    const batch = (Array.isArray(pokemon) ? pokemon : [pokemon]).filter((p) => !!p?.speciesForme);

    if (!playerKey || !batch.length) {
      return void endTimer('(bad args)');
    }

    if (!state[playerKey]?.active) {
      return void endTimer('(bad player state)');
    }

    const payload: Partial<CalcdexPlayer> = {
      pokemon: cloneAllPokemon(state[playerKey].pokemon),
    };

    const field: Partial<CalcdexBattleField> = {};

    batch.forEach((currentPokemon, i) => {
      const newPokemon = sanitizePokemon({
        ...currentPokemon,

        playerKey,
        source: 'user',
        // update (2024/07/31): not specifying this (to let the applyPreset() util handle it), otherwise new mon will be
        // lv 100 in, say, Randoms or somethin in the Honkdex
        // level: currentPokemon?.level || state.defaultLevel,
        hp: 100, // maxhp will also be 1 as this will be a percentage as a decimal (not server-sourced here)
        maxhp: 100,
      }, state.format);

      newPokemon.speciesForme = determineSpeciesForme(newPokemon, true);

      if (newPokemon.transformedForme) {
        newPokemon.transformedForme = determineSpeciesForme(newPokemon);
      }

      newPokemon.ident = `${playerKey}: ${newPokemon.calcdexId.slice(-7)}`;
      newPokemon.spreadStats = calcPokemonSpreadStats(state.format, newPokemon);

      applyAutoFieldConditions(newPokemon, field);

      // no need to provide activeIndices[] & selectionIndex to detectToggledAbility() since it will just read `active`
      const currentField: CalcdexBattleField = { ...state.field, ...field };
      const weather = (currentField.dirtyWeather ?? (currentField.autoWeather || currentField.weather)) || null;
      const terrain = (currentField.dirtyTerrain ?? (currentField.autoTerrain || currentField.terrain)) || null;

      newPokemon.abilityToggled = detectToggledAbility(newPokemon, {
        gameType: state.gameType,
        weather,
        terrain,
      });

      if (state.operatingMode === 'standalone') {
        newPokemon.autoPreset = false;
        newPokemon.autoPresetId = null; // ignored in 'standalone' mode, so just in case lol
      }

      const insertionIndex = typeof index === 'number' && index > -1
        ? (index + i)
        : payload.pokemon.length;

      payload.pokemon.splice(insertionIndex, 0, newPokemon);
    });

    payload.selectionIndex = typeof index === 'number' && index > -1
      ? (index + clamp(0, batch.length - 1))
      : (payload.pokemon.length - 1);

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

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: payload,
    };

    applyAutoBoostEffects(playersPayload, field);
    recountRuinAbilities(playersPayload);

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      ...playersPayload,
      field,
    }));

    endTimer('(dispatched)');
  };

  const importPresets: CalcdexContextConsumables['importPresets'] = (
    playerKey,
    presets,
    additionalMutations,
    alwaysAdd,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('importPresets()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId || !state.format) {
      endTimer('(bad state)');

      return 0;
    }

    if (!playerKey || !state[playerKey] || !presets?.length) {
      endTimer('(bad args)');

      return 0;
    }

    if (!state[playerKey]?.active) {
      endTimer('(bad player state)');

      return 0;
    }

    const roleGuesser = new BattleStatGuesser(state.format);
    const validPresets = presets.map((preset) => {
      if (!preset?.calcdexId || !preset.speciesForme) {
        return null;
      }

      const clonedPreset = clonePreset(preset);

      if (!clonedPreset.name) {
        const parts = ['Imported'];

        // just making sure if speciesForme = 'Zacian-Crowned', we don't accept 'Zacian' for the nickname
        if (clonedPreset.nickname && !clonedPreset.speciesForme.includes(clonedPreset.nickname)) {
          parts.push(clonedPreset.nickname);
        } else {
          const guessedRole = roleGuesser.guessRole({
            ...clonedPreset,
            species: clonedPreset.speciesForme,
          });

          if (guessedRole && guessedRole !== '?') {
            parts.push(guessedRole);
          }
        }

        clonedPreset.name = parts.join(' ');
      }

      return clonedPreset;
    }).filter(Boolean);

    if (!validPresets.length) {
      endTimer('(no changes)');

      return 0;
    }

    if (alwaysAdd) {
      const importPayload: Partial<CalcdexPokemon>[] = validPresets.map((preset) => ({
        speciesForme: preset.speciesForme,
        level: preset.level,
        dirtyTeraType: flattenAlt(preset.teraTypes?.[0]),
        dirtyAbility: preset.ability,
        dirtyItem: preset.item,
        nature: preset.nature,
        ivs: populateStatsTable(preset.ivs, { spread: 'iv', format: state.format }),
        evs: populateStatsTable(preset.evs, { spread: 'ev', format: state.format }),
        moves: preset.moves,
        presetId: preset.calcdexId,
        presets: [preset],
        autoPreset: false,
      }));

      addPokemon(playerKey, importPayload, null, scope);
      endTimer('(delegated)');

      return importPayload.length;
    }

    const player = clonePlayer(state[playerKey]);
    const field: Partial<CalcdexBattleField> = {};
    const fieldIndices = [...player.activeIndices, player.selectionIndex].filter((i) => i > -1);
    let importCount = 0;

    validPresets.forEach((preset) => {
      const presetFormes = getPresetFormes(preset.speciesForme, {
        format: state.format,
        source: 'sheet', // note: this is to additionally accept presets w/ speciesForme's in otherFormes[]
      });

      if (!presetFormes.length) {
        return;
      }

      const pokemonIndex = player.pokemon.findIndex((p) => [
        p?.speciesForme,
        ...(p?.altFormes || []),
      ].filter(Boolean).some((f) => presetFormes.includes(f)));

      const pokemon = player.pokemon[pokemonIndex];

      if (!pokemon?.calcdexId) {
        return;
      }

      if (!Array.isArray(pokemon.presets)) {
        pokemon.presets = [];
      }

      // note: this doesn't just support 'import'-sourced presets! applyPreset(), which is the actual handler of the
      // PokeInfo sets dropdown, will call this function with only 1 preset
      if (preset.source === 'import') {
        const existingImport = pokemon.presets.find((p) => p?.calcdexId === preset.calcdexId);

        if (!existingImport?.calcdexId) {
          pokemon.presets.push(preset);
        }
      }

      if (appliedPreset(state.format, pokemon, preset)) {
        if (pokemon.presetId !== preset.calcdexId) {
          pokemon.presetId = preset.calcdexId;
          pokemon.presetSource = preset.source;
          importCount++;
        }

        return;
      }

      const usage = findMatchingUsage(selectPokemonPresets(
        battlePresets.usages,
        pokemon,
        {
          format: state.format,
          formatOnly: true,
          source: 'usage',
          select: 'any',
        },
      ), preset); // note: intentionally passing `preset`, not `pokemon` !!

      const presetPayload = applyPreset(pokemon, preset, { format: state.format, usage });

      /**
       * @todo update when more than 4 moves are supported
       */
      if (state.active && pokemon.source !== 'server' && pokemon.revealedMoves.length === 4) {
        delete presetPayload.moves;
      }

      const mutations = { ...presetPayload, ...additionalMutations?.[preset.calcdexId] };
      const mutated = { ...pokemon, ...mutations };

      mutatePokemon(
        mutated,
        player.pokemon[pokemonIndex],
        mutations,
        fieldIndices.includes(pokemonIndex) ? field : null,
      );

      // forcibly set the presetId & presetSource in case applyPreset() / mutatePokemon() set it to null
      // (which triggers the auto-preset in useCalcdexPresets() -- normally ok, but not desired in this case obvi!)
      mutated.presetId = preset.calcdexId;
      mutated.presetSource = preset.source;

      player.pokemon[pokemonIndex] = mutated;
      importCount++;
    });

    if (!importCount) {
      endTimer('(no changes)');

      return importCount;
    }

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: { pokemon: player.pokemon },
    };

    applyAutoBoostEffects(playersPayload, field);
    recountRuinAbilities(playersPayload);

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      ...playersPayload,
      field,
    }));

    endTimer('(dispatched)');

    return importCount;
  };

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

    const pokemonIndex = state[playerKey].pokemon?.findIndex((p) => p?.calcdexId === pokemon.calcdexId);

    if ((pokemonIndex ?? -1) < 0) {
      return void endTimer('(bad pokemonIndex)');
    }

    const player = clonePlayer(state[playerKey]);
    const prevPokemon = player.pokemon[pokemonIndex];
    const field: Partial<CalcdexBattleField> = {};

    // this is what we'll be replacing the one at pokemonIndex (i.e., the prevPokemon)
    const mutated: CalcdexPokemon = {
      ...prevPokemon,
      ...pokemon,

      // just in case lol
      calcdexId: prevPokemon.calcdexId,
    };

    mutatePokemon(
      mutated,
      prevPokemon,
      pokemon,
      field,
    );

    player.pokemon[pokemonIndex] = mutated;

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: { pokemon: player.pokemon },
    };

    applyAutoBoostEffects(playersPayload, field);
    recountRuinAbilities(playersPayload);

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      ...playersPayload,
      field,
    }));

    endTimer('(dispatched)');
  };

  const removePokemon: CalcdexContextConsumables['removePokemon'] = (
    playerKey,
    pokemonOrId,
    reselectLast,
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

    const field: Partial<CalcdexBattleField> = {};

    applyAutoFieldConditions(payload.pokemon[pokemonIndex], field);

    if (field.autoWeather === state.field?.autoWeather) {
      field.autoWeather = null;
    }

    if (field.autoTerrain === state.field?.autoTerrain) {
      field.autoTerrain = null;
    }

    payload.pokemon.splice(pokemonIndex, 1);

    const activeIndicesIndex = state[playerKey].activeIndices.indexOf(pokemonIndex);

    if (activeIndicesIndex > -1) {
      payload.activeIndices = [...state[playerKey].activeIndices];
      payload.activeIndices.splice(activeIndicesIndex, 1);
    }

    if (state[playerKey].selectionIndex > payload.pokemon.length - 1) {
      payload.selectionIndex = payload.pokemon.length - (reselectLast ? 1 : 0);
    }

    const extendAmount = Math.abs(env.int('honkdex-player-extend-pokemon', 0));
    const maxPokemonPrime = state[playerKey].maxPokemon - extendAmount;

    if (maxPokemonPrime > payload.pokemon.length) {
      payload.maxPokemon = Math.max(
        maxPokemonPrime,
        Math.abs(env.int('honkdex-player-min-pokemon', 0)),
      );
    }

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: payload,
    };

    applyAutoBoostEffects(playersPayload, field);
    recountRuinAbilities(playersPayload);

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      ...playersPayload,
      field,
    }));

    endTimer('(dispatched)');
  };

  const dupePokemon: CalcdexContextConsumables['dupePokemon'] = (
    playerKey,
    pokemonOrId,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('dupePokemon()', scopeFromArgs);
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

    const clonedPokemon = clonePokemon(payload.pokemon[pokemonIndex]);
    const dupedPokemon = reassignPokemon(clonedPokemon, playerKey, true);

    if (dupedPokemon.calcdexId === payload.pokemon[pokemonIndex].calcdexId) {
      return void endTimer('(same calcdexId)');
    }

    addPokemon(playerKey, dupedPokemon, pokemonIndex + 1, scope);
    endTimer('(delegated)');
  };

  const movePokemon: CalcdexContextConsumables['movePokemon'] = (
    sourceKey,
    pokemonOrId,
    destKey,
    index,
    scopeFromArgs,
  ) => {
    // used for debugging purposes only
    const scope = s('movePokemon()', scopeFromArgs);
    const endTimer = runtimer(scope, l);

    if (!state?.battleId) {
      return void endTimer('(bad state)');
    }

    const pokemonId = typeof pokemonOrId === 'string'
      ? pokemonOrId
      : pokemonOrId?.calcdexId;

    const sourcePlayer = (!!sourceKey && state[sourceKey]) || {};
    const destPlayer = (!!destKey && state[destKey]) || {};

    if (!sourcePlayer.active || !destPlayer.active || !pokemonId) {
      return void endTimer('(bad args)');
    }

    const pokemonIndex = sourcePlayer.pokemon.findIndex((p) => p?.calcdexId === pokemonId);

    if (pokemonIndex < 0) {
      return void endTimer('(404 pokemonId)');
    }

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [sourceKey]: { pokemon: [...(sourcePlayer.pokemon || [])] },
      [destKey]: { pokemon: [...(destPlayer.pokemon || [])] },
    };

    const clonedPokemon = clonePokemon(playersPayload[sourceKey].pokemon[pokemonIndex]);
    const movedPokemon = reassignPokemon(clonedPokemon, destKey, true);

    if (movedPokemon.calcdexId === playersPayload[sourceKey].pokemon[pokemonIndex].calcdexId) {
      return void endTimer('(same calcdexId)');
    }

    // note: both sourceLength & destLength below prematurely account for the length change
    // (in order to keep the code pretty)
    const sourceLength = playersPayload[sourceKey].pokemon.length - 1;

    playersPayload[sourceKey].pokemon.splice(pokemonIndex, 1);
    playersPayload[sourceKey].pokemon = playersPayload[sourceKey].pokemon.map((p, i) => ({ ...p, slot: i }));
    playersPayload[sourceKey].maxPokemon = calcMaxPokemon(sourcePlayer, sourceLength);
    playersPayload[sourceKey].selectionIndex = clamp(0, sourcePlayer.selectionIndex, sourceLength - 1);

    const destLength = playersPayload[destKey].pokemon.length + 1;
    const destIndex = clamp(0, index ?? destPlayer.selectionIndex + 1, destLength - 1);

    playersPayload[destKey].pokemon.splice(destIndex, 0, movedPokemon);
    playersPayload[destKey].pokemon = playersPayload[destKey].pokemon.map((p, i) => ({ ...p, slot: i }));
    playersPayload[destKey].maxPokemon = calcMaxPokemon(destPlayer, destLength);
    playersPayload[destKey].selectionIndex = destIndex;

    [
      sourceKey,
      destKey,
    ].filter((pkey) => (
      playersPayload[pkey].selectionIndex !== (pkey === sourceKey ? sourcePlayer : destPlayer).selectionIndex
    )).forEach((pkey) => {
      const prevPlayer = pkey === sourceKey ? sourcePlayer : destPlayer;
      const player: CalcdexPlayer = { ...prevPlayer, ...playersPayload[pkey] };

      if (state.gen === 1) {
        const sanitized = sanitizePlayerSide(state.gen, player);

        playersPayload[pkey].side = {
          ...prevPlayer.side,
          isReflect: sanitized.isReflect,
          isLightScreen: sanitized.isLightScreen,
        };

        return;
      }

      if (state.gen < 9) {
        return;
      }

      if (state.gameType === 'Singles') {
        // note: directly mutates the player.pokemon[] reference, which is playersPayload[pkey].pokemon[]
        // (ya ya ik it's bad API design; I'll clean this up one day... LOL)
        toggleRuinAbilities(
          player,
          state.gameType,
          null,
          playersPayload[pkey].selectionIndex,
        );
      }

      // playersPayload[pkey].side = {
      //   ...prevPlayer.side,
      //   ...countSideRuinAbilities(player),
      // };
    });

    applyAutoBoostEffects(playersPayload);
    recountRuinAbilities(playersPayload);

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.update({
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

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
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
    };

    applyAutoBoostEffects(playersPayload);
    recountRuinAbilities(playersPayload);

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      ...playersPayload,
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

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {};
    const updatedField: CalcdexBattleField = { ...state.field, ...field };

    if (state.gen > 8 && ('dirtyWeather' in field || 'dirtyTerrain' in field)) {
      const weather = (updatedField.dirtyWeather ?? (updatedField.autoWeather || updatedField.weather)) || null;
      const terrain = (updatedField.dirtyTerrain ?? (updatedField.autoTerrain || updatedField.terrain)) || null;

      AllPlayerKeys.forEach((playerKey) => {
        const playerState = state[playerKey];

        if ((state.operatingMode === 'battle' && !playerState?.active) || !playerState.pokemon?.length) {
          return;
        }

        const retoggleIds = playerState.pokemon
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
            weather,
            terrain,
          });
        });

        playersPayload[playerKey] = {
          pokemon,
        };
      });
    }

    applyAutoBoostEffects(playersPayload, updatedField);
    recountRuinAbilities(playersPayload);

    if (state.operatingMode === 'standalone' && state.name) {
      queueHonkSave();
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      ...playersPayload,
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

    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: {
        activeIndices,
        pokemon: cloneAllPokemon(state[playerKey].pokemon).map((p, i) => ({
          ...p,
          active: activeIndices.includes(i),
        })),
      },
    };

    applyAutoBoostEffects(playersPayload);
    recountRuinAbilities(playersPayload);

    dispatch(calcdexSlice.actions.updatePlayer({
      scope,
      battleId: state.battleId,
      ...playersPayload,
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
      active: player.active,
      pokemon: player.pokemon,
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
            state.gameType === 'Doubles' && player.activeIndices.length < 2 && activeIndicesIndex < 0 ? 0 : 1,
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
    if (state.gen > 8) {
      toggleRuinAbilities(
        player,
        state.gameType,
        true,
        playerPayload.selectionIndex,
      );

      playerPayload.pokemon = player.pokemon;
    }

    playerPayload.side = clonePlayerSide(player.side);

    // note: in gen 1, field conditions (i.e., only Reflect & Light Screen) are volatiles applied to the Pokemon itself
    if (state.gen === 1) {
      const sanitized = sanitizePlayerSide(
        state.gen,
        player,
      );

      playerPayload.side.isReflect = sanitized.isReflect;
      playerPayload.side.isLightScreen = sanitized.isLightScreen;
    }

    // ;-;
    const playersPayload: Partial<Record<CalcdexPlayerKey, Partial<CalcdexPlayer>>> = {
      [playerKey]: playerPayload,
    };

    // now we do a thing for auto-toggling Stakeout lmao
    // hmm... I feel kinda disgusted after writing this bit lol
    const getPlayerSource = (
      pkey: CalcdexPlayerKey,
    ) => (pkey === playerKey ? playerPayload : state[pkey]);

    const pkeys = [state.playerKey, state.opponentKey].filter((pkey) => {
      const playerSource = getPlayerSource(pkey);

      return (state.operatingMode !== 'battle' || playerSource?.active) && !!playerSource.pokemon?.length;
    });

    // warning: removing the initial null field auto-* values below will prevent them from auto-clearing!
    // (just a note to myself, really lolol)
    const field: Partial<CalcdexBattleField> = {
      autoWeather: null,
      autoTerrain: null,
    };

    // update (2024/07/26): field conditions should be determined first for both sides' selections, otherwise, the 'Sun'
    // autoWeather brought up by, say, Koraidon's Oricalcum Pulse will be set to null when the 'Electric' autoTerrain is
    // brought up by, say, Miraidon's Hadron Engine ... LOL
    pkeys.forEach((pkey) => {
      const playerSource = getPlayerSource(pkey);
      const pokemon = playerSource?.pokemon?.[playerSource?.selectionIndex];

      applyAutoFieldConditions(pokemon, field);
    });

    if (!pkeys.length) {
      delete field.autoWeather;
      delete field.autoTerrain;
    }

    const nextField: CalcdexBattleField = { ...state.field, ...field };
    const weather = (nextField.dirtyWeather ?? (nextField.autoWeather || nextField.weather)) || null;
    const terrain = (nextField.dirtyTerrain ?? (nextField.autoTerrain || nextField.terrain)) || null;

    (pkeys[0] === playerKey ? pkeys : pkeys.reverse()).forEach((pkey) => {
      const playerSource = pkey === playerKey ? playerPayload : state[pkey];
      const opponentKey = pkey === state.playerKey ? state.opponentKey : state.playerKey;
      const opponent = opponentKey === playerKey ? playerPayload : state[opponentKey];
      const opponentPokemon = opponent?.pokemon?.[opponent?.selectionIndex];

      playerSource.pokemon.forEach((pokemon, i) => {
        // update (2023/11/13): though detectToggledAbility() handles Ruin abilities, we don't want that here!
        const ability = pokemon.dirtyAbility || pokemon.ability;

        if (PokemonRuinAbilities.includes(ability)) {
          return;
        }

        const toggled = detectToggledAbility(pokemon, {
          gameType: state.gameType,
          opponentPokemon,
          selectionIndex: pkey === playerKey ? playerPayload.selectionIndex : opponent?.selectionIndex,
          weather,
          terrain,
        });

        if (pokemon.abilityToggled === toggled) {
          return;
        }

        if (!Array.isArray(playersPayload[pkey]?.pokemon)) {
          playersPayload[pkey] = {
            ...playersPayload[pkey],
            pokemon: cloneAllPokemon(playerSource.pokemon),
          };
        }

        playersPayload[pkey].pokemon[pokemon.slot ?? i].abilityToggled = toggled;
      });
    });

    applyAutoBoostEffects(playersPayload, field);
    recountRuinAbilities(playersPayload);

    // shitty way of removing any battle-reported field conditions that may remain
    if (state.operatingMode === 'standalone') {
      if (nextField.weather) {
        field.weather = null;
      }

      if (nextField.terrain) {
        field.terrain = null;
      }
    }

    dispatch(calcdexSlice.actions.update({
      scope,
      battleId: state.battleId,
      ...playersPayload,
      field,
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
    assignPlayer,
    assignOpponent,
    addPokemon,
    importPresets,
    updatePokemon,
    removePokemon,
    dupePokemon,
    movePokemon,
    updateSide,
    updateField,
    activatePokemon,
    selectPokemon,
    autoSelectPokemon,
    saveHonk: queueHonkSave,
  };
};
