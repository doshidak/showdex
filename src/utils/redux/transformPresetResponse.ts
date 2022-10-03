import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';
import type { PkmnSmogonPresetRequest, PkmnSmogonPresetResponse } from '@showdex/redux/services';

// const l = logger('@showdex/utils/redux/transformPresetResponse');

/**
 * Transforms the JSON response from the Gen Sets API by converting the object into an array of `CalcdexPokemonPreset`s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 *
 * @warning Do not use this to transform the response from the Randoms API, due to differing `response` schemas.
 *   Use `transformRandomsPresetResponse()` instead.
 * @since 0.1.3
 */
export const transformPresetResponse = (
  response: PkmnSmogonPresetResponse,
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
    formats,
  ]) => {
    if (!speciesForme || !Object.keys(formats || {}).length) {
      return;
    }

    Object.entries(formats).forEach(([
      format,
      presets,
    ]) => {
      if (!format || !Object.keys(presets || {}).length) {
        return;
      }

      // const formatLabel = format in FormatLabels ?
      //   FormatLabels[format] :
      //   format?.toUpperCase?.().slice(0, 3); // truncate to 3 chars

      Object.entries(presets).forEach(([
        presetName,
        pkmnPreset,
      ]) => {
        if (!presetName || !Object.keys(pkmnPreset || {}).length) {
          return;
        }

        const {
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

          name: presetName, // e.g., 'Defensive Pivot'
          gen,
          format, // 'ou'
          speciesForme, // do not sanitize

          ability: Array.isArray(ability) ? ability[0] : ability,
          altAbilities: Array.isArray(ability) ? ability : [ability].filter(Boolean),

          nature: Array.isArray(nature) ? nature[0] : nature,

          item: Array.isArray(item) ? item[0] : item,
          altItems: Array.isArray(item) ? item : [item].filter(Boolean),

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
  });

  // l.debug(
  //   'Completed gens preset response transformation from the pkmn API',
  //   '\n', 'gen', gen,
  //   '\n', 'response', response,
  //   '\n', 'output', output,
  // );

  return output;
};
