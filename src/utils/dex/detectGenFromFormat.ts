import { type GenerationNum } from '@smogon/calc';
import { clamp } from '@showdex/utils/core';

// update (2023/01/30): from a Teambuilder dump that brokenmotor shared, there's apparently a format called
// 'gen8350cup', which results in a gen number of 8350 LOL. right, so I can only assume a single digit gen for now,
// until Game Freak releases gen 10 or something in a couple years, but we'll cross that bridge when we get there.
// export const GenFormatRegex = /^gen(\d+)(?!v\d)/i;
// update (2023/12/29): this regex has served us well, but some changes had to have been made to future-proof this a lil
// (it's gunna be a fun time with all the 'gen10-' prefixes, like 'gen102v2doubles' or better yet, 'gen10350cup' ?? LOL)
// (btw, at the time of writing, we're on the Gen 9 DLC 2 [aka. the Indigo Disk], so I'm sure them Freaks be cookin rn)
// (also, inb4 Showdown drops an Apple & calls the new suffix 'genx', as in 'genxrandombattle' or 'genx350cup' HAHAHA fuk)
// export const GenFormatRegex = /^gen(\d)/i;
// export const GenFormatRegex = /^gen(1?\d)/i; // thought about this one, but 'gen11v1' is gen 11 or gen 1? o_O
export const GenFormatRegex = /^gen(10|\d)/i;

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
