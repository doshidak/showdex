import type { GenerationNum } from '@pkmn/data';

const GenRegex = /^gen(\d+)/i;

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
  if (!GenRegex.test(format)) {
    return defaultGen;
  }

  const gen = <GenerationNum> parseInt(format.match(GenRegex)[1], 10);

  if (gen < 1) {
    return defaultGen;
  }

  return gen;
};
