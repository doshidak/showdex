import { type GenerationNum } from '@smogon/calc';
import { PokemonStatNames } from '@showdex/consts/dex';
import { clamp, nonEmptyObject } from '@showdex/utils/core';
import { getDefaultSpreadValue } from '@showdex/utils/dex';

/**
 * Parses the provided `stats` & builds a fully populated `Showdown.StatsTable`.
 *
 * * Each stat omitted in `stats` will default to the value returned by `getDefaultSpreadValue()`.
 *   - This is why the `config.spread` value must be supplied.
 * * IVs will be clamped to a max of 31 & EVs to 252.
 * * Populated stats table with all default values will be returned if population fails for whatever reason.
 *
 * @example
 * ```ts
 * populateStatsTable({
 *   hp: 252,
 *   def: 252,
 *   spd: 4,
 * }, {
 *   spread: 'ev',
 *   format: 'gen9ou',
 * });
 *
 * {
 *   hp: 252,
 *   atk: 0,
 *   def: 252,
 *   spa: 0,
 *   spd: 4,
 *   spe: 0,
 * } as Showdown.StatsTable
 * ```
 * @example
 * ```ts
 * populateStatsTable(null, {
 *   spread: 'iv',
 *   format: 9 as GenerationNum,
 * });
 *
 * {
 *   hp: 31,
 *   atk: 31,
 *   def: 31,
 *   spa: 31,
 *   spd: 31,
 *   spe: 31,
 * } as Showdown.StatsTable
 * ```
 * @since 1.1.8
 */
export const populateStatsTable = (
  stats: Partial<Record<Showdown.StatName, number | string>>,
  config: {
    spread: 'iv' | 'ev';
    format: string | GenerationNum;
  },
): Showdown.StatsTable => {
  const {
    spread,
    format,
  } = config || {};

  const defaultValue = getDefaultSpreadValue(spread, format);

  const output = PokemonStatNames.reduce((prev, stat) => {
    prev[stat] = defaultValue;

    return prev;
  }, {} as Showdown.StatsTable);

  if (!nonEmptyObject(stats)) {
    return output;
  }

  const max = spread === 'ev' ? 252 : 31;

  Object.entries(stats).forEach(([
    stat,
    rawValue,
  ]) => {
    const value = typeof rawValue === 'number'
      ? rawValue
      : Number(rawValue);

    if (Number.isNaN(value)) {
      return;
    }

    output[stat] = clamp(0, value, max);
  });

  return output;
};
