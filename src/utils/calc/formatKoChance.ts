import { logger } from '@showdex/utils/debug';
import type { Result } from '@smogon/calc';

const l = logger('@showdex/utils/calc/formatKoChance');

/**
 * Formats the KO chance object returned by `result.kochance()` into a nice `string`.
 *
 * @example '69% 2HKO'
 * @since 0.1.0
 */
export const formatKoChance = (result: Result): string => {
  if (!result?.damage || typeof result.kochance !== 'function') {
    return null;
  }

  const output: string[] = [];

  try {
    const resultKoChance = result.kochance();

    if (!resultKoChance?.chance && !resultKoChance?.n) {
      return null;
    }

    output.push(`${resultKoChance.n}HKO`);

    // no point in displaying a 100% chance to KO
    // (should be assumed that if there's no % displayed before the KO, it's 100%)
    if (typeof resultKoChance.chance === 'number' && resultKoChance.chance !== 1) {
      // sometimes, we might see '0.0% 3HKO' or something along those lines...
      // probably it's like 0.09%, but gets rounded down when we fix it to 1 decimal place
      const chancePercentage = resultKoChance.chance * 100;
      const decimalPlaces = ['0.0', '100.0'].includes(chancePercentage.toFixed(1)) ? 2 : 1;
      const fixedChance = chancePercentage.toFixed(decimalPlaces);

      if (fixedChance !== '0.0' && fixedChance !== '100.0') {
        // also truncate any trailing zeroes, e.g., 75.0% -> 75%
        output.unshift(`${fixedChance}%`.replace('.0%', '%'));
      }
    }
  } catch (error) {
    if (__DEV__) {
      l.warn(
        'Failed to obtain the KO chance via result.kochance()', error,
        '\n', 'result', result,
        '\n', '(You will only see this warning on development.)',
      );
    }

    throw error;
  }

  return output.join(' ');
};
