import { LegalLockedFormats } from '@showdex/consts';
import { formatId } from '@showdex/utils/app';
import type { AbilityName } from '@pkmn/data';
import type { CalcdexPokemon } from '@showdex/redux/store';

export interface PokemonAbilityOption {
  label: string;
  options: {
    label: string;
    value: AbilityName;
  }[];
}

/**
 * Builds the value for the `options` prop of the abilities `Dropdown` component in `PokeInfo`.
 *
 * * As of v1.0.1, we're opting to use the global `Dex` object as opposed to the `dex` from `@pkmn/dex`
 *   since we still get back information even if we're not in the correct gen (especially in National Dex formats).
 *
 * @since 1.0.1
 */
export const buildAbilityOptions = (
  // dex: Generation,
  format: string,
  pokemon: DeepPartial<CalcdexPokemon>,
): PokemonAbilityOption[] => {
  const options: PokemonAbilityOption[] = [];

  if (!pokemon?.speciesForme) {
    return options;
  }

  // const ability = pokemon.dirtyAbility ?? pokemon.ability;

  const {
    ability,
    abilities,
    altAbilities,
    baseAbility,
    transformedForme,
  } = pokemon;

  // keep track of what moves we have so far to avoid duplicate options
  const filterAbilities: AbilityName[] = [];

  if (transformedForme) {
    options.push({
      label: 'Transformed',
      options: [{
        label: ability,
        value: ability,
      }],
    });

    filterAbilities.push(ability);
  } else if (formatId(baseAbility) === 'trace' && ability !== baseAbility) {
    options.push({
      label: 'Traced',
      options: [{
        label: ability,
        value: ability,
      }],
    });

    filterAbilities.push(ability);
  }

  if (altAbilities?.length) {
    const poolAbilities = altAbilities
      .filter((n) => !!n && !filterAbilities.includes(n))
      .sort();

    options.push({
      label: 'Pool',
      options: poolAbilities.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterAbilities.push(...poolAbilities);
  }

  if (abilities?.length) {
    const legalAbilities = abilities
      .filter((n) => !!n && !filterAbilities.includes(n))
      .sort();

    options.push({
      label: 'Legal',
      options: legalAbilities.map((name) => ({
        label: name,
        value: name,
      })),
    });

    filterAbilities.push(...legalAbilities);
  }

  // show all possible abilities if format is not provided, is not legal-locked, or
  // no legal abilities are available (probably because the Pokemon doesn't exist in the `dex`'s gen)
  const parsedFormat = format?.replace(/^gen\d+/i, '');

  if (!parsedFormat || !LegalLockedFormats.includes(parsedFormat) || !abilities?.length) {
    const otherAbilities = Object.values(BattleAbilities || {})
      .map((a) => <AbilityName> a?.name)
      .filter((n) => !!n && formatId(n) !== 'noability' && !filterAbilities.includes(n))
      .sort();

    options.push({
      label: 'Other',
      options: otherAbilities.map((name) => ({
        label: name,
        value: name,
      })),
    });
  }

  return options;
};
