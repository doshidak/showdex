import { flattenAlts } from '@showdex/utils/battle';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { PkmnSmogonPresetRequest, PkmnSmogonRandomsStatsResponse } from '@showdex/redux/services';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';
import { processUsageAlts } from './processUsageAlts';

/**
 * Transforms the JSON response from the pkmn Randoms Stats API by converting the object into an array of `CalcdexPokemonPreset`s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 *
 * @since 1.0.7
 */
export const transformRandomsStatsResponse = (
  response: PkmnSmogonRandomsStatsResponse,
  _meta: unknown,
  args: Omit<PkmnSmogonPresetRequest, 'formatOnly'>,
): CalcdexPokemonPreset[] => {
  if (!Object.keys(response || {}).length) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  const gen = args?.gen || env.int<GenerationNum>('calcdex-default-gen');

  Object.entries(response).forEach(([
    speciesForme,
    usageStats,
  ]) => {
    if (!speciesForme || !Object.keys(usageStats || {}).length) {
      return;
    }

    const {
      level,
      abilities,
      items,
      moves,
      ivs,
      evs,
      roles,
    } = usageStats;

    const preset: CalcdexPokemonPreset = {
      calcdexId: null,
      id: null,
      source: 'usage',
      name: 'Showdown Usage',
      gen,
      format: args?.format ?? `gen${gen}randombattle`,

      speciesForme,
      level,
      nature: 'Hardy',

      ivs: {
        hp: ivs?.hp ?? 31,
        atk: ivs?.atk ?? 31,
        def: ivs?.def ?? 31,
        spa: ivs?.spa ?? 31,
        spd: ivs?.spd ?? 31,
        spe: ivs?.spe ?? 31,
      },

      evs: {
        hp: evs?.hp ?? 84,
        atk: evs?.atk ?? 84,
        def: evs?.def ?? 84,
        spa: evs?.spa ?? 84,
        spd: evs?.spd ?? 84,
        spe: evs?.spe ?? 84,
      },
    };

    const altAbilities = processUsageAlts(abilities);
    const altItems = processUsageAlts(items);

    if (altAbilities.length) {
      preset.altAbilities = altAbilities;
      [[preset.ability]] = altAbilities;
    }

    if (altItems.length) {
      preset.altItems = altItems;
      [[preset.item]] = altItems;
    }

    if (Object.keys(roles || {}).length) {
      Object.entries(roles).forEach(([
        roleName,
        roleStats,
      ]) => {
        if (!roleName || !Object.keys(roleStats?.moves || {}).length) {
          return;
        }

        const rolePreset = { ...preset };

        const {
          weight,
          teraTypes,
          moves: roleMoves,
        } = roleStats;

        if (roleName) {
          rolePreset.name = `${roleName} Usage`;
        }

        if ((weight || 0) > 0) {
          rolePreset.usage = weight;
        }

        const altTeraTypes = processUsageAlts(teraTypes);

        if (altTeraTypes.length) {
          rolePreset.teraTypes = altTeraTypes;
        }

        rolePreset.altMoves = processUsageAlts(roleMoves);

        /**
         * @todo Needs to be updated once we support more than 4 moves.
         */
        rolePreset.moves = flattenAlts(rolePreset.altMoves.slice(0, 4));

        rolePreset.calcdexId = calcPresetCalcdexId(rolePreset);
        rolePreset.id = rolePreset.calcdexId;

        const presetIndex = output.findIndex((p) => p.calcdexId === rolePreset.calcdexId);

        if (presetIndex > -1) {
          output[presetIndex] = rolePreset;
        } else {
          output.push(rolePreset);
        }
      });
    } else if (Object.keys(moves || {})) {
      preset.altMoves = processUsageAlts(moves);

      /**
       * @todo Needs to be updated once we support more than 4 moves.
       */
      preset.moves = flattenAlts(preset.altMoves.slice(0, 4));

      preset.calcdexId = calcPresetCalcdexId(preset);
      preset.id = preset.calcdexId;

      // shouldn't be the case, but check if the preset already exists in our output
      const presetIndex = output.findIndex((p) => p.calcdexId === preset.calcdexId);

      if (presetIndex > -1) {
        output[presetIndex] = preset;
      } else {
        output.push(preset);
      }
    }
  });

  return output;
};
