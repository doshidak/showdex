import { type DropdownOption } from '@showdex/components/form';
import { type CalcdexPokemon } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getDexForFormat, guessTableFormatKey, guessTableFormatSlice } from '@showdex/utils/dex';

export type CalcdexPokemonFormeOption = DropdownOption<string>;

// const l = logger('@showdex/utils/ui/buildFormeOptions()');

/**
 * Builds the `options[]` prop for the species forme `Dropdown` in `PokeInfo`.
 *
 * @since 1.2.0
 */
export const buildFormeOptions = (
  format: string,
  pokemon?: CalcdexPokemon,
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

  const groups: CalcdexPokemonFormeOption[] = [];
  const otherFormes: CalcdexPokemonFormeOption = {
    label: 'Other',
    options: [],
  };

  const filterFormes: string[] = [];

  if (pokemon?.altFormes?.length) {
    const speciesForme = pokemon.transformedForme || pokemon.speciesForme;
    const dexSpecies = dex.species.get(speciesForme);

    groups.push({
      label: (!!pokemon.transformedForme && 'Transformed') || dexSpecies?.baseSpecies || 'Current',
      options: pokemon.altFormes.map((forme) => ({
        value: forme,
        label: forme,
        rightLabel: forme === dexSpecies?.baseSpecies ? 'BASE' : undefined,
      })),
    });

    filterFormes.push(...pokemon.altFormes);
  }

  tiers.forEach((tier) => {
    if (!tier) {
      return;
    }

    let forme = tier;

    if (Array.isArray(tier)) {
      if (tier[0] === 'header' && tier[1]) {
        return void groups.push({
          label: tier[1],
          options: [],
        });
      }

      // typically from tierSet[], copied from tiers[] by the Teambuilder o_O
      if (tier[0] === 'pokemon' && tier[1]) {
        [, forme] = tier;
      }
    }

    const dexSpecies = dex.species.get(forme as string);
    const { exists, name } = dexSpecies || {};

    if (!exists || filterFormes.includes(name)) {
      return;
    }

    const lastGroup = groups.slice(-1)[0];
    const target = lastGroup || otherFormes;

    target.options.push({
      value: name,
      label: name,
    });

    filterFormes.push(name);
  });

  options.push(
    ...groups.filter((g) => !!g.options.length),
    ...(otherFormes.options.length ? [otherFormes] : []),
  );

  return options;
};
