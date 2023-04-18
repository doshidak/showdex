import { detectLegacyGen } from '@showdex/utils/battle';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { PkmnSmogonRandomsPresetResponse, PkmnSmogonPresetRequest } from '@showdex/redux/services';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';

// const l = logger('@showdex/redux/transformers/transformRandomsPresetResponse');

/**
 * Transforms the JSON response from the Randoms API by converting the object into an array of `CalcdexPokemonPreset`s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 *
 * @warning Do not use this to transform the response from the Gen Sets API, due to differing `response` schemas.
 *   Use `transformPresetResponse()` instead.
 * @since 0.1.3
 */
export const transformRandomsPresetResponse = (
  response: PkmnSmogonRandomsPresetResponse,
  _meta: unknown,
  args: PkmnSmogonPresetRequest,
): CalcdexPokemonPreset[] => {
  if (!Object.keys(response || {}).length) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  const gen = args?.gen ?? env.int<GenerationNum>('calcdex-default-gen');
  const legacy = detectLegacyGen(gen);

  // see notes for the `evs` property in `PkmnSmogonRandomPreset` in `@showdex/redux/services/pkmnApi`
  // for more info about why 84 EVs is the default value for each stat
  const defaultIv = legacy ? 30 : 31;
  const defaultEv = legacy ? 0 : 84;

  // at least this is only O(n)
  // ...stonks
  Object.entries(response).forEach(([
    speciesForme,
    pkmnPreset,
  ]) => {
    if (!speciesForme || !Object.keys(pkmnPreset || {}).length) {
      return;
    }

    const {
      level,
      abilities,
      items,
      moves,
      evs,
      ivs,
      roles,
    } = pkmnPreset;

    const preset: CalcdexPokemonPreset = {
      calcdexId: null, // we'll hash this after we build the object
      id: null, // will equal calcdexId, so the same applies as above
      source: 'smogon',
      name: 'Randoms',
      gen,
      format: args?.format ?? `gen${gen}randombattle`, // e.g., 'gen8randombattle'

      speciesForme, // do not sanitize
      level,

      ability: abilities?.[0],
      altAbilities: abilities,

      // see notes for `PkmnSmogonRandomPreset` in `@showdex/redux/services/pkmnApi`
      // for more info about why we Hardy har har here
      nature: 'Hardy',

      item: items?.[0],
      altItems: items,

      /**
       * @todo Needs to be updated once we support more than 4 moves.
       */
      moves: moves?.slice(0, 4),
      altMoves: moves,

      ivs: {
        hp: ivs?.hp ?? defaultIv,
        atk: ivs?.atk ?? defaultIv,
        def: ivs?.def ?? defaultIv,
        spa: ivs?.spa ?? defaultIv,
        spd: ivs?.spd ?? defaultIv,
        spe: ivs?.spe ?? defaultIv,
      },

      evs: {
        ...(!legacy && {
          hp: evs?.hp ?? defaultEv,
          atk: evs?.atk ?? defaultEv,
          def: evs?.def ?? defaultEv,
          spa: evs?.spa ?? defaultEv,
          spd: evs?.spd ?? defaultEv,
          spe: evs?.spe ?? defaultEv,
        }),
      },
    };

    // note: either `preset` or `rolePreset` will be pushed to the `output` array!
    // (former if there are no roles and latter if there are)
    if (Object.keys(roles || {}).length) {
      Object.entries(roles).forEach(([
        roleName,
        role,
      ]) => {
        if (!roleName || !role?.moves?.length) {
          return;
        }

        const rolePreset = { ...preset };

        // update (2023/01/05): apparently they added role-specific abilities and items lol
        // (but not all roles will have them, so make sure we're falling back to the ones attached to the Pokemon)
        const {
          abilities: roleAbilities,
          items: roleItems,
          teraTypes,
          moves: roleMoves,
          evs: roleEvs,
          ivs: roleIvs,
        } = role;

        if (roleName) {
          rolePreset.name = roleName;
        }

        if (roleAbilities?.length) {
          rolePreset.altAbilities = roleAbilities;
          [rolePreset.ability] = roleAbilities;
        }

        if (roleItems?.length) {
          rolePreset.altItems = roleItems;
          [rolePreset.item] = roleItems;
        }

        if (teraTypes?.length) {
          rolePreset.teraTypes = teraTypes.filter((t) => !!t && t !== '???');
        }

        /**
         * @todo Needs to be updated once we support more than 4 moves.
         */
        rolePreset.moves = roleMoves.slice(0, 4);
        rolePreset.altMoves = [...roleMoves];

        // update (2023/01/28): adding support for role-specific EVs/IVs, but for also when Pre eventually
        // moves the EVs/IVs into each role instead of in the parent (only for Gen 9 Randoms btw)
        if (!legacy && Object.keys(roleEvs || {}).length) {
          rolePreset.evs = {
            hp: roleEvs?.hp ?? defaultEv,
            atk: roleEvs?.atk ?? defaultEv,
            def: roleEvs?.def ?? defaultEv,
            spa: roleEvs?.spa ?? defaultEv,
            spd: roleEvs?.spd ?? defaultEv,
            spe: roleEvs?.spe ?? defaultEv,
          };
        }

        if (Object.keys(roleIvs || {}).length) {
          rolePreset.ivs = {
            hp: roleIvs?.hp ?? defaultIv,
            atk: roleIvs?.atk ?? defaultIv,
            def: roleIvs?.def ?? defaultIv,
            spa: roleIvs?.spa ?? defaultIv,
            spd: roleIvs?.spd ?? defaultIv,
            spe: roleIvs?.spe ?? defaultIv,
          };
        }

        rolePreset.calcdexId = calcPresetCalcdexId(rolePreset);
        rolePreset.id = rolePreset.calcdexId;

        const presetIndex = output.findIndex((p) => p.calcdexId === rolePreset.calcdexId);

        if (presetIndex > -1) {
          output[presetIndex] = rolePreset;
        } else {
          output.push(rolePreset);
        }
      });
    } else {
      preset.calcdexId = calcPresetCalcdexId(preset);
      preset.id = preset.calcdexId; // used by RTK Query for tagging

      // shouldn't be the case, but check if the preset already exists in our output
      const presetIndex = output.findIndex((p) => p.calcdexId === preset.calcdexId);

      if (presetIndex > -1) {
        output[presetIndex] = preset;
      } else {
        output.push(preset);
      }
    }
  });

  // l.debug(
  //   'Completed randoms preset response transformation from the pkmn API',
  //   '\n', 'gen', gen,
  //   '\n', 'response', response,
  //   '\n', 'output', output,
  // );

  return output;
};
