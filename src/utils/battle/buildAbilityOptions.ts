import { formatId } from '@showdex/utils/app';
import { percentage } from '@showdex/utils/humanize';
import type { AbilityName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemon } from '@showdex/redux/store';
import type { DropdownOption } from '@showdex/components/form';
import { detectGenFromFormat } from './detectGenFromFormat';
import { detectLegacyGen } from './detectLegacyGen';
import { flattenAlt, flattenAlts } from './flattenAlts';
import { legalLockedFormat } from './legalLockedFormat';
import { usageAltPercentFinder } from './usageAltPercentFinder';

export type PokemonAbilityOption = DropdownOption<AbilityName>;

/**
 * Builds the value for the `options` prop of the abilities `Dropdown` component in `PokeInfo`.
 *
 * @since 1.0.1
 */
export const buildAbilityOptions = (
  format: string,
  pokemon: DeepPartial<CalcdexPokemon>,
  showAll?: boolean,
): PokemonAbilityOption[] => {
  const options: PokemonAbilityOption[] = [];

  // for legacy formats, the dex will return a 'No Ability' ability,
  // so make sure we return an empty array
  const gen = detectGenFromFormat(format);
  const legacy = detectLegacyGen(gen);

  if (legacy || !pokemon?.speciesForme) {
    return options;
  }

  // const ability = pokemon.dirtyAbility ?? pokemon.ability;

  const {
    serverSourced,
    baseAbility,
    ability,
    abilities,
    altAbilities,
    transformedAbilities,
    transformedForme,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterAbilities: AbilityName[] = [];

  // create usage percent finder (to show them in any of the option groups)
  const findUsagePercent = usageAltPercentFinder(altAbilities, true);

  // make sure we filter out "revealed" abilities with parentheses, like "(suppressed)"
  if (!transformedForme && baseAbility && ability !== baseAbility && !/^\([\w\s]+\)$/.test(ability)) {
    options.push({
      label: formatId(baseAbility) === 'trace' ? 'Traced' : 'Inherited',
      options: [{
        label: ability,
        rightLabel: findUsagePercent(ability),
        value: ability,
      }],
    });

    filterAbilities.push(ability);
  }

  if (transformedForme) {
    const transformed = Array.from(new Set([
      // filter out "revealed" abilities with parentheses, like "(suppressed)"
      serverSourced && !/^\([\w\s]+\)$/.test(ability) && ability,
      ...transformedAbilities,
    ])).filter((n) => !!n && !filterAbilities.includes(n)).sort();

    options.push({
      label: 'Transformed',
      options: transformed.map((name) => ({
        label: name,
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
      ? filteredPoolAbilities
      : flattenAlts(filteredPoolAbilities).sort();

    options.push({
      label: 'Pool',
      options: poolAbilities.map((alt) => ({
        label: flattenAlt(alt),
        rightLabel: Array.isArray(alt) ? percentage(alt[1], 2) : null,
        value: flattenAlt(alt),
      })),
    });

    filterAbilities.push(...flattenAlts(poolAbilities));
  }

  if (abilities?.length) {
    const legalAbilities = abilities
      .filter((n) => !!n && !filterAbilities.includes(n))
      .sort();

    options.push({
      label: 'Legal',
      options: legalAbilities.map((name) => ({
        label: name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });

    filterAbilities.push(...legalAbilities);
  }

  // show all possible abilities if format is not provided, is not legal-locked, or
  // no legal abilities are available (probably because the Pokemon doesn't exist in the `dex`'s gen)
  if (showAll || !legalLockedFormat(format) || !abilities?.length) {
    const otherAbilities = Object.values(BattleAbilities || {})
      .map((a) => <AbilityName> a?.name)
      .filter((n) => !!n && formatId(n) !== 'noability' && !filterAbilities.includes(n))
      .sort();

    options.push({
      label: 'All',
      options: otherAbilities.map((name) => ({
        label: name,
        rightLabel: findUsagePercent(name),
        value: name,
      })),
    });
  }

  return options;
};
