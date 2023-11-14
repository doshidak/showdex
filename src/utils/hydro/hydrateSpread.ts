import { type GenerationNum } from '@smogon/calc';
import { type CalcdexPokemonPresetSpread } from '@showdex/interfaces/calc';
import { populateStatsTable } from '@showdex/utils/calc';
// import { logger } from '@showdex/utils/debug';
import { getNatureForStats } from '@showdex/utils/dex';

// const l = logger('@showdex/utils/hydro/hydrateSpread()');

/**
 * Hydrates the dehydrated `value` into a `CalcdexPokemonPresetSpread`.
 *
 * * In order to populate the `ivs` & `evs` via `populateStatsTable()`, the `config.format` option is required.
 * * Empty spread will be returned if hydration fails for whatever reason.
 *   - `nature` will be `null`.
 *   - `ivs` & `evs` will both be empty objects.
 *
 * @example
 * ```ts
 * hydrateSpread('252/252+/0/(0)0-/0/4@0.2408', {
 *   format: 'gen9ou',
 * });
 *
 * {
 *   nature: 'Adamant',
 *   ivs: { hp: 31, atk: 31, def: 31, spa: 0, spd: 31, spe: 31 },
 *   evs: { hp: 252, atk: 252, def: 0, spa: 0, spd: 0, spe: 4 },
 *   usage: 0.2408,
 * } as CalcdexPokemonPresetSpread
 * ```
 * @since 1.1.8
 */
export const hydrateSpread = (
  value: string,
  config: {
    format: string | GenerationNum;
    delimiter?: string;
    altDelimiter?: string;
  },
): CalcdexPokemonPresetSpread => {
  const {
    format,
    delimiter = '/',
    altDelimiter = '@',
  } = config || {};

  const output: CalcdexPokemonPresetSpread = {
    nature: null,
    ivs: {},
    evs: {},
  };

  const inputsValid = !!value
    && !!delimiter
    && value.includes(delimiter);

  if (!inputsValid) {
    return output;
  }

  const [dehydrated, rawUsage] = value.split(altDelimiter);
  const usage = Number(rawUsage) || null;

  if (usage) {
    output.usage = usage;
  }

  // e.g., dehydrated = '252/252+/0/(0)0-/0/4', delimiter = '/'
  // -> ['252', '252+', '0', '(0)0-', '0', '4']
  const splits = dehydrated.split(delimiter);

  const parts: Record<Showdown.StatName, string> = {
    hp: splits[0], // e.g., '252'
    atk: splits[1], // e.g., '252+'
    def: splits[2], // e.g., '0'
    spa: splits[3], // e.g., '(0)0-'
    spd: splits[4], // e.g., '0'
    spe: splits[5], // e.g., '4'
  };

  let positive: Showdown.StatNameNoHp;
  let negative: Showdown.StatNameNoHp;

  const hydratedIvs: Showdown.StatsTable = {};
  const hydratedEvs: Showdown.StatsTable = {};

  Object.entries(parts).forEach(([
    stat,
    part,
  ]: [
    stat: Showdown.StatName,
    part: string,
  ]) => {
    const [
      , // e.g., '(0)0-' (unused tho)
      rawIv, // e.g., '0'
      rawEv, // e.g., '0'
      sign, // e.g, '-'
    ] = /^(?:\((\d+)\))?(\d+)([+-])?$/.exec(part) || [];

    const iv = Number(rawIv);
    const ev = Number(rawEv);

    if (!Number.isNaN(iv)) {
      hydratedIvs[stat] = iv;
    }

    if (!Number.isNaN(ev)) {
      hydratedEvs[stat] = ev;
    }

    if (stat === 'hp') {
      return;
    }

    if (sign === '+') {
      positive = stat;
    }

    if (sign === '-') {
      negative = stat;
    }
  });

  // note: this returns 'Hardy' when any of the args are invalid
  output.nature = getNatureForStats(positive, negative);

  output.ivs = populateStatsTable(hydratedIvs, {
    spread: 'iv',
    format,
  });

  output.evs = populateStatsTable(hydratedEvs, {
    spread: 'ev',
    format,
  });

  return output;
};
