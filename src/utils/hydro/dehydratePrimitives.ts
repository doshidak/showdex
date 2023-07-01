/**
 * Dehydrates a boolean `value` as `'y'` for `true` and `'n'` for `false`.
 *
 * @since 1.0.3
 */
export const dehydrateBoolean = (value: boolean): string => (value ? 'y' : 'n');

/**
 * Dehydrates a serializable `value`, defaulting to `'?'` if not serializable via `toString()`.
 *
 * * If `value` is detected to be a `boolean`, `value` will be passed to `dehydrateBoolean()`.
 *
 * @since 1.0.3
 */
export const dehydrateValue = (value: unknown): string => (
  typeof value === 'boolean'
    ? dehydrateBoolean(value)
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
