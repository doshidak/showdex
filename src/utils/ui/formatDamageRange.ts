import { logger } from '@showdex/utils/debug';
import type { Result } from '@smogon/calc';

const l = logger('@showdex/utils/ui/formatDamageRange');

/**
 * Extracts the damage range from the `result.desc()`.
 *
 * * If the range is `'0 - 0%'`, `'N/A'` will be returned.
 *
 * @example '37.3 - 43.7%'
 * @since 0.1.0
 */
export const formatDamageRange = (result: Result): string => {
  if (typeof result?.desc !== 'function') {
    return null;
  }

  let description: string = null;

  try {
    description = result.desc();
  } catch (error) {
    if (__DEV__ && !(<Error> error)?.message?.includes('=== 0')) {
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

  const [, extractedRange] = /\(([\d.]+\s-\s[\d.]+%)\)/.exec(description) || [];

  if (!extractedRange) {
    return null;
  }

  // e.g., '0 - 0%' -> 'N/A'
  return extractedRange.replace('0 - 0%', 'N/A');
};
