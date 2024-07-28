import {
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  type CalcdexPokemonUsageAlt,
} from '@showdex/interfaces/calc';
import { mergeRevealedMoves, sanitizePokemon } from '@showdex/utils/battle';
import { calcPokemonSpreadStats, populateStatsTable } from '@showdex/utils/calc';
import { formatId } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import {
  detectGenFromFormat,
  detectLegacyGen,
  determineDefaultLevel,
  legalLockedFormat,
} from '@showdex/utils/dex';
import { detectCompletePreset } from './detectCompletePreset';
import { detectUsageAlt, detectUsageAlts } from './detectUsageAlt';
import { flattenAlt, flattenAlts } from './flattenAlts';
import { getPresetFormes } from './getPresetFormes';
import { sortUsageAlts } from './sortUsageAlts';
import { usageAltPercentFinder } from './usageAltPercentFinder';
import { usageAltPercentSorter } from './usageAltPercentSorter';

// const l = logger('@showdex/utils/presets/applyPreset()');

/**
 * Applies the provided `CalcdexPokemonPreset` to the provided `pokemon`.
 *
 * * Providing the optional `usage` preset will sort `altAbilities[]` & `altItems[]` based on usage.
 * * Returns a partial `CalcdexPokemon` only containing properties that need to be changed.
 *   - This is designed so that the return value can be passed directly as the dispatch payload.
 * * Additionally, this returns `null` if preset application fails for whatever reason.
 * * Was originally in `PokeCalc`, which was then later abstracted into `CalcdexPokeProvider`,
 *   then finally making its way here.
 *
 * @since 0.1.3
 */
export const applyPreset = (
  pokemon: CalcdexPokemon,
  preset: CalcdexPokemonPreset,
  config: {
    format: string;
    usage?: CalcdexPokemonPreset;
    alwaysMergeMoves?: boolean;
  },
): Partial<CalcdexPokemon> => {
  const {
    format,
    usage,
    alwaysMergeMoves,
  } = { ...config };

  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  if (!gen || !preset?.calcdexId || !pokemon?.calcdexId || !pokemon.speciesForme) {
    return null;
  }

  const legal = legalLockedFormat(format);
  const defaultLevel = determineDefaultLevel(format);

  // this will be our final return value
  const output: Partial<CalcdexPokemon> = {
    calcdexId: pokemon.calcdexId,

    // update (2023/10/15): now conditionally setting this at the end, depending if the provided `preset` is a full set
    // (handles incomplete presets converted from OTS in battle)
    // presetId: preset.calcdexId,

    // update (2023/02/02): specifying empty arrays for the alt properties to clear them for
    // the new preset (don't want alts from a previous set to persist if none are defined)
    level: pokemon.level || preset.level || defaultLevel,
    altTeraTypes: [],
    altAbilities: [],
    dirtyAbility: preset.ability,
    nature: preset.nature,
    altItems: [],
    dirtyItem: preset.item,
    moves: preset.moves,
    altMoves: [],
    usageMoves: [],
    ivs: populateStatsTable(preset.ivs, { spread: 'iv', format }),
    evs: populateStatsTable(preset.evs, { spread: 'ev', format }),
  };

  if (usage?.calcdexId) {
    output.usageId = usage.calcdexId;
  }

  // update (2024/01/03): shouldn't apply the level if the `pokemon` isn't being `'user'`-handled, i.e., in a battle
  // (was causing server-sourced Pokemon to be level 100 vs. level 50 client-sourced ones in VGC LOL... oopsies)
  if (pokemon.source !== 'user') {
    delete output.level;
  }

  const transformed = !!pokemon.transformedForme;
  const speciesFormes = getPresetFormes(pokemon.speciesForme, { format, source: preset.source });
  const formeKey = transformed && !speciesFormes.includes(preset.speciesForme) ? 'transformedForme' : 'speciesForme';
  const currentForme = pokemon[formeKey];

  // determine if this preset reveals actual info
  const revealingPreset = ['server', 'sheet'].includes(preset.source)
    && (!transformed || speciesFormes.includes(preset.speciesForme));

  // determine if we have a completed preset (to distinguish partial presets w/o any spreads derived from OTS)
  const completePreset = detectCompletePreset(preset);

  // update to the speciesForme (& update relevant info) if different
  const shouldUpdateSpecies = currentForme !== preset.speciesForme
    && !speciesFormes.includes(currentForme);

  if (shouldUpdateSpecies) {
    output[formeKey] = preset.speciesForme;
  }

  const didRevealTeraType = !!pokemon.teraType && pokemon.teraType !== '???';
  const altTeraTypes = preset.teraTypes?.filter((t) => !!t && flattenAlt(t) !== '???');

  // check if we have Tera typing usage data
  const teraTypesUsage = usage?.teraTypes?.filter(detectUsageAlt);

  if (teraTypesUsage?.length) {
    // update the teraType to the most likely one after sorting
    output.altTeraTypes = teraTypesUsage.sort(sortUsageAlts);

    if (!didRevealTeraType) {
      [output.dirtyTeraType] = output.altTeraTypes[0] as CalcdexPokemonUsageAlt<Showdown.TypeName>;
    }
  } else if (altTeraTypes?.[0]) {
    // apply the first teraType from the preset's teraTypes
    if (!didRevealTeraType) {
      [output.dirtyTeraType] = flattenAlts(altTeraTypes);
    }

    output.altTeraTypes = altTeraTypes;
  }

  // update (2023/02/07): always clear the dirtyAbility from the preset if its actual ability
  // has been already revealed (even when transformed)
  const clearDirtyAbility = !!pokemon.ability || formatId(output.dirtyAbility) === 'noability';

  if (clearDirtyAbility) {
    output.dirtyAbility = null;
  }

  const clearDirtyItem = (pokemon.item && formatId(pokemon.item) !== 'exists')
    || (pokemon.prevItem && pokemon.prevItemEffect);

  if (clearDirtyItem) {
    output.dirtyItem = null;
  }

  if (preset.altAbilities?.length) {
    output.altAbilities = [...preset.altAbilities].filter((a) => !!a && formatId(flattenAlt(a)) !== 'noability');

    // apply the top usage ability (if available)
    const shouldApplyTopAbility = detectUsageAlts(usage?.altAbilities)
      && usage.altAbilities.length > 1
      && output.altAbilities.length > 1
      && !clearDirtyAbility;

    if (shouldApplyTopAbility) {
      // update (2023/01/06): can't actually use sortedAbilitiesByUsage() since it may use usage from a prior set
      // (only a problem in Gen 9 Randoms since there are multiple "usages" due to the role system, so the sorters
      // will be referencing the current role's usage and not the one we're trying to switch to... if that makes sense lol)
      const sorter = usageAltPercentSorter(usageAltPercentFinder(usage.altAbilities));
      const sortedAbilities = flattenAlts(usage.altAbilities).sort(sorter);
      const [topAbility] = sortedAbilities;

      if (sortedAbilities.length === output.altAbilities.length) {
        output.altAbilities = sortedAbilities;
      }

      if (topAbility && output.dirtyAbility !== topAbility) {
        output.dirtyAbility = topAbility;
      }
    }
  }

  if (preset.altItems?.length) {
    output.altItems = [...preset.altItems];

    // apply the top usage item (if available)
    const shouldApplyTopItem = detectUsageAlts(usage?.altItems)
      && usage.altItems.length > 1
      && output.altItems?.length > 1
      && !clearDirtyItem;

    if (shouldApplyTopItem) {
      const sorter = usageAltPercentSorter(usageAltPercentFinder(usage.altItems));
      const sortedItems = flattenAlts(output.altItems).sort(sorter);
      const [topItem] = sortedItems;

      if (sortedItems.length === output.altItems.length) {
        output.altItems = sortedItems;
      }

      if (topItem && output.dirtyItem !== topItem) {
        output.dirtyItem = topItem;
      }
    }
  }

  if (preset.altMoves?.length) {
    output.altMoves = [...preset.altMoves];

    // sort the moves by their usage stats (if available) and apply the top 4 moves
    // (otherwise, just apply the moves from the preset)
    const shouldSortTopMoves = detectUsageAlts(usage?.altMoves)
      && usage.altMoves.length > 1
      && output.altMoves?.length > 1;

    if (shouldSortTopMoves) {
      const sorter = usageAltPercentSorter(usageAltPercentFinder(usage.altMoves));
      const sortedMoves = flattenAlts(output.altMoves).sort(sorter);

      if (sortedMoves.length) {
        output.altMoves = sortedMoves;

        /**
         * @todo Needs to be updated once we support more than 4 moves.
         */
        if (!revealingPreset) {
          // note: output.moves[] will be overwritten again if shouldMergeMoves is determined to be true
          output.moves = sortedMoves.slice(0, 4);
        }
      }

      output.usageMoves = usage.altMoves as typeof output.usageMoves;
    }
  }

  // carefully apply the spread if Pokemon is transformed and a spread was already present prior
  const shouldTransformSpread = transformed
    && !!pokemon.nature
    && !!Object.values({ ...pokemon.ivs, ...pokemon.evs }).filter(Boolean).length;

  if (shouldTransformSpread) {
    // since transforms inherit the exact stats of the target Pokemon (except for HP),
    // we actually need to copy the nature from the preset
    // delete output.nature;

    // we'll keep the original HP EVs/IVs (even if possibly illegal) since the max HP
    // of a transformed Pokemon is preserved, which is based off of the HP's base, IV & EV
    output.ivs.hp = pokemon.ivs.hp;
    output.evs.hp = pokemon.evs.hp;

    // if the Pokemon has an item set by a previous preset, ignore this preset's item
    if (pokemon.item || pokemon.dirtyItem) {
      delete output.dirtyItem;
    }
  }

  // only remove the dirtyAbility/dirtyItem from the output if they're undefined (but not null)
  // (means that the preset didn't define the ability/item, hence the undefined)
  if (output.dirtyAbility === undefined) {
    delete output.dirtyAbility;
  }

  if (output.dirtyItem === undefined) {
    delete output.dirtyItem;
  }

  // determine if we should be updating the actual info instead of the dirty ones
  if (revealingPreset) {
    if (!pokemon.teraType && preset.teraTypes?.length) {
      [output.teraType] = flattenAlts(preset.teraTypes);
      output.dirtyTeraType = null;
    }

    if (output.dirtyAbility && !pokemon.ability) {
      output.ability = output.dirtyAbility;
      output.dirtyAbility = null;
    }

    if (output.dirtyItem && (!pokemon.item || !pokemon.prevItem)) {
      output.item = output.dirtyItem;
      output.dirtyItem = null;
    }

    if (output.moves.length) {
      output[transformed ? 'transformedMoves' : 'revealedMoves'] = [...output.moves];
    }
  }

  const sanitized = sanitizePokemon({ ...pokemon, ...output }, format);

  if (currentForme !== output[formeKey]) {
    const {
      altFormes,
      types,
      abilities,
      baseStats,
      transformedAbilities,
      transformedBaseStats,
    } = sanitized;

    output.types = types;
    output.altFormes = altFormes;

    if (transformed) {
      output.transformedAbilities = transformedAbilities;
      output.transformedBaseStats = transformedBaseStats;
    } else {
      output.abilities = abilities;
      output.baseStats = baseStats;
    }
  }

  const shouldClearDirtyAbility = legal
    && !!output.dirtyAbility
    && ![...sanitized.abilities, ...sanitized.transformedAbilities].includes(output.dirtyAbility);

  if (shouldClearDirtyAbility) {
    delete output.dirtyAbility;
  }

  if (!pokemon.ability && sanitized.abilityToggled) {
    output.abilityToggled = sanitized.abilityToggled;
  }

  const shouldMergeMoves = alwaysMergeMoves
    || (pokemon.source === 'client' && !['import', 'server', 'sheet', 'user'].includes(preset.source))
    || (revealingPreset && !completePreset) // probably an OTS (Open Team Sheet)
    || (transformed && !!pokemon.transformedMoves?.length);

  if (shouldMergeMoves) {
    /**
     * @todo update this when we support more than 4 moves
     */
    output.moves = transformed && pokemon.transformedMoves.length === 4
      ? [...pokemon.transformedMoves] // preserves the order
      : mergeRevealedMoves({ ...pokemon, ...output }, { format });
  }

  // in legacy gens, make sure SPA & SPD always equal (for SPC)
  // (otherwise, the `gen12` mechanics file in @smogon/calc will throw an Error(), crashing the Calcdex!)
  if (legacy) {
    if (typeof output.ivs.spa === 'number') {
      output.ivs.spd = output.ivs.spa;
    } else if (typeof output.ivs.spd === 'number') {
      output.ivs.spa = output.ivs.spd;
    }

    if (typeof output.evs.spa === 'number') {
      output.evs.spd = output.evs.spa;
    } else if (typeof output.evs.spd === 'number') {
      output.evs.spa = output.evs.spd;
    }
  }

  // update (2023/10/15): only apply the presetId if we have a complete preset (in case we're applying an OTS preset,
  // which won't have any EVs/IVs, so we'll still have to rely on spreads from other presets)
  if (completePreset) {
    output.presetId = preset.calcdexId;
    output.presetSource = preset.source;
    output.spreadStats = calcPokemonSpreadStats(format, { ...pokemon, ...output });

    if (revealingPreset) {
      output.autoPreset = false;
      output.autoPresetId = preset.calcdexId;
    }

    return output;
  }

  // by this point, we don't have a complete preset, so most likely from an OTS
  if (preset.source === 'sheet') {
    delete output.ivs;
    delete output.evs;

    // if the nature's Hardy here, it's probably just the default value (aka garbaj throw it out)
    if (output.nature === 'Hardy') {
      delete output.nature;
    }

    return output;
  }

  // if the applied preset doesn't have a completed EV/IV spread, forcibly show them
  if (pokemon.source !== 'server' && !pokemon.showGenetics) {
    output.showGenetics = true;
  }

  // if the Pokemon currently has a preset applied, visibly clear it
  // (this should spin-up the auto-preset effect in useCalcdexPresets() or something lol)
  if (pokemon.presetId) {
    output.presetId = null;
    output.presetSource = null;
  }

  return output;
};
