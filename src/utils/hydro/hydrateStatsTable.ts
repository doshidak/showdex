import { hydrateNumber } from './hydratePrimitives';

/**
 * Hydrates a string `value` into a `Showdown.StatsTable`.
 *
 * @since 1.0.3
 */
export const hydrateStatsTable = (
  value: string,
  delimiter = '/',
): Showdown.StatsTable => {
  const [
    hp = null,
    atk = null,
    def = null,
    spa = null,
    spd = null,
    spe = null,
  ] = value?.split(delimiter).map((v) => hydrateNumber(v)) || [];

  return {
    hp,
    atk,
    def,
    spa,
    spd,
    spe,
  };
};
