import { type GenerationNum } from '@smogon/calc';
import { PokemonNatures, PokemonNeutralNatures } from '@showdex/consts/dex';
import { populateStatsTable } from '@showdex/utils/calc';
import { type CalcdexPokemonPresetSpread } from '@showdex/interfaces/calc';

/**
 * Converts a spread from Showdown's usage stats into a `CalcdexPokemonPresetSpread`.
 *
 * * These are in the following format:
 *   - `<Nature>:<HP>/<Atk>/<Def>/<SpA>/<SpD>/<Spe>`
 * * Note that `ivs` will be an empty object since the aforementioned format doesn't include them.
 * * Empty spread will be returned if parsing fails for whatever reason (similar to `hydrateSpread()`):
 *   - `nature` will be null.
 *   - `ivs` & `evs` will both be empty objects (though, `ivs` will always be empty as previously mentioned).
 * * Any neutral natures will default to `'Hardy'` instead.
 *   - Additionally, invalid natures (e.g., `'ADAMANT'` cause it's all caps) will result in `'Hardy'` as well!
 * * Optionally provide a `format` argument to be passed to `populateStatsTable()`.
 *   - Though, you typically wouldn't be using this in a legacy gen.
 *   - (Note: pkmn Format Stats API will only have 1 spread in that case: `'Serious:252/252/252/252/252/252'`.)
 *
 * @example
 * ```ts
 * parseUsageSpread('Adamant:0/252/4/0/0/252');
 *
 * {
 *   nature: 'Adamant',
 *   ivs: {},
 *   evs: {
 *     hp: 0,
 *     atk: 252,
 *     def: 4,
 *     spa: 0,
 *     spd: 0,
 *     spe: 252,
 *   },
 * } as CalcdexPokemonPresetSpread
 * ```
 * @since 1.1.8
 */
export const parseUsageSpread = (
  value: string,
  format?: string | GenerationNum,
): CalcdexPokemonPresetSpread => {
  const output: CalcdexPokemonPresetSpread = {
    nature: null,
    ivs: {},
    evs: {},
  };

  if (!value?.includes(':') || !value.includes('/')) {
    return output;
  }

  // e.g., value = 'Adamant:0/252/4/0/0/252'
  // -> nature = 'Adamant', evSpread = '0/252/4/0/0/252'
  const [nature, evSpread] = value.split(':') as [Showdown.NatureName, string];
  const evs = evSpread.split('/');

  output.nature = !PokemonNatures.includes(nature) || PokemonNeutralNatures.includes(nature)
    ? 'Hardy'
    : nature;

  // note: populateStatsTable() will do the number parsing for us c:
  output.evs = populateStatsTable({
    hp: evs[0],
    atk: evs[1],
    def: evs[2],
    spa: evs[3],
    spd: evs[4],
    spe: evs[5],
  }, {
    spread: 'ev',
    format,
  });

  return output;
};
