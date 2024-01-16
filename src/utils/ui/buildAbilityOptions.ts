import { type AbilityName } from '@smogon/calc';
import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemon, type CalcdexPokemonPreset, type CalcdexPokemonUsageAlt } from '@showdex/interfaces/calc';
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
    usage?: CalcdexPokemonPreset;
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
    usage,
    usageFinder: findUsagePercent,
    usageSorter,
    showAll,
    translate,
    translateHeader,
  } = config || {};

  // const ability = pokemon.dirtyAbility ?? pokemon.ability;

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
    const groupLabel = formatId(baseAbility) === 'trace' ? 'Traced' : 'Inherited';

    options.push({
      label: translateHeader?.(groupLabel) || groupLabel,
      options: [{
        label: translate?.(ability) || ability,
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
      label: translateHeader?.('Transformed') || 'Transformed',
      options: transformed.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterAbilities.push(...transformed);
  }

  if (altAbilities?.length) {
    const filteredPoolAbilities = altAbilities
      .filter((a) => !!a && !filterAbilities.includes(flattenAlt(a)));

    const hasUsageStats = altAbilities
      .some((a) => Array.isArray(a) && typeof a[1] === 'number');

    const poolAbilities = hasUsageStats
      ? filteredPoolAbilities // should be sorted already (despite the name)
      : flattenAlts(filteredPoolAbilities).sort(usageSorter);

    options.push({
      label: translateHeader?.('Pool') || 'Pool',
      options: poolAbilities.map((alt) => ({
        label: translate?.(flattenAlt(alt)) || flattenAlt(alt),
        rightLabel: Array.isArray(alt) ? percentage(alt[1], 2) : findUsagePercent(alt),
        value: flattenAlt(alt),
      })),
    });

    filterAbilities.push(...flattenAlts(poolAbilities));
  }

  if (detectUsageAlt(usage?.altAbilities?.[0])) {
    const usageAbilities = (usage.altAbilities as CalcdexPokemonUsageAlt<AbilityName>[])
      .filter((n) => !!n?.[0] && !filterAbilities.includes(n[0]));

    if (usageAbilities.length) {
      options.push({
        label: translateHeader?.('Usage') || 'Usage',
        options: usageAbilities.map((alt) => ({
          label: translate?.(flattenAlt(alt)) || flattenAlt(alt),
          rightLabel: percentage(alt[1], 2),
          value: flattenAlt(alt),
        })),
      });

      filterAbilities.push(...flattenAlts(usageAbilities));
    }
  }

  if (abilities?.length) {
    const legalAbilities = abilities
      .filter((n) => !!n && !filterAbilities.includes(n))
      .sort(usageSorter);

    options.push({
      label: translateHeader?.('Legal') || 'Legal',
      options: legalAbilities.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterAbilities.push(...legalAbilities);
  }

  if (ability && !filterAbilities.includes(ability)) {
    options.unshift({
      label: translateHeader?.('Inherited') || 'Inherited',
      options: [{
        label: translate?.(ability) || ability,
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
      label: translateHeader?.('All') || 'All',
      options: otherAbilities.map((name) => ({
        label: translate?.(name) || name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });
  }

  return options;
};
