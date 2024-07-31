import { type PkmnApiSmogonPresetRequest, type PkmnApiSmogonRandomsPresetResponse } from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { calcPresetCalcdexId, populateStatsTable } from '@showdex/utils/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { detectLegacyGen, getGenlessFormat } from '@showdex/utils/dex';

// const l = logger('@showdex/redux/transformers/transformRandomsPresetResponse()');

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
  response: PkmnApiSmogonRandomsPresetResponse,
  _meta: unknown,
  args: PkmnApiSmogonPresetRequest,
): CalcdexPokemonPreset[] => {
  if (!args?.gen || !nonEmptyObject(response)) {
    return [];
  }

  const format = args.format || `gen${args.gen}randombattle`;
  const legacy = detectLegacyGen(args.gen);

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  // at least this is only O(n)
  // ...stonks
  Object.entries(response).forEach(([
    speciesForme,
    pkmnPreset,
  ]) => {
    if (!speciesForme || !nonEmptyObject(pkmnPreset)) {
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
      gen: args.gen,
      format: getGenlessFormat(format),

      speciesForme, // do not sanitize
      level,

      ability: abilities?.[0],
      altAbilities: abilities,

      // see notes for `PkmnApiSmogonRandomPreset` in `@showdex/interfaces/api`
      // for more info about why we Hardy har har here
      nature: 'Hardy',

      item: items?.[0],
      altItems: items,

      /**
       * @todo Needs to be updated once we support more than 4 moves.
       */
      moves: moves?.slice(0, 4),
      altMoves: moves,

      ivs: populateStatsTable(ivs, { spread: 'iv', format }),
      evs: populateStatsTable(evs, { spread: 'ev', format }),
    };

    // note: either `preset` or `rolePreset` will be pushed to the `output` array!
    // (former if there are no roles and latter if there are)
    if (nonEmptyObject(roles)) {
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
        if (!legacy && nonEmptyObject(roleEvs)) {
          rolePreset.evs = populateStatsTable(roleEvs, { spread: 'ev', format });
        }

        if (nonEmptyObject(roleIvs)) {
          rolePreset.ivs = populateStatsTable(roleIvs, { spread: 'iv', format });
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
