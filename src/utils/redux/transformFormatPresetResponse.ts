import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { PkmnSmogonFormatPresetResponse, PkmnSmogonPresetRequest } from '@showdex/redux/services';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';

// const l = logger('@showdex/utils/redux/transformFormatPresetResponse');

/**
 * Transforms the JSON response from the Gen Format Sets API by converting the object into an array of `CalcdexPokemonPreset`s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 * * Only use this if `formatOnly` of `PkmnSmogonPresetRequest` is `true`.
 *
 * @since 0.1.3
 */
export const transformFormatPresetResponse = (
  response: PkmnSmogonFormatPresetResponse,
  _meta: unknown,
  args: PkmnSmogonPresetRequest,
): CalcdexPokemonPreset[] => {
  if (!Object.keys(response || {}).length) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  const gen = args?.gen ?? env.int<GenerationNum>('calcdex-default-gen');

  // you bet your ass this is O(n^3), but not only that,
  // we're getting a bunch of formats and sets back from the API, all nested objects.
  // what's efficiency??
  Object.entries(response).forEach(([
    speciesForme,
    presets,
  ]) => {
    if (!speciesForme || !Object.keys(presets || {}).length) {
      return;
    }

    Object.entries(presets).forEach(([
      presetName,
      pkmnPreset,
    ]) => {
      if (!presetName || !Object.keys(pkmnPreset || {}).length) {
        return;
      }

      const {
        teraTypes: presetTeraTypes,
        teratypes: presetTeratypes,
        ability,
        nature,
        item,
        moves,
        ivs,
        evs,
      } = pkmnPreset;

      const flatMoves = moves?.flatMap((move) => move) ?? [];

      const preset: CalcdexPokemonPreset = {
        calcdexId: null, // we'll hash this after we build the object
        id: null, // will equal calcdexId, so the same applies as above
        source: 'smogon',
        name: presetName, // e.g., 'Defensive Pivot'
        gen,
        format: args?.format?.replace(`gen${gen}`, ''), // 'nationaldex'

        speciesForme, // do not sanitize
        ability: Array.isArray(ability) ? ability[0] : ability,
        altAbilities: Array.isArray(ability) ? ability : [ability].filter(Boolean),

        nature: Array.isArray(nature) ? nature[0] : nature,

        item: Array.isArray(item) ? item[0] : item,
        altItems: Array.isArray(item) ? item : [item].filter(Boolean),

        /**
         * @todo Needs to be updated once we support more than 4 moves.
         *   Schema is formatted for 4 moves, so replace the current `moves` value with `flatMoves`.
         */
        moves: moves?.map((move) => (Array.isArray(move) ? move[0] : move)) ?? [],
        altMoves: flatMoves.filter((m, i) => !flatMoves.includes(m, i + 1)), // remove dupe moves

        ivs: {
          hp: typeof ivs?.hp === 'number' ? ivs.hp : 31,
          atk: typeof ivs?.atk === 'number' ? ivs.atk : 31,
          def: typeof ivs?.def === 'number' ? ivs.def : 31,
          spa: typeof ivs?.spa === 'number' ? ivs.spa : 31,
          spd: typeof ivs?.spd === 'number' ? ivs.spd : 31,
          spe: typeof ivs?.spe === 'number' ? ivs.spe : 31,
        },

        evs: {
          ...evs,
        },
      };

      // determine the Tera types (first from teraTypes [if the API fixes the casing], then teratypes)
      const teraTypes = (!!presetTeraTypes?.length && typeof presetTeraTypes === 'string' && [presetTeraTypes])
        || (!!presetTeraTypes?.length && Array.isArray(presetTeraTypes) && presetTeraTypes)
        || (!!presetTeratypes?.length && typeof presetTeratypes === 'string' && [presetTeratypes])
        || (!!presetTeratypes?.length && Array.isArray(presetTeratypes) && presetTeratypes)
        || [];

      if (teraTypes.length) {
        preset.teraTypes = [...teraTypes];
      }

      preset.calcdexId = calcPresetCalcdexId(preset);
      preset.id = preset.calcdexId; // used by RTK Query for tagging

      // shouldn't be the case, but check if the preset already exists in our output
      const presetIndex = output.findIndex((p) => p.calcdexId === preset.calcdexId);

      if (presetIndex > -1) {
        output[presetIndex] = preset;
      } else {
        output.push(preset);
      }
    });
  });

  // l.debug(
  //   'Completed gens format preset response transformation from the pkmn API',
  //   '\n', 'gen', gen,
  //   '\n', 'format', format,
  //   '\n', 'response', response,
  //   '\n', 'output', output,
  // );

  return output;
};
