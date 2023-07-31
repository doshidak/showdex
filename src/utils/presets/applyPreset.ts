import {
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
  type CalcdexPokemonUsageAlt,
} from '@showdex/redux/store';
import { mergeRevealedMoves } from '@showdex/utils/battle';
import { nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, detectLegacyGen, hasMegaForme } from '@showdex/utils/dex';
import { detectUsageAlt } from './detectUsageAlt';
import { flattenAlt, flattenAlts } from './flattenAlts';
import { sortUsageAlts } from './sortUsageAlts';
import { usageAltPercentFinder } from './usageAltPercentFinder';
import { usageAltPercentSorter } from './usageAltPercentSorter';

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
  format: string,
  pokemon: CalcdexPokemon,
  preset: CalcdexPokemonPreset,
  usage?: CalcdexPokemonPreset,
): Partial<CalcdexPokemon> => {
  const gen = detectGenFromFormat(format);

  if (!gen || !preset?.calcdexId || !pokemon?.calcdexId || !pokemon.speciesForme) {
    return null;
  }

  const legacy = detectLegacyGen(gen);
  const defaultIv = legacy ? 30 : 31;
  const defaultEv = legacy ? 252 : 0;

  // this will be our final return value
  const output: Partial<CalcdexPokemon> = {
    calcdexId: pokemon.calcdexId,
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

    // not specifying the defaultEv's may cause any unspecified EVs to remain!
    evs: {
      hp: preset.evs?.hp ?? defaultEv,
      atk: preset.evs?.atk ?? defaultEv,
      def: preset.evs?.def ?? defaultEv,
      spa: preset.evs?.spa ?? defaultEv,
      spd: preset.evs?.spd ?? defaultEv,
      spe: preset.evs?.spe ?? defaultEv,
    },
  };

  // update (2023/02/02): for Mega Pokemon, we may need to remove the dirtyItem set from the preset
  // if the preset was for its non-Mega forme (since they could have different abilities)
  if (hasMegaForme(pokemon.speciesForme) && !hasMegaForme(preset.speciesForme)) {
    delete output.dirtyAbility;
  }

  const didRevealTeraType = !!pokemon.revealedTeraType && pokemon.revealedTeraType !== '???';
  const altTeraTypes = preset.teraTypes?.filter((t) => !!t && flattenAlt(t) !== '???');

  // check if we have Tera typing usage data
  const teraTypesUsage = usage?.teraTypes?.filter(detectUsageAlt);

  if (teraTypesUsage?.length) {
    // update the teraType to the most likely one after sorting
    output.altTeraTypes = teraTypesUsage.sort(sortUsageAlts);

    if (!didRevealTeraType) {
      [output.teraType] = output.altTeraTypes[0] as CalcdexPokemonUsageAlt<Showdown.TypeName>;
    }
  } else if (altTeraTypes?.[0]) {
    // apply the first teraType from the preset's teraTypes
    if (!didRevealTeraType) {
      [output.teraType] = flattenAlts(altTeraTypes);
    }

    output.altTeraTypes = altTeraTypes;
  }

  // don't apply the dirtyAbility/dirtyItem if we're applying the Pokemon's first preset and
  // their abilility/item was already revealed or it matches the Pokemon's revealed ability/item
  // const clearDirtyAbility = (!pokemon.presetId && pokemon.ability)
  //   || pokemon.ability === preset.ability;

  // update (2022/10/07): don't apply the dirtyAbility/dirtyItem at all if their non-dirty
  // counterparts are revealed already
  // const clearDirtyAbility = !!pokemon.ability && !pokemon.transformedForme;

  // update (2023/02/07): always clear the dirtyAbility from the preset if its actual ability
  // has been already revealed (even when transformed)
  const clearDirtyAbility = !!pokemon.ability;

  if (clearDirtyAbility) {
    output.dirtyAbility = null;
  }

  // const clearDirtyItem = (!pokemon.presetId && pokemon.item && pokemon.item !== '(exists)')
  //   || pokemon.item === preset.item
  //   || (!pokemon.item && pokemon.prevItem && pokemon.prevItemEffect);
  const clearDirtyItem = (pokemon.item && pokemon.item !== '(exists)')
    || (pokemon.prevItem && pokemon.prevItemEffect);

  if (clearDirtyItem) {
    output.dirtyItem = null;
  }

  if (preset.altAbilities?.length) {
    output.altAbilities = [...preset.altAbilities];

    // apply the top usage ability (if available)
    const abilityUsageAvailable = usage?.altAbilities?.length > 1
      && output.altAbilities?.length > 1
      && !clearDirtyAbility;

    if (abilityUsageAvailable) {
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
    const itemUsageAvailable = usage?.altItems?.length > 1
      && output.altItems?.length > 1
      && !clearDirtyItem;

    if (itemUsageAvailable) {
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
    const moveUsageAvailable = usage?.altMoves?.length > 1
      && output.altMoves?.length > 1;

    if (moveUsageAvailable) {
      const sorter = usageAltPercentSorter(usageAltPercentFinder(usage.altMoves));
      const sortedMoves = flattenAlts(output.altMoves).sort(sorter);

      if (sortedMoves.length) {
        output.altMoves = sortedMoves;

        /**
         * @todo Needs to be updated once we support more than 4 moves.
         */
        output.moves = sortedMoves.slice(0, 4);
      }
    }
  }

  // check if we already have revealed moves (typical of spectating or replaying a battle)
  // update (2023/02/03): merging all of the output to provide altMoves[] (for Hidden Power moves)
  // update (2023/07/27): not handling transformedMoves here anymore since it's handled in mergeRevealedMoves()
  output.moves = mergeRevealedMoves({
    ...pokemon,
    ...output,
  });

  // only apply the ability/item (& remove their dirty counterparts) if there's only
  // 1 possible ability/item in the pool (& their actual ability/item hasn't been revealed)
  // update (2022/10/06): nvm on the setting the actual ability/item cause it's screwy when switching formes,
  // so opting to use their dirty counterparts instead lol
  // if (preset.format?.includes('random')) {
  //   // apply the Gmax forme if that's all we have random sets for (cause they're most likely Gmax)
  //   if (preset.speciesForme.endsWith('-Gmax')) {
  //     output.speciesForme = preset.speciesForme;
  //   }
  //
  //   if (!clearDirtyAbility && output.altAbilities?.length === 1) {
  //     [output.dirtyAbility] = flattenAlts(output.altAbilities);
  //     // output.dirtyAbility = null;
  //   }
  //
  //   if (!pokemon.item && !pokemon.prevItem && output.altItems?.length === 1) {
  //     [output.dirtyItem] = flattenAlts(output.altItems);
  //     // output.dirtyItem = null;
  //   }
  // }

  // carefully apply the spread if Pokemon is transformed and a spread was already present prior
  const shouldTransformSpread = !!pokemon.transformedForme
    && !!pokemon.nature
    && nonEmptyObject(Object.values({ ...pokemon.ivs, ...pokemon.evs }).filter(Boolean));

  if (shouldTransformSpread) {
    // since transforms inherit the exact stats of the target Pokemon (except for HP),
    // we actually need to copy the nature from the preset
    // delete output.nature;

    // we'll keep the original HP EVs/IVs (even if possibly illegal) since the max HP
    // of a transformed Pokemon is preserved, which is based off of the HP's base, IV & EV
    output.ivs.hp = pokemon.ivs.hp;
    output.evs.hp = pokemon.evs.hp;

    // if the Pokemon has an item set by a previous preset, ignore this preset's item
    if (pokemon.dirtyItem || pokemon.item) {
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

  // apply the defaultShowGenetics setting if the `pokemon` is serverSourced
  // update (2022/11/15): defaultShowGenetics is deprecated in favor of lockGeneticsVisibility;
  // showGenetics's initial value is set in syncBattle() when the `pokemon` is first init'd into Redux
  // if (pokemon.serverSourced) {
  //   output.showGenetics = settings?.defaultShowGenetics?.auth;
  // }

  // if the applied preset doesn't have a completed EV/IV spread, forcibly show them
  const forceShowGenetics = !pokemon.showGenetics && (
    !Object.values(output.ivs || {}).reduce((sum, val) => sum + (val || 0), 0)
      || (!legacy && !Object.values(output.evs || {}).reduce((sum, val) => sum + (val || 0), 0))
  );

  if (forceShowGenetics) {
    output.showGenetics = true;
  }

  return output;
};
