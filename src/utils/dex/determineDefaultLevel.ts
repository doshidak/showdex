import { env, nonEmptyObject } from '@showdex/utils/core';
import { parseBattleFormat } from './parseBattleFormat';
import { getGenfulFormat } from './getGenfulFormat';

/**
 * Attempts to figure out the default level of Pokemon for the given `format`.
 *
 * * Initially reads from Showdown's `BattleFormats` global, then some hardcoded levels set in the `env`.
 *   - Currently, only two formats have hardcoded default levels: VGC & LC (Little Cup).
 *   - VGC is defined by the `CALCDEX_POKEMON_DEFAULT_VGC_LEVEL` & LC by `CALCDEX_POKEMON_DEFAULT_LC_LEVEL`.
 *   - (Note that as of the time of writing, VGC `BattleFormats` do define a `teambuilderLevel` of `50`.)
 * * `CALCDEX_POKEMON_DEFAULT_LEVEL` will be returned if the level couldn't be determined.
 *   - (& if that isn't defined, `null` will be returned.)
 *
 * @since 1.2.0
 */
export const determineDefaultLevel = (
  format: string,
): number => {
  const {
    gen,
    base: formatBase,
  } = parseBattleFormat(format);

  if (!gen || !formatBase || !nonEmptyObject(BattleFormats)) {
    return null;
  }

  const baseFormat = getGenfulFormat(gen, formatBase);

  const matchedFormat = Object.values(BattleFormats).find((f) => {
    const parsed = parseBattleFormat(f?.id);
    const value = getGenfulFormat(parsed.gen, parsed.base);

    return value === baseFormat;
  });

  if (matchedFormat?.teambuilderLevel) {
    return matchedFormat?.teambuilderLevel;
  }

  if (formatBase.includes('vgc')) {
    return env.int('calcdex-pokemon-default-vgc-level');
  }

  if (formatBase.includes('lc')) {
    return env.int('calcdex-pokemon-default-lc-level');
  }

  return env.int('calcdex-pokemon-default-level', null);
};
