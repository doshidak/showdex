import { PokemonNatures } from '@showdex/consts/pokemon';
import { formatId } from '@showdex/utils/app';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { processUsageAlts } from '@showdex/utils/presets';
import type { GenerationNum } from '@smogon/calc';
import type { MoveName } from '@smogon/calc/dist/data/interface';
import type { PkmnSmogonFormatStatsResponse, PkmnSmogonPresetRequest } from '@showdex/redux/services';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';

// const l = logger('@showdex/redux/transformers/transformFormatStatsResponse');

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
      source: 'usage',
      name: 'Showdown Usage',
      gen,
      format: args?.format?.replace(`gen${gen}`, ''),
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
      // apparently a bug with Showdown Usage where these two Pokemon will have "Iron Head" instead of
      // "Behemoth Blade" (for Zacian-Crowned) or "Behemoth Bash" (for Zamazenta-Crowned) lol
      if (['zaciancrowned', 'zamazentacrowned'].includes(formatId(speciesForme))) {
        const targetMove = <MoveName> (formatId(speciesForme) === 'zamazentacrowned' ? 'Behemoth Bash' : 'Behemoth Blade');
        const ironHeadIndex = altMoves.findIndex((m) => formatId(m[0]) === 'ironhead');

        if (ironHeadIndex > -1) {
          altMoves[ironHeadIndex][0] = targetMove;
        }
      }

      preset.altMoves = altMoves;

      /**
       * @todo Needs to be updated once we support more than 4 moves.
       */
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
