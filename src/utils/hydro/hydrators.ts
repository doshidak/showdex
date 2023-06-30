import {
  type CalcdexPlayerKey,
  type CalcdexPlayerSide,
  type CalcdexPokemonAlt,
} from '@showdex/redux/store';

/**
 * Hydrates a string `value` into a `boolean`, where `'y'` becomes `true` and `false` otherwise.
 *
 * @since 1.0.3
 */
export const hydrateBoolean = (value: string): boolean => (
  value?.toLowerCase?.() === 'y'
);

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
export const hydrateNumber = (value: string): number => {
  const hydratedString = hydrateString(value);

  if (!value) {
    return null;
  }

  return Number(hydratedString.replace(/\,/g, ''));
};

/* eslint-disable @typescript-eslint/indent */

/**
 * Hydrates a string `value` into a determined primitive type.
 *
 * @since 1.1.6
 */
export const hydrateValue = <
  T extends string | number | boolean = string | number | boolean,
>(
  value: string,
): T => (
  /^[0-9-\.][0-9\.\,]*(?:e[0-9+-]+)*$/i.test(value)
    ? hydrateNumber(value) as T extends number ? Extract<T, number> : never
    : /^(?:y|n)$/i.test(value)
      ? hydrateBoolean(value) as T extends boolean ? Extract<T, boolean> : never
      : hydrateString(value) as T extends string ? Extract<T, string> : never
);

/* eslint-enable @typescript-eslint/indent */

/**
 * Hydrates a string `value` into an array.
 *
 * @since 1.0.3
 */
export const hydrateArray = <T extends unknown[] = string[]>(
  value: string,
  delimiter = '/',
): T => (value?.split(delimiter) ?? []) as T;

/**
 * Hydrates a string `value` into a `CalcdexPokemonAlt<T>`.
 *
 * @since 1.1.6
 */
export const hydrateAlt = <T extends string>(
  value: string,
  delimiter = '@',
): CalcdexPokemonAlt<T> => {
  if (!value) {
    return null;
  }

  if (value.includes(delimiter)) {
    const [
      name,
      usage,
    ] = value.split(delimiter);

    const parsedUsage = hydrateNumber(usage);

    if (name && typeof parsedUsage === 'number' && parsedUsage >= 0) {
      return [
        name as T,
        parsedUsage,
      ];
    }
  }

  return value as T;
};

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
    .map((v) => v?.split('=') as [keyof CalcdexPlayerSide, string])
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
  arrayDelimiter = ',',
): Record<'auth' | CalcdexPlayerKey, unknown> => {
  const [
    auth,
    p1,
    p2,
    p3,
    p4,
  ] = value?.split(delimiter).map((v) => (
    v?.includes(arrayDelimiter)
      ? hydrateArray(v, arrayDelimiter)
      : hydrateBoolean(v)
  )) || [];

  return {
    auth,
    p1,
    p2,
    p3,
    p4,
  };
};
