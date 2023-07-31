/**
 * Formats the provided `boostedStat` value as a `string` for displaying in the UI.
 *
 * * Returns an empty string (i.e., `''`) if `boostedStat` isn't a `number` or is `NaN`.
 *
 * @since 0.1.3
 */
export const formatStatBoost = (boostedStat: number): string => {
  if (typeof boostedStat !== 'number' || Number.isNaN(boostedStat)) {
    return '';
  }

  // otherwise, something like '50.400000000000006' can get rendered lol
  const isFloat = /\.\d+$/.test(boostedStat.toString());

  return boostedStat.toFixed(isFloat ? 1 : 0);
};
