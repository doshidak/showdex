import { type PkmnSmogonPresetRequest, type PkmnSmogonRandomsStatsResponse } from '@showdex/redux/services';
import { type CalcdexPokemonPreset } from '@showdex/redux/store';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { detectLegacyGen, getGenlessFormat } from '@showdex/utils/dex';
import { flattenAlts, processUsageAlts } from '@showdex/utils/presets';

// const l = logger('@showdex/redux/transformers/transformRandomsStatsResponse()');

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
  if (!args?.gen || !nonEmptyObject(response)) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  const legacy = detectLegacyGen(args.gen);
  const defaultIv = legacy ? 30 : 31;
  const defaultEv = legacy ? 252 : 84;

  Object.entries(response).forEach(([
    speciesForme,
    usageStats,
  ]) => {
    if (!speciesForme || !nonEmptyObject(usageStats)) {
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
      gen: args.gen,
      format: getGenlessFormat(args?.format) || 'randombattle',

      speciesForme,
      level,
      nature: 'Hardy',

      ivs: {
        hp: ivs?.hp ?? defaultIv,
        atk: ivs?.atk ?? defaultIv,
        def: ivs?.def ?? defaultIv,
        spa: ivs?.spa ?? defaultIv,
        spd: ivs?.spd ?? defaultIv,
        spe: ivs?.spe ?? defaultIv,
      },

      evs: {
        hp: evs?.hp ?? defaultEv,
        atk: evs?.atk ?? defaultEv,
        def: evs?.def ?? defaultEv,
        spa: evs?.spa ?? defaultEv,
        spd: evs?.spd ?? defaultEv,
        spe: evs?.spe ?? defaultEv,
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

    // note: either `preset` or `rolePreset` will be pushed to the `output` array!
    // (former if there are no roles and latter if there are)
    if (nonEmptyObject(roles)) {
      Object.entries(roles).forEach(([
        roleName,
        roleStats,
      ]) => {
        if (!roleName || !nonEmptyObject(roleStats?.moves)) {
          return;
        }

        const rolePreset = { ...preset };

        // update (2023/01/05): as mentioned in transformRandomsPresetResponse(),
        // they added role-specific items and abilities
        const {
          weight,
          abilities: roleAbilities,
          items: roleItems,
          teraTypes,
          moves: roleMoves,
        } = roleStats;

        if (roleName) {
          rolePreset.name = `${roleName} Usage`;
        }

        if ((weight || 0) > 0) {
          rolePreset.usage = weight;
        }

        if (nonEmptyObject(roleAbilities)) {
          const altRoleAbilities = processUsageAlts(roleAbilities);

          if (altRoleAbilities.length) {
            rolePreset.altAbilities = altRoleAbilities;
            [[rolePreset.ability]] = altRoleAbilities;
          }
        }

        if (nonEmptyObject(roleItems)) {
          const altRoleItems = processUsageAlts(roleItems);

          if (altRoleItems.length) {
            rolePreset.altItems = altRoleItems;
            [[rolePreset.item]] = altRoleItems;
          }
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
    } else if (nonEmptyObject(moves)) {
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
