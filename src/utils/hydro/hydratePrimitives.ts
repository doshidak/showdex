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
