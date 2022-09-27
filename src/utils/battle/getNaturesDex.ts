// import { PokemonNatureBoosts, PokemonNatures } from '@showdex/consts';
// import { formatId } from '@showdex/utils/app';
// import { capitalize } from '@showdex/utils/core';
import { Natures } from '@smogon/calc/dist/data/natures';
// import type { Natures } from '@smogon/calc/dist/data/interface';

/**
 * Returns the `natures` property used in the `Generation` class.
 *
 * @since 1.0.3
 */
export const getNaturesDex = (): Natures => new Natures();

// export const getNaturesDex = (): Natures => {
//   const get: Natures['get'] = (id) => {
//     const natureId = <Parameters<typeof get>[0]> formatId(id);
//     const key = natureId ? <Showdown.NatureName> capitalize(natureId) : null;
//
//     if (!key || !Array.isArray(PokemonNatureBoosts[key])) {
//       return null;
//     }
//
//     const [plus, minus] = PokemonNatureBoosts[key];
//
//     return {
//       kind: 'Nature',
//       exists: true,
//       id: natureId,
//       name: key,
//       fullname: `nature: ${key}`,
//       effectType: 'Nature',
//       num: 0,
//       gen: 3,
//       plus,
//       minus,
//       desc: '',
//       shortDesc: '',
//       isNonstandard: null,
//       duration: null,
//     };
//   };
//
//   return {
//     get,
//
//     * [Symbol.iterator]() {
//       for (const nature of PokemonNatures) {
//         yield get(<Parameters<typeof get>[0]> nature);
//       }
//     },
//   };
// };
