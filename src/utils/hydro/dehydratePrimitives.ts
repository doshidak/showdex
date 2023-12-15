import { parseISO, toDate } from 'date-fns';

/**
 * Dehydrates a boolean `value` as `'y'` for `true` and `'n'` for `false`.
 *
 * @since 1.0.3
 */
export const dehydrateBoolean = (
  value: boolean,
): string => (value ? 'y' : 'n');

/**
 * Dehydrates a serializable `value`, defaulting to `'?'` if not serializable via `toString()`.
 *
 * * If `value` is detected to be a `boolean`, `value` will be passed to `dehydrateBoolean()`.
 *
 * @since 1.0.3
 */
export const dehydrateValue = (
  value: unknown,
): string => (
  typeof value === 'boolean'
    ? dehydrateBoolean(value)
    // eslint-disable-next-line @typescript-eslint/no-base-to-string -- yolo
    : value?.toString?.().replace(/(?:,|;|\|)/g, '') || '?'
);

/**
 * Dehydrates an array `value` by dehydrating each element in `value` and
 * joining the resulting map with the `delimiter`.
 *
 * @example
 * ```ts
 * dehydrateArray(['Ice', 'Ghost']);
 *
 * 'Ice/Ghost'
 * ```
 * @since 1.0.3
 */
export const dehydrateArray = (
  value: unknown[],
  delimiter = '/',
): string => value?.map?.((v) => dehydrateValue(v)).join(delimiter);

/**
 * Dehydrates a date `value` as an uppercased hexadecimal string representing the milliseconds
 * since the Unix epoch.
 *
 * * `number` & `Date` types for `value` will be parsed via `date-fns`'s `toDate()`.
 *   - `toDate()` will just spit back the same `Date` type, so no harm.
 * * `string` types will be parsed via `parseISO()`, assuming it's an ISO 8601 date string.
 * * If no `value` is provided, the current timestamp will be used instead.
 * * `'?'` will be returned if dehydration fails for whatever reason.
 *
 * @example
 * ```ts
 * dehydrateDate('2023-07-01T11:18:11.232-07:00')
 *
 * '18912AD3FA0'
 * ```
 * @since 1.1.6
 */
export const dehydrateDate = (
  value: number | Date | string = Date.now(),
): string => {
  const date = typeof value === 'string' ? parseISO(value) : toDate(value);
  const ms = date?.valueOf?.();

  if (typeof ms !== 'number' || Number.isNaN(ms)) {
    return '?';
  }

  return ms.toString(16).toUpperCase();
};
