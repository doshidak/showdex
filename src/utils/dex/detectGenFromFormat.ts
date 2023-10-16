import { type GenerationNum } from '@smogon/calc';
import { clamp } from '@showdex/utils/core';

// update (2023/01/30): from a Teambuilder dump that brokenmotor shared, there's apparently a format called
// 'gen8350cup', which results in a gen number of 8350 LOL. right, so I can only assume a single digit gen for now,
// until Game Freak releases gen 10 or something in a couple years, but we'll cross that bridge when we get there.
// export const GenFormatRegex = /^gen(\d+)(?!v\d)/i;
export const GenFormatRegex = /^gen(\d)/i;

/**
 * Note that `defaultGen` is `null` by default, but you're free to import `env`
 * from `@showdex/utils/core` and set it as `env('calcdex-default-gen')`.
 *
 * * As of v1.1.7, `format` has been updated to accept a `GenerationNum` to clean up sections where this is being used.
 *   - If a `GenerationNum` is detected, `format` will be returned as-is.
 *
 * @since 0.1.0
 */
export const detectGenFromFormat = (
  format: string | GenerationNum,
  defaultGen: GenerationNum = null,
): GenerationNum => {
  if (typeof format === 'number') {
    return clamp(0, format) as GenerationNum;
  }

  if (!GenFormatRegex.test(format)) {
    return defaultGen;
  }

  const gen = parseInt(format.match(GenFormatRegex)[1], 10) || 0;

  if (gen < 1) {
    return defaultGen;
  }

  return gen as GenerationNum;
};
