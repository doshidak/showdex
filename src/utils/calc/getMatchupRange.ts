import { type Result } from '@smogon/calc';
import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/utils/calc/getMatchupRange()');

/**
 * Extracts the damage range from the `result.desc()`.
 *
 * * If the range is `'0 - 0%'`, the `zeroLabel` (defaulting to `'N/A'`) will be returned.
 *
 * @example '37.3 - 43.7%'
 * @since 0.1.0
 */
export const getMatchupRange = (
  result: Result,
  zeroLabel = 'N/A',
): string => {
  if (typeof result?.desc !== 'function') {
    return null;
  }

  let description: string = null;

  try {
    description = result.desc();
  } catch (error) {
    if (__DEV__ && !(error as Error)?.message?.includes('=== 0')) {
      l.warn(
        'Failed to obtain result description via result.desc()', error,
        '\n', 'result', result,
        '\n', '(You will only see this warning on development.)',
      );
    }

    throw error;
  }

  if (!description) {
    return null;
  }

  const [
    ,
    extractedRange,
  ] = /\(([\d.]+\s-\s[\d.]+%)\)/.exec(description) || [];

  if (!extractedRange) {
    return null;
  }

  // e.g., '0 - 0%' -> 'N/A'
  return extractedRange.replace('0 - 0%', zeroLabel);
};
