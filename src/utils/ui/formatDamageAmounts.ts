// import { bullop } from '@showdex/consts/core';
import { percentage } from '@showdex/utils/humanize';

/**
 * Optional options for `formatDamageAmounts()`.
 *
 * @since 1.0.4
 */
export interface DamageAmountFormatterOptions {
  /**
   * Characters used to separate each damage amount in the input `damageAmounts`.
   *
   * @default
   * ```ts
   * ', ' // comma, then space
   * ```
   * @since 1.0.4
   */
  inputDelimiter?: string;

  /**
   * Maximum number of unique damage amounts where formatting will be performed.
   *
   * * Provided number is inclusive.
   * * Any `damageAmounts` whose number of uniques is above this provided number
   *   (or the default value of `7`) will not be formatted.
   *
   * @default
   * ```ts
   * // no longer shows the percentages if there are 6 or more unique damage amounts
   * // (this is a completely arbitrary default btw)
   * 7
   * ```
   * @since 1.0.4
   */
  formatThreshold?: number;

  /**
   * Characters used to separate each damage amount and its corresponding percentage.
   *
   * @default ': '
   * @since 1.0.4
   */
  amountDelimiter?: string;

  /**
   * Number of decimal places to show in the percentage values.
   *
   * @default 2
   * @since 1.0.4
   */
  precision?: number;

  /**
   * Characters to place before the percentage value.
   *
   * @default null
   * @since 1.0.4
   */
  prefix?: string;

  /**
   * Characters to place after the percentage value.
   *
   * @default '%'
   * @since 1.0.4
   */
  suffix?: string;

  /**
   * Characters used to separate each formatted damage amount.
   *
   * @default
   * ```ts
   * ', ' // comma, then space
   * ```
   * @since 1.0.4
   */
  outputDelimiter?: string;
}

/**
 * Includes the frequency of each unique amount in `damageAmounts` as a percentage.
 *
 * * Resulting output retains the ordering of each unique damage amount after `split()`ing
 *   the provided `damageAmounts`.
 *   - Should be sorted in ascending order from `calcSmogonMatchup()`, anyways.
 * * Primarily used in `PokeMoves` for when `formatMatchupDamageAmounts` is enabled
 *   in the user's `ShowdexCalcdexSettings`.
 *
 * @example
 * ```ts
 * formatDamageAmounts(
 *   '10, 10, 10, 10, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 13',
 * ); // 16 outputs
 *
 * '10: 25%, 12: 31.25%, 13: 6.25%'
 * ```
 * @since 1.0.4
 */
export const formatDamageAmounts = (
  damageAmounts: string,
  options?: DamageAmountFormatterOptions,
): string => {
  const {
    inputDelimiter = ', ',
    formatThreshold = 7,
    amountDelimiter = ': ',
    precision = 2,
    prefix,
    suffix = '%',
    outputDelimiter = ', ',
  } = options || {};

  const splitAmounts = damageAmounts?.split?.(inputDelimiter) || [];

  if (!splitAmounts.length) {
    return damageAmounts;
  }

  const parsedAmounts = splitAmounts.map(Number).filter((n) => !Number.isNaN(n));

  if (!parsedAmounts.length) {
    return damageAmounts;
  }

  const countedAmounts: Record<string, number> = parsedAmounts.reduce((prev, amount) => {
    const key = String(amount);

    if (!(key in prev)) {
      prev[key] = 0;
    }

    prev[key]++;

    return prev;
  }, {});

  if (Object.keys(countedAmounts).length > formatThreshold) {
    return damageAmounts;
  }

  const totalCount = parsedAmounts.length || 1;
  const zeroRegex = new RegExp(`(?<=\\.)([1-9]+)?0+(?=${suffix})`);
  const decimalRegex = new RegExp(`\\.(?=${suffix})`);

  return Object.entries(countedAmounts).map(([amount, count]) => {
    const percent = count / totalCount;
    const formatted = percentage(percent, precision, prefix, suffix)
      .replace(zeroRegex, '$1') // e.g., '25.00%' -> '25.%', '62.50%', -> '62.5%'
      .replace(decimalRegex, ''); // e.g., '25.%' -> '25%', '62.5%' -> '62.5%'

    return [amount, formatted].join(amountDelimiter);
  }).join(outputDelimiter);
};
