import { type GenerationNum } from '@smogon/calc';
import { PokemonPresetFuckedBaseFormes, PokemonPresetFuckedBattleFormes } from '@showdex/consts/dex';
import { type CalcdexPokemonPresetSource } from '@showdex/interfaces/calc';
import { formatId } from '@showdex/utils/core';
import { getDexForFormat, hasMegaForme } from '@showdex/utils/dex';

/**
 * Returns an array of possible formes for the provided `speciesForme` that the `speciesFormes` of each
 * `CalcdexPokemonPreset` should match against.
 *
 * * As of v1.1.7, the `config` object was added to address certain edge cases, particularly the `source` option, which
 *   if it's `'server'` or `'sheet'`, will return all of the `otherFormes[]` for the provided `speciesForme`.
 *   - This was done primarily to address mismatching `speciesForme`'s in OTS presets & the Calcdex state, namely for
 *     a pre-initialized `'Urshifu'` in the state not matching with an OTS preset for `'Urshifu-Rapid-Strike'`.
 * * Guaranteed to at least return an empty array (i.e., `[]`) if building the formes fails at any point.
 *
 * @example
 * ```ts
 * getPresetFormes('Necrozma-Ultra');
 *
 * [
 *   'Necrozma-Ultra',
 *   'Necrozma-Dawn-Wings',
 *   'Necrozma-Dusk-Mane',
 * ]
 * ```
 * @example
 * ```ts
 * getPresetFormes('Gengar', {
 *   format: 'gen8randombattle',
 *   formatAsId: true,
 * });
 *
 * [
 *   'gengar',
 *   'gengargmax',
 * ]
 * ```
 * @example
 * ```ts
 * getPresetFormes('Urshifu');
 *
 * [
 *   'Urshifu',
 *   'Urshifu-Single-Strike',
 * ]
 * ```
 * @example
 * ```ts
 * getPresetFormes('Urshifu', {
 *   source: 'sheet',
 * });
 *
 * [
 *   'Urshifu',
 *   'Urshifu-Single-Strike',
 *   'Urshifu-Rapid-Strike',
 * ]
 * ```
 * @example
 * ```ts
 * getPresetFormes('Ogerpon-Teal-Tera');
 *
 * [
 *   'Ogerpon',
 *   'Ogerpon-Teal',
 * ]
 * ```
 * @since 1.1.2
 */
export const getPresetFormes = (
  speciesForme: string,
  config?: {
    format?: string | GenerationNum;
    source?: CalcdexPokemonPresetSource;
    formatAsId?: boolean;
    ignoreMega?: boolean;
    ignoreGmax?: boolean;
  },
): string[] => {
  if (!speciesForme) {
    return [];
  }

  const {
    format,
    source,
    formatAsId,
    ignoreMega,
    ignoreGmax,
  } = config || {};

  const dex = getDexForFormat(format);
  const dexSpecies = dex.species.get(speciesForme);

  if (!dexSpecies?.exists || !dexSpecies.name) {
    return [];
  }

  const {
    name,
    baseForme,
    baseSpecies,
    battleOnly,
    changesFrom,
    cosmeticFormes,
    otherFormes,
    isMega,
    canGigantamax,
  } = dexSpecies;

  // this will be our final return value
  const output: string[] = [
    // e.g., 'Necrozma-Ultra' (typically wouldn't have any sets), 'Urshifu'
    name,
  ];

  // throw in any base formes too, why not
  if (baseForme) {
    // e.g., name = 'Urshifu', baseForme = 'Single-Strike' -> 'Urshifu-Single-Strike'
    output.push(`${name}-${baseForme}`);
  }

  // update (2023/12/22): include any cosmeticFormes[]
  // e.g., name = 'Minior-Orange' -> cosmeticFormes = ['Minior-Orange', 'Minior-Yellow', 'Minior-Green', ...]
  if (cosmeticFormes?.length) {
    if (name !== baseSpecies && cosmeticFormes.includes(name)) {
      output.push(baseSpecies);
    }

    output.push(...cosmeticFormes);
  }

  // check for Mega formes
  if (!ignoreMega && otherFormes?.length) {
    const megaFormes = otherFormes.filter((f) => hasMegaForme(f));

    if (megaFormes.length) {
      output.push(...megaFormes);
    }
  }

  // update (2023/10/16): separated the fucked formes as to not complicate what goes where in the future lol
  // e.g., name = 'Ogerpon-Wellspring-Tera' -> includes('Ogerpon-Wellness-Tera') = true
  // -> battleOnly = 'Ogerpon-Wellspring', changesFrom = undefined
  if (PokemonPresetFuckedBattleFormes.includes(name) && (battleOnly || changesFrom)) {
    const battleFormes = (
      Array.isArray(battleOnly)
        ? battleOnly // e.g., name = 'Necrozma-Ultra' -> ['Necrozma-Dawn-Wings', 'Necrozma-Dusk-Mane']
        : [battleOnly] // e.g., name = 'Ogerpon-Wellspring' -> ['Ogerpon-Wellspring'] (sorry Darmanitan)
    ).filter(Boolean);

    if (battleFormes.length) {
      output.push(...battleFormes);
    }

    if (changesFrom) {
      // e.g., name = 'Genesect-Douse' -> battleOnly = undefined, changesFrom = 'Genesect'
      output.push(changesFrom);
    }
  }

  // e.g., name = 'Poltchageist-Artisan', baseSpecies = 'Poltchageist' -> includes('Poltchageist') = true
  if (name !== baseSpecies && (isMega || PokemonPresetFuckedBaseFormes.includes(baseSpecies))) {
    output.push(baseSpecies);
  }

  // see if we should add the Gmax forme as well, if any
  if (!ignoreGmax && canGigantamax) {
    // e.g., name = 'Gengar' -> 'Gengar-Gmax'
    const dexGigantamax = dex.species.get(`${name}-Gmax`);

    if (dexGigantamax?.exists) {
      // e.g., dexGigantamax.name = 'Gengar-Gmax'
      output.push(dexGigantamax.name);
    }
  }

  // update (2023/10/16): 'server'/'sheet'-sourced presets may have speciesForme discrepancies with what was initially
  // in the battle (& therefore in the Calcdex state), so if specified, include ALL the possible otherFormes[]
  // (namely to address a mismatch between an initialized 'Urshifu' & an OTS preset for 'Urshifu-Rapid-Strike')
  if (['server', 'sheet'].includes(source)) {
    const allFormes = (
      name === baseSpecies
        ? otherFormes // e.g., name = 'Urshifu' -> ['Urshifu-Rapid-Strike']
        // e.g., name = 'Ogerpon-Wellspring', baseSpecies = 'Ogerpon' -> ['Ogerpon-Wellspring', ...]
        : dex.species.get(baseSpecies)?.otherFormes
    ) || [];

    if (name !== baseSpecies) {
      output.unshift(baseSpecies);
    }

    if (allFormes.length) {
      output.push(...allFormes);
    }
  }

  // remove duplicate formes with this one simple trick (programmers hate him)
  // update (2023/10/16): fucc it yolo, save some frames
  // const nonDupesOutput = Array.from(new Set(output.filter(Boolean)));

  if (formatAsId) {
    return output.map((f) => formatId(f)).filter(Boolean);
  }

  return output.filter(Boolean);
};
