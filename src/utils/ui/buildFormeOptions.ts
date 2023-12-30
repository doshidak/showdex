import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemon, type CalcdexPokemonPreset, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
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
    usages?: CalcdexPokemonPreset[];
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
    usages,
  } = config || {};

  // build the usage alts, if provided from usages[]
  // e.g., [['Great Tusk', 0.3739], ['Kingambit', 0.3585], ['Dragapult', 0.0746], ...]
  const formeAlts: CalcdexPokemonUsageAlt<string>[] = usages
    ?.filter((u) => !!u?.speciesForme && !!u.formeUsage)
    .map((u) => [u.speciesForme, u.formeUsage]);

  const findUsagePercent = usageAltPercentFinder(formeAlts, true);
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

    let forme = tier;

    if (Array.isArray(tier)) {
      if (tier[0] === 'header' && tier[1]) {
        tierMap[tier[1]] = [];
      }

      // typically from tierSet[], copied from tiers[] by the Teambuilder o_O
      if (tier[0] === 'pokemon' && tier[1]) {
        [, forme] = tier;
      }
    }

    const dexSpecies = dex.species.get(forme as string);
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
