import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { PkmnSmogonRandomsPresetResponse, PkmnSmogonPresetRequest } from '@showdex/redux/services';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';

// const l = logger('@showdex/utils/redux/transformRandomsPresetResponse');

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
    } = pkmnPreset;

    const preset: CalcdexPokemonPreset = {
      calcdexId: null, // we'll hash this after we build the object
      id: null, // will equal calcdexId, so the same applies as above

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

      moves: moves?.slice(0, 4),
      altMoves: moves,

      ivs: {
        hp: ivs?.hp ?? 31,
        atk: ivs?.atk ?? 31,
        def: ivs?.def ?? 31,
        spa: ivs?.spa ?? 31,
        spd: ivs?.spd ?? 31,
        spe: ivs?.spe ?? 31,
      },

      // see notes for the `evs` property in `PkmnSmogonRandomPreset` in `@showdex/redux/services/pkmnApi`
      // for more info about why 84 EVs is the default value for each stat
      evs: {
        hp: evs?.hp ?? 84,
        atk: evs?.atk ?? 84,
        def: evs?.def ?? 84,
        spa: evs?.spa ?? 84,
        spd: evs?.spd ?? 84,
        spe: evs?.spe ?? 84,
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

  // l.debug(
  //   'Completed randoms preset response transformation from the pkmn API',
  //   '\n', 'gen', gen,
  //   '\n', 'response', response,
  //   '\n', 'output', output,
  // );

  return output;
};
