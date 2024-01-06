import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemon, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getDexForFormat, guessTableFormatKey, guessTableFormatSlice } from '@showdex/utils/dex';
import { usageAltPercentFinder, usageAltPercentSorter } from '@showdex/utils/presets';

export type CalcdexPokemonFormeOption = DropdownOption<string>;

// const l = logger('@showdex/utils/ui/buildFormeOptions()');

/**
 * Builds the `options[]` prop for the species forme `Dropdown` in `PokeInfo`.
 *
 * @since 1.2.0
 */
export const buildFormeOptions = (
  format: string,
  config?: {
    pokemon?: CalcdexPokemon;
    formeUsages?: CalcdexPokemonUsageAlt<string>[];
  },
): CalcdexPokemonFormeOption[] => {
  const options: CalcdexPokemonFormeOption[] = [];

  if (!format || !nonEmptyObject(BattleTeambuilderTable)) {
    return options;
  }

  const formatKey = guessTableFormatKey(format);
  const sliceKey = guessTableFormatSlice(format) || 'OU';

  const sourceTable = BattleTeambuilderTable[formatKey] || BattleTeambuilderTable;
  const sliceIndex = sourceTable?.formatSlices?.[sliceKey] || 0;

  // note: when you open the Teambuilder & have it show you the list of Pokemon, it'll under-the-hood move tiers[] into
  // a new property called tierSet[] & set tiers[] to null o_O not sure if that's a bug or some backwards compatibility
  const tiers = [
    ...((sourceTable?.tiers || sourceTable?.tierSet)?.slice(sliceIndex) || []),
  ];

  // l.debug(
  //   'format', format, 'formatKey', formatKey, 'sliceKey', sliceKey,
  //   '\n', 'sliceIndex', sliceIndex, 'tiers', tiers,
  // );

  if (!tiers?.length) {
    return options;
  }

  const dex = getDexForFormat(format);

  const {
    pokemon,
    formeUsages,
  } = config || {};

  const findUsagePercent = usageAltPercentFinder(formeUsages, true);
  const usageSorter = usageAltPercentSorter(findUsagePercent);

  const {
    altFormes,
    transformedForme,
  } = pokemon || {};

  const filterFormes: string[] = [];

  if (altFormes?.length) {
    const sortedAltFormes = [...altFormes].sort(usageSorter);

    options.push({
      label: (!!transformedForme && 'Transformed') || 'Formes',
      options: sortedAltFormes.map((forme) => ({
        value: forme,
        label: forme,
        rightLabel: findUsagePercent(forme),
      })),
    });

    filterFormes.push(...altFormes);
  }

  const tierMap: Record<string, string[]> = {
    Other: [],
  };

  tiers.forEach((tier) => {
    if (!tier) {
      return;
    }

    // update (2024/01/05): somehow I didn't notice that I had to type asset `forme` below, just because I hid all the union'd
    // types under Showdown.BattleTeambuilderTier, so that solves the mysterious 'header,OU' Pokemon in the Honkdex HAHAHA
    let forme: string = (typeof tier === 'string' && tier) || null;

    if (Array.isArray(tier)) {
      if (tier[0] === 'header' && tier[1] && !Array.isArray(tierMap[tier[1]])) {
        tierMap[tier[1]] = [];
      }

      // typically from tierSet[], copied from tiers[] by the Teambuilder o_O
      if (tier[0] === 'pokemon' && tier[1]) {
        [, forme] = tier;
      }
    }

    if (!forme) {
      return;
    }

    const dexSpecies = dex.species.get(forme);
    const { exists, name: formeName } = dexSpecies || {};

    if (!exists || filterFormes.includes(formeName)) {
      return;
    }

    const [lastTier] = Object.keys(tierMap).slice(-1);

    if (!Array.isArray(tierMap[lastTier])) {
      return;
    }

    tierMap[lastTier].push(formeName);
    filterFormes.push(formeName);
  });

  Object.entries(tierMap).forEach(([
    tier,
    speciesFormes,
  ]) => {
    if (!tier || tier === 'Other' || !speciesFormes?.length) {
      return;
    }

    const sortedFormes = [...speciesFormes].sort(usageSorter);

    options.push({
      label: tier,
      options: sortedFormes.map((name) => ({
        value: name,
        label: name,
        rightLabel: findUsagePercent(name),
      })),
    });
  });

  if (tierMap.Other.length) {
    const sortedFormes = [...tierMap.Other].sort(usageSorter);

    options.push({
      label: 'Other',
      options: sortedFormes.map((name) => ({
        value: name,
        label: name,
        rightLabel: findUsagePercent(name),
      })),
    });
  }

  return options;
};
