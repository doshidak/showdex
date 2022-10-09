import type { CalcdexPlayerKey, CalcdexPlayerSide } from '@showdex/redux/store';

/**
 * Hydrates a string `value` into a `boolean`, where `'y'` becomes `true` and `false` otherwise.
 *
 * @since 1.0.3
 */
export const hydrateBoolean = (value: string): boolean => value === 'y';

/**
 * Hydrates a string `value` into a string.
 *
 * @since 1.0.3
 */
export const hydrateString = (value: string): string => (
  value === '?'
    ? null
    : String(value)
);

/**
 * Hydrates a string `value` into a number.
 *
 * @since 1.0.3
 */
export const hydrateNumber = (value: string): number => Number(hydrateString(value));

/**
 * Hydrates a string `value` into an array.
 *
 * @since 1.0.3
 */
export const hydrateArray = <T extends string>(
  value: string,
  delimiter = '/',
): T[] => <T[]> (value?.split(delimiter) ?? []);

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

/**
 * Hydrates a string `value` into a `CalcdexPlayerSide`.
 *
 * @since 1.0.3
 */
export const hydrateFieldSide = (
  value: string,
  delimiter = '/',
): CalcdexPlayerSide => {
  const entries = value
    ?.split(delimiter)
    .map((v) => <[keyof CalcdexPlayerSide, string]> v?.split('='))
    .filter(Boolean)
    || [];

  return entries.reduce((prev, [key, entryValue]) => {
    prev[key] = ['y', 'n'].includes(entryValue)
      ? hydrateBoolean(entryValue)
      : /^\d+$/.test(entryValue)
        ? hydrateNumber(entryValue)
        : hydrateString(entryValue);

    return prev;
  }, {});
};

/**
 * Hydrates a string `value` into per-side settings.
 *
 * @since 1.0.3
 */
export const hydratePerSide = (
  value: string,
  delimiter = '/',
): Record<'auth' | CalcdexPlayerKey, boolean> => {
  const [
    auth,
    p1,
    p2,
    p3,
    p4,
  ] = value?.split(delimiter).map((v) => hydrateBoolean(v)) || [];

  return {
    auth,
    p1,
    p2,
    p3,
    p4,
  };
};
