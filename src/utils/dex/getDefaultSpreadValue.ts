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
 * getDefaultSpreadValue('ev', 'gen9championsou'); // 0 (Champions stat points, via CALCDEX_POKEMON_PRESET_DEFAULT_EV)
 * getDefaultSpreadValue('ev', 'gen9championsrandombattle'); // 11 (via CALCDEX_POKEMON_PRESET_DEFAULT_CHAMPIONS_RANDOMS_EV)
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

  // note: Champions formats (e.g. 'gen9championsrandombattle') match .includes('random') but use stat points
  // (0-32), so they must NOT pick up the randoms neutral 85 EVs
  const champions = typeof format === 'string' && format.includes('champions');
  const randoms = !champions && typeof format === 'string' && format.includes('random');

  // Champions Randoms: PS's team generator (data/random-battles/champions/teams.ts) gives every stat 11 stat points
  // (then zeroes atk for special attackers, trims hp for SR/Sub/Belly Drum, & zeroes spe for Trick Room), and the
  // pkmn randbats data only lists those deviations (e.g. `{ atk: 0 }`), omitting every stat that's at 11 -- the same
  // way gen9randombattle omits stats at 85. Champions IVs remain a fixed 31 (handled by the default IV below).
  if (champions && spread === 'ev' && typeof format === 'string' && format.includes('random')) {
    return env.int('calcdex-pokemon-preset-default-champions-randoms-ev', null) ?? defaultValue;
  }

  // blech
  const baseEnvKey = 'calcdex-pokemon-preset-default'
    + (randoms ? '-randoms' : '')
    + (legacy ? '-legacy' : '');

  return env.int(`${baseEnvKey}-${spread}`, null) ?? defaultValue;
};
