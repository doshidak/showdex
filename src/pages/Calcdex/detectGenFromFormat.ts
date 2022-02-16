import type { GenerationNum } from '@pkmn/data';

const genRegex = /^gen(\d+)/i;
const defaultGen: GenerationNum = 8;

export const detectGenFromFormat = (
  format: string,
): GenerationNum => {
  if (!genRegex.test(format)) {
    return defaultGen;
  }

  const gen = <GenerationNum> parseInt(format.match(genRegex)[1], 10);

  if (gen < 1) {
    return defaultGen;
  }

  return gen;
};
