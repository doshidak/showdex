import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { type PkmnApiSmogonPresetRequest, type PkmnApiSmogonFormatPresetResponse } from '@showdex/interfaces/api';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { transformPkmnSmogonPreset } from './transformPkmnSmogonPreset';

// const l = logger('@showdex/redux/transformers/transformFormatPresetResponse()');

/**
 * Transforms the JSON response from the pkmn Format Sets API into `CalcdexPokemonPreset[]`'s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 * * Only use this if `formatOnly` of `PkmnApiSmogonPresetRequest` is `true`.
 *
 * @since 0.1.3
 */
export const transformFormatPresetResponse = (
  response: PkmnApiSmogonFormatPresetResponse,
  _meta: unknown,
  args: PkmnApiSmogonPresetRequest,
): CalcdexPokemonPreset[] => {
  if (!args?.gen || !args.format || !nonEmptyObject(response)) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  // now it's O(n^2) baby ez optimization jk lol
  Object.entries(response).forEach(([
    speciesForme,
    presets,
  ]) => {
    if (!speciesForme || !nonEmptyObject(presets)) {
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
        args.format,
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

  // l.debug(
  //   'Completed gens format preset response transformation from the pkmn API',
  //   '\n', 'gen', gen,
  //   '\n', 'format', format,
  //   '\n', 'response', response,
  //   '\n', 'output', output,
  // );

  return output;
};
