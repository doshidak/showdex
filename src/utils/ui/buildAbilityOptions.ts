import { type AbilityName } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemon, type CalcdexPokemonAlt, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { detectGenFromFormat, detectLegacyGen, legalLockedFormat } from '@showdex/utils/dex';
import { percentage } from '@showdex/utils/humanize';
import {
  type CalcdexPokemonUsageAltSorter,
  detectUsageAlt,
  flattenAlt,
  flattenAlts,
} from '@showdex/utils/presets';

export type CalcdexPokemonAbilityOption = DropdownOption<AbilityName>;

/**
 * Builds the value for the `options` prop of the abilities `Dropdown` component in `PokeInfo`.
 *
 * @since 1.0.1
 */
export const buildAbilityOptions = (
  format: string,
  pokemon: CalcdexPokemon,
  config?: {
    usageAlts?: CalcdexPokemonAlt<AbilityName>[];
    usageFinder?: (value: AbilityName) => string;
    usageSorter?: CalcdexPokemonUsageAltSorter<AbilityName>;
    showAll?: boolean;
    translate?: (value: AbilityName) => string;
    translateHeader?: (value: string) => string;
  },
): CalcdexPokemonAbilityOption[] => {
  const options: CalcdexPokemonAbilityOption[] = [];

  // for legacy formats, the dex will return a 'No Ability' ability,
  // so make sure we return an empty array
  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  if (legacy || !pokemon?.speciesForme) {
    return options;
  }

  const {
    usageAlts,
    usageFinder: findUsagePercent,
    usageSorter,
    showAll,
    translate: translateFromConfig,
    translateHeader: translateHeaderFromConfig,
  } = config || {};

  const translate = (v: AbilityName) => translateFromConfig?.(v) || v;
  const translateHeader = (v: string, d?: string) => translateHeaderFromConfig?.(v) || d || v;

  const {
    source,
    baseAbility,
    ability,
    abilities,
    altAbilities,
    transformedAbilities,
    transformedForme,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterAbilities: AbilityName[] = [];

  // make sure we filter out "revealed" abilities with parentheses, like "(suppressed)"
  if (!transformedForme && baseAbility && ability !== baseAbility && !/^\([\w\s]+\)$/.test(ability)) {
    const groupLabel = baseAbility === 'Trace' as AbilityName ? 'Traced' : 'Inherited';

    options.push({
      label: translateHeader(groupLabel),
      options: [{
        label: translate(ability),
        rightLabel: findUsagePercent(ability),
        value: ability,
      }],
    });

    filterAbilities.push(ability);
  }

  if (transformedForme) {
    const transformed = Array.from(new Set([
      // filter out "revealed" abilities with parentheses, like "(suppressed)"
      source === 'server' && !/^\([\w\s]+\)$/.test(ability) && ability,
      ...transformedAbilities,
    ])).filter((n) => !!n && !filterAbilities.includes(n)).sort(usageSorter);

    options.push({
      label: translateHeader('Transformed'),
      options: transformed.map((name) => {
        filterAbilities.push(name);

        return {
          label: translate(name),
          rightLabel: findUsagePercent(name),
          value: name,
        };
      }),
    });
  }

  if (altAbilities?.length) {
    const filteredPoolAbilities = altAbilities
      .filter((a) => !!a && !filterAbilities.includes(flattenAlt(a)));

    const poolAbilities = altAbilities.some((a) => detectUsageAlt(a))
      ? filteredPoolAbilities // should be sorted already (despite the name)
      : flattenAlts(filteredPoolAbilities).sort(usageSorter);

    options.push({
      label: translateHeader('Pool'),
      options: poolAbilities.map((alt) => {
        const flat = flattenAlt(alt);

        filterAbilities.push(flat);

        return {
          label: translate(flat),
          rightLabel: Array.isArray(alt) ? percentage(alt[1], alt[1] === 1 ? 0 : 2) : findUsagePercent(alt),
          value: flat,
        };
      }),
    });
  }

  const usageAbilities = usageAlts?.filter((a) => (
    detectUsageAlt(a)
      && !filterAbilities.includes(a[0])
  )) as CalcdexPokemonUsageAlt<AbilityName>[];

  if (usageAbilities?.length) {
    options.push({
      label: translateHeader('Usage'),
      options: usageAbilities.map((alt) => {
        const flat = flattenAlt(alt);

        filterAbilities.push(flat);

        return {
          label: translate(flat),
          rightLabel: percentage(alt[1], alt[1] === 1 ? 0 : 2),
          value: flat,
        };
      }),
    });
  }

  if (abilities?.length) {
    const legalAbilities = abilities
      .filter((n) => !!n && !filterAbilities.includes(n))
      .sort(usageSorter);

    options.push({
      label: translateHeader('Legal'),
      options: legalAbilities.map((name) => {
        filterAbilities.push(name);

        return {
          label: translate(name),
          rightLabel: findUsagePercent(name),
          value: name,
        };
      }),
    });
  }

  if (ability && !filterAbilities.includes(ability)) {
    options.unshift({
      label: translateHeader('Inherited'),
      options: [{
        label: translate(ability),
        rightLabel: findUsagePercent(ability),
        value: ability,
      }],
    });

    filterAbilities.push(ability);
  }

  // show all possible abilities if format is not provided, is not legal-locked, or
  // no legal abilities are available (probably because the Pokemon doesn't exist in the `dex`'s gen)
  if (showAll || !legalLockedFormat(format) || !abilities?.length) {
    const otherAbilities = Object.values(BattleAbilities || {})
      .map((a) => a?.name as AbilityName)
      .filter((n) => !!n && formatId(n) !== 'noability' && !filterAbilities.includes(n))
      .sort(usageSorter);

    options.push({
      label: translateHeader('All'),
      options: otherAbilities.map((name) => ({
        label: translate(name),
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });
  }

  return options;
};
