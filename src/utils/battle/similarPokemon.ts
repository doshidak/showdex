import { type GenerationNum } from '@smogon/calc';
import { getDexForFormat } from '@showdex/utils/dex';
import { getPresetFormes } from '@showdex/utils/presets';
import { parsePokemonDetails } from './parsePokemonDetails';

/* eslint-disable @typescript-eslint/indent */

/**
 * Determines if `pokemonA` & `pokemonB` are possibly the same Pokemon based on their `details` property.
 *
 * * Why `details`? Seems to be the most consistently available property from the client.
 * * Comparison will be made based on information available to **both** Pokemon.
 *   - This means if one Pokemon is missing their level information, then level won't be considered at all, for instance.
 *   - Ignoring one of these properties through the `config` will only have an effect when available on both sides.
 * * That being said, the minimum guaranteed comparison is based off of the extracted species formes.
 * * Comparison will fail if one of the Pokemon has a falsy `details` value.
 *
 * @since 1.1.7
 */
export const similarPokemon = <
  TPokemonA extends Partial<Showdown.PokemonDetails>,
  TPokemonB extends Partial<Showdown.PokemonDetails>,
>(
  pokemonA: TPokemonA,
  pokemonB: TPokemonB,
  config?: {
    format?: string | GenerationNum;
    normalizeFormes?: 'fucked' | 'wildcard' | boolean;
    ignoreMega?: boolean;
    ignoreLevel?: boolean;
    ignoreGender?: boolean;
    ignoreShiny?: boolean;
    delimiter?: string;
  },
): boolean => {
  if (!pokemonA?.details || !pokemonB?.details) {
    return false;
  }

  const { details: detailsA } = pokemonA;
  const { details: detailsB } = pokemonB;

  const {
    format,
    normalizeFormes,
    ignoreMega,
    ignoreLevel,
    ignoreGender,
    ignoreShiny = true,
    delimiter,
  } = config || {};

  const shouldNormalizeFormes = normalizeFormes === true || (
    normalizeFormes === 'wildcard'
      && [detailsA, detailsB].some((d) => d.includes('-*'))
  );

  const dex = getDexForFormat(format);

  const {
    speciesForme: speciesA,
    level: levelA,
    gender: genderA,
    shiny: shinyA,
  } = parsePokemonDetails(
    detailsA,
    delimiter,
  );

  const dexA = dex.species.get(speciesA);

  const formeA = (
    dexA?.exists && (
      shouldNormalizeFormes || (ignoreMega && dexA.isMega)
        ? dexA.baseSpecies
        : dexA.name
    )
  ) || null;

  if (!formeA) {
    return false;
  }

  const fuckedA = normalizeFormes === 'fucked' ? getPresetFormes(formeA, {
    format,
  }) : [];

  const {
    speciesForme: speciesB,
    level: levelB,
    gender: genderB,
    shiny: shinyB,
  } = parsePokemonDetails(
    pokemonB.details,
    delimiter,
  );

  const dexB = dex.species.get(speciesB);

  const formeB = (
    dexB?.exists && (
      shouldNormalizeFormes || (ignoreMega && dexB.isMega)
        ? dexB.baseSpecies
        : dexB.name
    )
  ) || null;

  if (!formeB) {
    return false;
  }

  const fuckedB = normalizeFormes === 'fucked' ? getPresetFormes(formeB, {
    format,
  }) : [];

  return (
      (normalizeFormes === 'fucked' && fuckedA.some((f) => fuckedB.includes(f)))
        || formeA === formeB
    )
    && (
      ignoreLevel
        || !levelA
        || !levelB
        || levelA === levelB
    )
    && (
      ignoreGender
        || (genderA?.length || 0) !== 1
        || (genderB?.length || 0) !== 1
        || genderA === genderB
    )
    && (
      ignoreShiny
        || typeof shinyA !== 'boolean'
        || typeof shinyB !== 'boolean'
        || shinyA === shinyB
    );
};

/* eslint-enable @typescript-eslint/indent */
