import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemon, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import {
  detectDoublesFormat,
  getDexForFormat,
  guessTableFormatKey,
  guessTableFormatSlice,
} from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';
import { type CalcdexPokemonUsageAltSorter, detectUsageAlt, flattenAlt } from '@showdex/utils/presets';

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
    speciesForme?: CalcdexPokemon['speciesForme'];
    altFormes?: CalcdexPokemon['altFormes'];
    transformedForme?: CalcdexPokemon['transformedForme'];
    usageAlts?: CalcdexPokemonUsageAlt<string>[];
    usageFinder?: (value: string) => string;
    usageSorter?: CalcdexPokemonUsageAltSorter<string>;
    translate?: (value: string) => string;
    translateHeader?: (value: string) => string;
  },
): CalcdexPokemonFormeOption[] => {
  const options: CalcdexPokemonFormeOption[] = [];

  if (!format || !nonEmptyObject(BattleTeambuilderTable)) {
    return options;
  }

  // CAP requires special handling (separated as to not make KnownFormatSlices in getTableFormatSlice() even more complex)
  const cappin = format.includes('cap');
  const formatKey = guessTableFormatKey(format);
  const sliceKeys = guessTableFormatSlice(format);

  const sourceTable = BattleTeambuilderTable[formatKey] || BattleTeambuilderTable;
  const slices = sourceTable?.formatSlices || {};
  const sliceKey = sliceKeys.find((k) => k.startsWith('CAP') || !!slices[k]);
  const sliceIndex = sliceKey ? ((!sliceKey.startsWith('CAP') && slices[sliceKey]) || 0) : -1;

  // note: when you open the Teambuilder & have it show you the list of Pokemon, it'll under-the-hood move tiers[] into
  // a new property called tierSet[] & set tiers[] to null o_O not sure if that's a bug or some backwards compatibility
  // update (2024/01/05): nope actually mystery was solved; there's explicit code in battle-dex-search.ts that builds
  // tierSet[] from tiers[] & sets tiers = null (by object reference) ... LOL (see jsdocs in guessTableFormatKey()).
  const tierLists = sourceTable?.tiers || sourceTable?.tierSet || ([] as typeof sourceTable.tiers);
  const tiers: typeof sourceTable.tiers = [];

  if (!cappin && sliceIndex > -1) {
    tiers.push(...tierLists.slice(sliceIndex));
  }

  if (cappin && nonEmptyObject(slices) && tierLists.length) {
    // note: tiers[] would be empty at this point
    const capTiers = sliceKey === 'CAP LC' ? [
      ...tierLists.slice(slices[sliceKey], slices.AG || slices.Uber),
      ...tierLists.slice(slices.LC),
    ] : [
      ...tierLists.slice(0, slices.AG || slices.Uber),
      ...tierLists.slice(slices.OU),
    ];

    tiers.push(...capTiers);
  }

  // update (2024/01/05): now generating default Singles/Doubles lists based on the client's implementation
  if (!tiers.length) {
    // unless we got no slices or tierLists to work with o_O
    if (!nonEmptyObject(slices) || !tierLists.length) {
      return options;
    }

    const defaultTiers = detectDoublesFormat(format) ? [
      ...tierLists.slice(slices.DOU, slices.DUU),
      ...tierLists.slice(slices.DUber, slices.DOU),
      ...tierLists.slice(slices.DUU),
    ] : [
      ...tierLists.slice(slices.OU, slices.UU),
      ...tierLists.slice(slices.AG, slices.Uber),
      ...tierLists.slice(slices.Uber, slices.OU),
      ...tierLists.slice(slices.UU),
    ];

    if (!defaultTiers.length) {
      return options;
    }

    tiers.push(...defaultTiers);
  }

  // there seems to be some post-populated filtering based on special cases, so ya
  // (omitting the Gmax filtering bit at the end tho, but we're definitely laying the hammer tho)
  // update (2024/01/09): actually fricks with the dropdown when you switch from, say, Ubers to Ubers UU, so opting to
  // place all of them in an "Illegal" group instead
  const bannedIds: string[] = [];

  const hammerTime = (
    banList: Record<string, 1>,
  ) => Object.keys(banList || {}).forEach((speciesId) => {
    const index = tiers.findIndex((t) => (
      Array.isArray(t)
        ? (t[0] === 'pokemon' && !!t[1] && t[1] === speciesId)
        : (t === speciesId)
    ));

    if (index < 0) {
      return;
    }

    if (!bannedIds.includes(speciesId)) {
      bannedIds.push(speciesId);
    }

    tiers.splice(index, 1);
  });

  const ubersUuBans = sourceTable?.ubersUUBans || BattleTeambuilderTable.ubersUUBans;
  const ndDoublesBans = sourceTable?.ndDoublesBans || BattleTeambuilderTable.ndDoublesBans;
  const monotypeBans = sourceTable?.monotypeBans || BattleTeambuilderTable.monotypeBans;

  if (format.includes('ubersuu') && nonEmptyObject(ubersUuBans)) {
    // l.debug('yeeting', Object.keys(ubersUuBans).length, 'mon from ubersuwu', Object.keys(ubersUuBans));
    hammerTime(ubersUuBans);
  }

  if (format.includes('nationaldexdoubles') && nonEmptyObject(ndDoublesBans)) {
    hammerTime(ndDoublesBans);
  }

  if ((format.includes('monotype') || format.includes('monothreat')) && nonEmptyObject(monotypeBans)) {
    hammerTime(monotypeBans);
  }

  // l.debug(
  //   'format', format, 'formatKey', formatKey, 'sliceKeys', sliceKey, sliceKeys,
  //   '\n', 'slices', slices, 'sliceIndex', sliceIndex,
  //   '\n', 'tiers', tiers,
  // );

  const dex = getDexForFormat(format);

  const {
    speciesForme,
    altFormes,
    transformedForme,
    usageAlts,
    usageFinder: findUsagePercent,
    usageSorter,
    translate: translateFromConfig,
    translateHeader: translateHeaderFromConfig,
  } = config || {};

  const translate = (v: string) => translateFromConfig?.(v) || v;
  const translateHeader = (v: string, d?: string) => translateHeaderFromConfig?.(v) || d || v;

  const filterFormes: string[] = [];

  if ((altFormes?.length || 0) > (transformedForme ? 0 : 1)) {
    const sortedAltFormes = [...altFormes].sort(usageSorter).filter((f) => !!f && !f?.endsWith('-Tera'));
    const groupLabel = (!!transformedForme && 'Transformed') || 'Formes';

    options.push({
      label: translateHeader(groupLabel),
      options: sortedAltFormes.map((forme) => {
        filterFormes.push(forme);

        return {
          label: translate(forme),
          rightLabel: findUsagePercent(forme),
          value: forme,
        };
      }),
    });
  }

  // update (2024/01/15): better optimization might be to slap all the usages into one group instead lol
  const formeUsages = usageAlts?.filter((a) => (
    detectUsageAlt(a)
      && !filterFormes.includes(a[0])
      && !a[0].endsWith('-Tera')
  )).sort((
    [, usageA],
    [, usageB],
  ) => {
    if ((usageA || 0) > (usageB || 0)) {
      return -1;
    }

    if ((usageA || 0) < (usageB || 0)) {
      return 1;
    }

    return 0;
  });

  if (formeUsages?.length) {
    options.push({
      label: translateHeader('Usage'),
      options: formeUsages.map((alt) => {
        const flat = flattenAlt(alt);

        filterFormes.push(flat);

        return {
          label: translate(flat),
          rightLabel: percentage(alt[1], alt[1] === 1 ? 0 : 2),
          value: flat,
        };
      }),
    });
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

    if (!exists || filterFormes.includes(formeName) || formeName.endsWith('-Tera')) {
      return;
    }

    const [lastTier] = Object.keys(tierMap).slice(-1);

    if (!Array.isArray(tierMap[lastTier])) {
      return;
    }

    tierMap[lastTier].push(formeName);
    filterFormes.push(formeName);
  });

  Object.entries(tierMap).sort((
    [tierA],
    [tierB],
  ) => {
    const matchesA = format.includes(formatId(tierA));
    const matchesB = format.includes(formatId(tierB));

    if (matchesA) {
      if (matchesB) {
        return 0;
      }

      return -1;
    }

    if (matchesB) {
      return 1;
    }

    return 0;
  }).forEach(([
    tier,
    speciesFormes,
  ]) => {
    if (!tier || tier === 'Other' || !speciesFormes?.length) {
      return;
    }

    options.push({
      label: translateHeader(tier),
      options: speciesFormes.map((name) => ({
        label: translate(name),
        value: name,
      })),
    });
  });

  if (tierMap.Other.length) {
    options.push({
      label: translateHeader('Other'),
      options: tierMap.Other.map((name) => ({
        label: translate(name),
        value: name,
      })),
    });
  }

  if (bannedIds.length) {
    const bannedFormes = bannedIds.map((id) => {
      const dexBanned = dex.species.get(id);

      if (!dexBanned?.exists) {
        return null;
      }

      return dexBanned.name;
    }).filter(Boolean).sort();

    options.push({
      label: translateHeader('Illegal Results', 'Illegal'),
      options: bannedFormes.map((name) => ({
        label: translate(name),
        value: name,
      })),
    });
  }

  const currentForme = transformedForme || speciesForme;
  const shouldAddCurrent = !!currentForme
    && (currentForme.endsWith('-Tera') || !altFormes?.length || !altFormes.includes(currentForme))
    && !filterFormes.includes(currentForme);

  if (shouldAddCurrent) {
    options.unshift({
      label: translateHeader('Current'),
      options: [{
        label: translate(currentForme),
        rightLabel: findUsagePercent(currentForme),
        value: currentForme,
      }],
    });
  }

  return options;
};
