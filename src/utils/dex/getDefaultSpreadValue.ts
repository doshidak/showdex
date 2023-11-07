import { type GenerationNum } from '@smogon/calc';
import { env } from '@showdex/utils/core';
import { detectLegacyGen } from './detectLegacyGen';

/**
 * Returns the default value for the given `spread` type & `format`.
 *
 * * If any of the inputs are invalid, the `defaultValue` (which is `0` by default lol) will be returned.
 *
 * @example
 * ```ts
 * getDefaultSpreadValue('iv'); // 31 (via CALCDEX_POKEMON_PRESET_DEFAULT_IV)
 * getDefaultSpreadValue('iv', 'gen1ou'); // 30 (via CALCDEX_POKEMON_PRESET_DEFAULT_LEGACY_IV)
 * getDefaultSpreadValue('iv', 9); // 31 (via CALCDEX_POKEMON_PRESET_DEFAULT_IV)
 * getDefaultSpreadValue('ivs', 69); // 0 (invalid spread type)
 * getDefaultSpreadValue('iv', 'gen9ou'); // 31 (via CALCDEX_POKEMON_PRESET_DEFAULT_IV)
 * getDefaultSpreadValue('ev'); // 0 (via CALCDEX_POKEMON_PRESET_DEFAULT_EV)
 * getDefaultSpreadValue('ev', 'gen1ou'); // 252 (via CALCDEX_POKEMON_PRESET_DEFAULT_LEGACY_EV)
 * getDefaultSpreadValue('ev', 'gen1randombattle'); // 252 (via CALCDEX_POKEMON_PRESET_DEFAULT_RANDOMS_LEGACY_EV)
 * getDefaultSpreadValue('ev', 'gen9ou'); // 0 (via CALCDEX_POKEMON_PRESET_DEFAULT_EV)
 * getDefaultSpreadValue('ev', 'gen9randombattle'); // 85 (via CALCDEX_POKEMON_PRESET_DEFAULT_RANDOMS_EV)
 * ```
 * @since 1.1.7
 */
export const getDefaultSpreadValue = (
  spread: 'iv' | 'ev',
  format?: string | GenerationNum,
  defaultValue = 0,
): number => {
  if (!['iv', 'ev'].includes(spread)) {
    return defaultValue;
  }

  const legacy = detectLegacyGen(format);
  const randoms = typeof format === 'string' && format.includes('random');

  // blech
  const baseEnvKey = 'calcdex-pokemon-preset-default'
    + (randoms ? '-randoms' : '')
    + (legacy ? '-legacy' : '');

  return env.int(`${baseEnvKey}-${spread}`, null) ?? defaultValue;
};
