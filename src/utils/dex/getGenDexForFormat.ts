import { type Generation, type GenerationNum, type Specie } from '@smogon/calc';
import { env } from '@showdex/utils/core';
import { detectGenFromFormat } from './detectGenFromFormat';
import { getDexForFormat } from './getDexForFormat';
import { getNaturesDex } from './getNaturesDex';
import { getTypesDex } from './getTypesDex';
import { notFullyEvolved } from './notFullyEvolved';

/**
 * Returns a somewhat compatible `Generation` dex (same one from `@pkmn/data`) based on the
 * global `Dex` object obtained via `getDexForFormat()`.
 *
 * * Provides missing properties in the global `Dex` object, such as `natures` and `types`.
 * * Note that the returned classes in the `get()` functions of the global `Dex` object
 *   (e.g., `dex.species.get()`) are not 100% compatible with those from `@pkmn/data`.
 *   - However, they provide enough info for `@smogon/calc` to populate the relevant properties
 *     required for calculating the matchup.
 *
 * @since 1.0.3
 */
export const getGenDexForFormat = (
  format: string | GenerationNum,
): Generation => {
  const dex = getDexForFormat(format);

  if (!dex) {
    return null;
  }

  const gen = dex.gen as GenerationNum
    || (
      typeof format === 'string'
        ? detectGenFromFormat(format)
        : env.int<GenerationNum>('calcdex-default-gen')
    );

  // we need to override dex.species.get() to populate the `nfe` property
  // since it's not provided by Showdown's global Dex
  // (otherwise, Eviolite won't work since the mechanics file calls this again!)
  const species: Generation['species'] = {
    ...(dex.species as unknown as Generation['species']),

    get: (id) => {
      const specie = dex.species.get(id) as unknown as Specie;

      if (typeof specie?.nfe !== 'boolean') {
        (specie as Writable<Specie>).nfe = notFullyEvolved(id, format);
      }

      return specie;
    },
  };

  return {
    ...dex,
    num: gen,
    natures: getNaturesDex(),
    species,
    types: getTypesDex(gen),
  } as unknown as Generation;
};
