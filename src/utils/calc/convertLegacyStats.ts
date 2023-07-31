import { clamp } from '@showdex/utils/core';

/**
 * Converts an IV (Individual Value) to legacy DV (Determinant Value).
 *
 * @since 1.0.2
 */
export const convertIvToLegacyDv = (
  iv: number,
): number => clamp(0, Math.floor(iv / 2), 15);

/**
 * Converts a legacy DV (Determinant Value) to IV (Individual Value).
 *
 * @since 1.0.2
 */
export const convertLegacyDvToIv = (
  dv: number,
): number => clamp(0, dv * 2, 31);

/**
 * Returns the legacy SPC (Special) DV (Determinant Value) that should be stored under `spa` or `spd`.
 *
 * * Returned value will be pre-converted to a DV from the stored IV, via `convertIvToLegacyDv()`.
 * * Note that `spa` takes precedence over `spd`, falling back only if `spa` is `null` or `undefined`.
 *   - Although, `spd` should equal `spa` or be `null`/`undefined`.
 *
 * @default 0
 * @since 1.0.2
 */
export const getLegacySpcDv = (
  stats: Showdown.StatsTable,
): number => convertIvToLegacyDv(stats?.spa ?? stats?.spd ?? 0);

/**
 * Calculates the legacy HP DV (Determinant Value) from the DVs of other stats.
 *
 * * Passed in `ivs` should actually be IVs, **not** DVs.
 * * Make sure SPC is stored under `spa` or `spd`, as implemented in `getLegacySpcDv()`.
 *
 * @since 1.0.2
 */
export const calcLegacyHpDv = (ivs: Showdown.StatsTable): number => (
  ((convertIvToLegacyDv(ivs?.atk ?? 0) % 2) * 8)
    + ((convertIvToLegacyDv(ivs?.def ?? 0) % 2) * 4)
    + ((convertIvToLegacyDv(ivs?.spe ?? 0) % 2) * 2)
    + (getLegacySpcDv(ivs) % 2)
);

/**
 * Calculates the legacy HP DV (Determinant Value) & converts it into an IV (Individual Value).
 *
 * * Passed in `ivs` should actually be IVs, **not** DVs.
 * * Basically does `calcLegacyHpDv()` & passes it to `convertLegacyDvToIv()` for you.
 *
 * @since 1.1.6
 */
export const calcLegacyHpIv = (
  ivs: Showdown.StatsTable,
): number => convertLegacyDvToIv(calcLegacyHpDv(ivs));
