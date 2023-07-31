import { PokemonStatNames } from '@showdex/consts/dex';

/**
 * Finds and returns the highest stat value from the provided `stats` table.
 *
 * * If multiple stats have the same value, then they'll be returned in the following order of precedence:
 *   - [**HP** >] **ATK** > **DEF** > **SPA** > **SPD** > **SPE**
 * * HP won't be considered unless `includeHp` is `true`.
 *
 * @example
 * ```ts
 * findHighestStat({
 *   hp: 434,
 *   atk: 298,
 *   def: 298,
 *   spa: 127,
 *   spd: 145,
 *   spe: 298,
 * });
 *
 * 'atk'
 * ```
 * @since 1.1.0
 */
export const findHighestStat = (
  stats: Showdown.StatsTable,
  includeHp?: boolean,
): Showdown.StatName => PokemonStatNames.reduce((prev, stat) => {
  if (stat === 'hp' && !includeHp) {
    return prev;
  }

  const highestValue = stats?.[prev] || 0;
  const currentValue = stats?.[stat] || 0;

  if (currentValue > highestValue) {
    return stat;
  }

  return prev;
}, null);
