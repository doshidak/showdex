import { type GenerationNum, type Weather } from '@smogon/calc';
import { LegacyWeatherNames, WeatherMap, WeatherNames } from '@showdex/consts/dex';
import { detectGenFromFormat } from './detectGenFromFormat';

/**
 * Determines the possible weather conditions for the gen number extracted from the provided `format`.
 *
 * * Primarily used for populating options for the *Weather* dropdown in `FieldCalc`.
 *   - For this purpose, guaranteed to at least return an empty array (instead of `null`).
 *
 * @default
 * ```ts
 * []
 * ```
 * @since 1.1.2
 */
export const getWeatherConditions = (
  format: GenerationNum | string,
): Weather[] => {
  if (!format) {
    return [];
  }

  const gen = typeof format === 'string'
    ? detectGenFromFormat(format)
    : format;

  // gen 1 doesn't have weather!
  if (gen < 2) {
    return [];
  }

  // gens 2-5 has some weather, but not all
  // (Hail was introduced in gen 3)
  if (gen < 6) {
    // note: TypeScript infers that `gen > 2 && WeatherMap.hail` can evaluate to `''`,
    // so it arrives at the incompatible typing of `('' | Weather)[]`, hence the type assertion lol
    return [
      ...LegacyWeatherNames,
      gen > 2 && WeatherMap.hail,
    ].filter(Boolean) as Weather[];
  }

  // shallow copying the array of strings to modify it
  // (we'll be removing either Hail or Snow, as Snow replaces Hail in gens 9+)
  const weatherNames = [...WeatherNames];

  // remove Snow if we're not in gens 9+ (i.e., gens 6-8, at this point, technically)
  if (gen < 9) {
    const snowIndex = weatherNames.findIndex((n) => n === 'Snow');

    if (snowIndex > -1) {
      weatherNames.splice(snowIndex, 1);
    }
  }

  // remove Hail if we're in gens 9+
  if (gen > 8) {
    const hailIndex = weatherNames.findIndex((n) => n === 'Hail');

    if (hailIndex > -1) {
      weatherNames.splice(hailIndex, 1);
    }
  }

  return weatherNames;
};
