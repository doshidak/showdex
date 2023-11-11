import { type MoveName } from '@smogon/calc';
import { PokemonNatures } from '@showdex/consts/dex';
import { type PkmnApiSmogonFormatStatsResponse } from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { type PkmnApiSmogonPresetRequest } from '@showdex/redux/services';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { formatId, nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getGenlessFormat } from '@showdex/utils/dex';
import { processUsageAlts } from '@showdex/utils/presets';

// const l = logger('@showdex/redux/transformers/transformFormatStatsResponse()');

/**
 * Transforms the JSON response from the Gen Format Stats API by converting the object into an array of `CalcdexPokemonPreset`s.
 *
 * * Meant to be passed directly into the `transformResponse` option of an RTK Query API endpoint.
 *   - Nothing stopping you from using it directly, though.
 *
 * @since 1.0.3
 */
export const transformFormatStatsResponse = (
  response: PkmnApiSmogonFormatStatsResponse,
  _meta: unknown,
  args: PkmnApiSmogonPresetRequest,
): CalcdexPokemonPreset[] => {
  const { pokemon: pokemonStats } = response || {};

  if (!args?.gen || !nonEmptyObject(pokemonStats)) {
    return [];
  }

  // this will be our final return value
  const output: CalcdexPokemonPreset[] = [];

  Object.entries(pokemonStats).forEach(([
    speciesForme,
    usageStats,
  ]) => {
    if (!speciesForme || !nonEmptyObject(usageStats)) {
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
      gen: args.gen,
      format: getGenlessFormat(args.format),
      speciesForme,
    };

    const altAbilities = processUsageAlts(abilities, args.format, 'abilities');
    const altItems = processUsageAlts(items, args.format, 'items');
    const altMoves = processUsageAlts(moves, args.format, 'moves');

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
        const targetMove = (formatId(speciesForme) === 'zamazentacrowned' ? 'Behemoth Bash' : 'Behemoth Blade') as MoveName;
        const ironHeadIndex = altMoves.findIndex((m) => formatId(m[0]) === 'ironhead');

        if (ironHeadIndex > -1) {
          altMoves[ironHeadIndex][0] = targetMove;
        }
      }

      // For some reason ivydudgel doesn't get transformed into Ivy Cudgel.
      // Let's just manually do it here.
      // I hate Ogerpon just a little bit for this...
      // update (2023/10/07): actually, not just Ivy Cudgel from the Usage Stats API that are unformatted LOL
      // fixed this directly upstream in processUsageAlts() to format everything just in case
      /*
      if (['ogerponwellspring', 'ogerponhearthflame', 'ogerpon', 'ogerponcornerstone', 'ogerponwellspringtera', 'ogerponhearthflametera', 'ogerpontera', 'ogerponcornerstonetera'].includes(formatId(speciesForme))) {
        const targetMove = 'Ivy Cudgel' as MoveName;
        const ivycudgelIndex = altMoves.findIndex((m) => formatId(m[0]) === 'ivycudgel');
        if (ivycudgelIndex > -1) {
          altMoves[ivycudgelIndex][0] = targetMove;
        }
      }
      */

      preset.altMoves = altMoves;

      /**
       * @todo Needs to be updated once we support more than 4 moves.
       */
      preset.moves = altMoves.slice(0, 4).map((m) => m[0]);
    }

    const [topSpread] = processUsageAlts(spreads);
    const [nature, evSpread] = (topSpread?.[0]?.split(':') || []) as [Showdown.NatureName, string];
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
