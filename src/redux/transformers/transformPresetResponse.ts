import { type PkmnApiSmogonPresetRequest, type PkmnApiSmogonPresetResponse } from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { transformPkmnSmogonPreset } from './transformPkmnSmogonPreset';

// const l = logger('@showdex/redux/transformers/transformPresetResponse()');

/**
 * Transforms the JSON response from the pkmn Gen Sets API into `CalcdexPokemonPreset[]`'s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 *
 * @warning Do not use this to transform the response from the Randoms API, due to differing `response` schemas.
 *   Use `transformRandomsPresetResponse()` instead.
 * @since 0.1.3
 */
export const transformPresetResponse = (
  response: PkmnApiSmogonPresetResponse,
  _meta: unknown,
  args: PkmnApiSmogonPresetRequest,
): CalcdexPokemonPreset[] => {
  if (!args?.gen || !nonEmptyObject(response)) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  // you bet your ass this is O(n^3), but not only that,
  // we're getting a bunch of formats and sets back from the API, all nested objects.
  // what's efficiency??
  Object.entries(response).forEach(([
    speciesForme,
    formats,
  ]) => {
    if (!speciesForme || !nonEmptyObject(formats)) {
      return;
    }

    Object.entries(formats).forEach(([
      format,
      presets,
    ]) => {
      if (!format || !nonEmptyObject(presets)) {
        return;
      }

      Object.entries(presets).forEach(([
        presetName,
        pkmnPreset,
      ], formatIndex) => {
        if (!presetName || !nonEmptyObject(pkmnPreset)) {
          return;
        }

        const preset = transformPkmnSmogonPreset(
          args.gen,
          format,
          speciesForme,
          presetName,
          pkmnPreset,
          args.source,
          formatIndex,
        );

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
  //   // '\n', 'gen', gen,
  //   '\n', 'response', response,
  //   '\n', 'output', output,
  // );

  return output;
};
