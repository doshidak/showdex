import { PokemonNatures } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import { sortUsageAlts } from '@showdex/utils/battle';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import type { GenerationNum } from '@smogon/calc';
import type { PkmnSmogonFormatStatsResponse, PkmnSmogonPresetRequest } from '@showdex/redux/services';
import type { CalcdexPokemonPreset, CalcdexPokemonUsageAlt } from '@showdex/redux/store';

/* eslint-disable @typescript-eslint/indent */

/**
 * Converts and sorts alternative abilities/items/moves for the usage stats of a single Pokemon.
 *
 * @since 1.0.3
 */
const processUsageAlts = <
  T extends string,
>(
  stats: Record<T, number>,
): CalcdexPokemonUsageAlt<T>[] => (<CalcdexPokemonUsageAlt<T>[]> Object.entries(stats || {}))
  .filter(([value]) => !!value && formatId(value) !== 'nothing')
    .sort(sortUsageAlts);

/* eslint-enable @typescript-eslint/indent */

/**
 * Transforms the JSON response from the Gen Format Stats API by converting the object into an array of `CalcdexPokemonPreset`s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 *
 * @since 1.0.3
 */
export const transformFormatStatsResponse = (
  response: PkmnSmogonFormatStatsResponse,
  _meta: unknown,
  args: Omit<PkmnSmogonPresetRequest, 'formatOnly'>,
): CalcdexPokemonPreset[] => {
  const { pokemon: pokemonStats } = response || {};

  if (!Object.keys(pokemonStats || {}).length) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  const gen = args?.gen ?? env.int<GenerationNum>('calcdex-default-gen');

  Object.entries(pokemonStats).forEach(([
    speciesForme,
    usageStats,
  ]) => {
    if (!speciesForme || !Object.keys(usageStats || {}).length) {
      return;
    }

    const {
      abilities,
      items,
      moves,
      spreads,
    } = usageStats;

    const preset: CalcdexPokemonPreset = {
      calcdexId: null,
      id: null,

      name: 'Showdown Usage',
      gen,
      format: args?.format,
      speciesForme,
    };

    const altAbilities = processUsageAlts(abilities);
    const altItems = processUsageAlts(items);
    const altMoves = processUsageAlts(moves);

    if (altAbilities.length) {
      preset.altAbilities = altAbilities;
      [[preset.ability]] = altAbilities;
    }

    if (altItems.length) {
      preset.altItems = altItems;
      [[preset.item]] = altItems;
    }

    if (altMoves.length) {
      preset.altMoves = altMoves;
      preset.moves = altMoves.slice(0, 4).map((m) => m[0]);
    }

    const [topSpread] = processUsageAlts(spreads);
    const [nature, evSpread] = <[Showdown.NatureName, string]> topSpread?.[0]?.split(':') || [];
    const [hpEv, atkEv, defEv, spaEv, spdEv, speEv] = evSpread?.split('/') || [];

    if (nature && PokemonNatures.includes(nature)) {
      preset.nature = nature;
    }

    if (evSpread && evSpread.includes('/')) {
      preset.evs = {
        hp: parseInt(hpEv, 10) || 0,
        atk: parseInt(atkEv, 10) || 0,
        def: parseInt(defEv, 10) || 0,
        spa: parseInt(spaEv, 10) || 0,
        spd: parseInt(spdEv, 10) || 0,
        spe: parseInt(speEv, 10) || 0,
      };
    }

    preset.calcdexId = calcPresetCalcdexId(preset);
    preset.id = preset.calcdexId;

    // shouldn't be the case, but check if the preset already exists in our output
    const presetIndex = output.findIndex((p) => p.calcdexId === preset.calcdexId);

    if (presetIndex > -1) {
      output[presetIndex] = preset;
    } else {
      output.push(preset);
    }
  });

  return output;
};
