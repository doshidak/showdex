import type { GenerationNum } from '@smogon/calc';

export const GenFormatRegex = /^gen(\d+)(?!v\d)/i;

/**
 * Note that `defaultGen` is `null` by default, but you're free to import `env`
 * from `@showdex/utils/core` and set it as `env('calcdex-default-gen')`.
 *
 * @since 0.1.0
 */
export const detectGenFromFormat = (
  format: string,
  defaultGen: GenerationNum = null,
): GenerationNum => {
  if (!GenFormatRegex.test(format)) {
    return defaultGen;
  }

  const gen = <GenerationNum> (parseInt(format.match(GenFormatRegex)[1], 10) || 0);

  if (gen < 1) {
    return defaultGen;
  }

  return gen;
};
