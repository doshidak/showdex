import { env } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { Generation, Specie } from '@smogon/calc/dist/data/interface';
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
export const getGenDexForFormat = (format: string | GenerationNum): Generation => {
  const dex = getDexForFormat(format);

  if (!dex) {
    return null;
  }

  const gen = <GenerationNum> dex.gen
    || (
      typeof format === 'string'
        ? detectGenFromFormat(format)
        : env.int<GenerationNum>('calcdex-default-gen')
    );

  // we need to override dex.species.get() to populate the `nfe` property
  // since it's not provided by Showdown's global Dex
  // (otherwise, Eviolite won't work since the mechanics file calls this again!)
  const species: Generation['species'] = {
    ...(<Generation['species']> <unknown> dex.species),

    get: (id) => {
      const specie = <Specie> <unknown> dex.species.get(id);

      if (typeof specie?.nfe !== 'boolean') {
        (<Writable<Specie>> specie).nfe = notFullyEvolved(id);
      }

      return specie;
    },
  };

  return <Generation> <unknown> {
    ...dex,
    num: gen,
    natures: getNaturesDex(),
    species,
    types: getTypesDex(gen),
  };
};
