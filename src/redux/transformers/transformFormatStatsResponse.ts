// import { type MoveName } from '@smogon/calc';
// import { PokemonNatures } from '@showdex/consts/dex';
import {
  type PkmnApiSmogonFormatStatsResponse,
  type PkmnApiSmogonPresetRequest,
  type PkmnApiSmogonQueryMeta,
} from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { replaceBehemothMoves } from '@showdex/utils/battle';
import { calcPresetCalcdexId } from '@showdex/utils/calc';
import { nonEmptyObject } from '@showdex/utils/core';
// import { logger } from '@showdex/utils/debug';
import { getGenfulFormat, getGenlessFormat } from '@showdex/utils/dex';
import { parseUsageSpread, processUsageAlts } from '@showdex/utils/presets';

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
  meta: PkmnApiSmogonQueryMeta,
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
      usage,
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

    if (typeof usage?.weighted === 'number' && (usage.weighted || 0) > 0) {
      preset.formeUsage = usage.weighted;
    }

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
      /*
      if (['zaciancrowned', 'zamazentacrowned'].includes(formatId(speciesForme))) {
        const targetMove = (formatId(speciesForme) === 'zamazentacrowned' ? 'Behemoth Bash' : 'Behemoth Blade') as MoveName;
        const ironHeadIndex = altMoves.findIndex((m) => formatId(m[0]) === 'ironhead');

        if (ironHeadIndex > -1) {
          altMoves[ironHeadIndex][0] = targetMove;
        }
      }
      */

      // preset.altMoves = altMoves;
      preset.altMoves = replaceBehemothMoves(speciesForme, preset.altMoves);

      /**
       * @todo Needs to be updated once we support more than 4 moves.
       */
      preset.moves = altMoves.slice(0, 4).map((m) => m[0]);
    }

    /*
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
    */

    const usageSpreads = processUsageAlts(spreads);

    // note: only up to top 10 (could have more than 200!!)
    preset.spreads = usageSpreads
      .slice(0, 10)
      .map((spread) => ({
        ...parseUsageSpread(spread[0], getGenfulFormat(args.gen, args.format)),
        usage: spread[1],
      }));

    // note: `ivs` don't exist here!
    preset.nature = preset.spreads[0]?.nature;
    preset.evs = { ...preset.spreads[0]?.evs };

    // read from the 'Last-Modified' header, if any
    if (meta?.resHeaders?.['last-modified']) {
      preset.updated = new Date(meta.resHeaders['last-modified']).valueOf() || null;
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
