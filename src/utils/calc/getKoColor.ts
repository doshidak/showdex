import { clamp } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { Result } from '@smogon/calc';

export type SmogonMatchupNhkoColors = [
  one: string,
  two: string,
  three: string,
  four: string,
  after: string,
];

/**
 * Index refers to the `result.n - 1` value.
 *
 * * If `n` is `0` or falsy, the default color should be applied.
 * * Any index that exceeds the length of this array should use the last index's color.
 *
 * @since 0.1.2
 */
const SmogonMatchupDefaultNhkoColors: SmogonMatchupNhkoColors = [
  '#4CAF50', // 1HKO -- (styles/config/colors.scss) colors.$green
  '#FF9800', // 2HKO -- MD Orange 500
  '#FF9800', // 3HKO -- MD Orange 500
  '#F44336', // 4HKO -- (styles/config/colors.scss) colors.$red
  '#F44336', // 5+HKO -- (styles/config/colors.scss) colors.$red
];

const l = logger('@showdex/utils/calc/getKoColor');

/**
 * Returns the color based on the NHKO (`n`) value from `result.kochance()`.
 *
 * @since 0.1.2
 */
export const getKoColor = (
  result: Result,
  colors?: SmogonMatchupNhkoColors,
): string => {
  if (!result?.damage || typeof result.kochance !== 'function') {
    return null;
  }

  let koChance: ReturnType<typeof result.kochance> = null;

  try {
    koChance = result.kochance();
  } catch (error) {
    if (__DEV__) {
      l.error(
        'Failed to obtain the KO chance via result.kochance().',
        '\n', 'result', result,
        '\n', '(You will only see this error on development.)',
      );
    }

    throw error;
  }

  if (!koChance?.chance && !koChance?.n) {
    return null;
  }

  // const koColorIndex = Math.min(
  //   koChance.n,
  //   SmogonMatchupKoColors.length - 1,
  // );

  const koColorIndex = clamp(0, koChance.n - 1, SmogonMatchupDefaultNhkoColors.length - 1);

  return (/^#(?:[0-9A-F]{3}|[0-9A-F]{6})$/i.test(colors?.[koColorIndex]) && colors[koColorIndex])
    || SmogonMatchupDefaultNhkoColors[koColorIndex]
    || null;
};
