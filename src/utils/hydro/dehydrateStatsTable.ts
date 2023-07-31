import { dehydrateValue } from './dehydratePrimitives';

/**
 * Dehydrates a stats table `value`, joining each dehydrated stat value with the `delimiter`.
 *
 * @example
 * ```ts
 * dehydrateStatsTable({
 *   hp: 31,
 *   atk: 0,
 *   def: 31,
 *   spa: 31,
 *   spd: 31,
 *   spe: 31,
 * });
 *
 * '31/0/31/31/31/31'
 * ```
 * @since 1.0.3
 */
export const dehydrateStatsTable = (
  value: Showdown.StatsTable,
  delimiter = '/',
): string => [
  value?.hp,
  value?.atk,
  value?.def,
  value?.spa,
  value?.spd,
  value?.spe,
].map((v) => dehydrateValue(v)).join(delimiter);
