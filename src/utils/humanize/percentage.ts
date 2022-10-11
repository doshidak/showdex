/**
 * Converts a decimal `value` as a percentage.
 *
 * @example
 * ```ts
 * percentage(0.6969, 1);
 *
 * '69.6%'
 * ```
 * @since 1.0.3
 */
export const percentage = (
  value: number,
  precision = 0,
  prefix?: string,
  suffix = '%',
): string => {
  if (!value && typeof value !== 'number') {
    return null;
  }

  const valueStr = (value * 100).toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });

  return `${prefix || ''}${valueStr}${suffix || ''}`;
};
