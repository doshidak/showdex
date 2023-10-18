import { type GenerationNum } from '@smogon/calc';
import { type Duration, add, compareAsc } from 'date-fns';
import LzString from 'lz-string';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/redux/store';
import {
  clearStoredItem,
  env,
  getStoredItem,
  nonEmptyObject,
} from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { fileSize } from '@showdex/utils/humanize';
import { hydrateHeader, hydratePresets } from '@showdex/utils/hydro';

const l = logger('@showdex/utils/presets/getCachedPresets()');

/**
 * Grabs the cached `CalcdexPokemonPreset`'s from `LocalStorage`.
 *
 * * Preset freshness can be checked by reading the second element of the returned tuple.
 *   - This value is only populated when the `maxAge` argument is provided.
 *   - Note that presets will still be returned even if the cache is stale.
 *   - Callers should determine whether they should use the cached presets based on this value.
 * * Optional `format` argument will filter which presets are hydrated.
 *   - Providing no value will hydrate all available presets.
 *   - See notes in `hydratePresets()` for additional information.
 * * Cached presets are compressed via `lz-string` due to `LocalStorage` limitations.
 *   - See notes in `cachePresets()` for additional information.
 * * `LocalStorage` key is configurable via the `STORAGE_PRESET_CACHE_KEY` env.
 *
 * @since 1.1.6
 */
export const getCachedPresets = (
  format?: GenerationNum | string,
  source?: CalcdexPokemonPresetSource,
  maxAge?: Duration,
): [
  presets?: CalcdexPokemonPreset[],
  stale?: boolean,
] => {
  const cache = getStoredItem('storage-preset-cache-key');

  if (!cache) {
    return [];
  }

  // see compressToUTF16() in cachePresets() for more info
  // (as to why we're not using LzString.decompress() here)
  const decompressed = LzString.decompressFromUTF16(cache);

  if (!decompressed) {
    return [];
  }

  l.debug(
    'Decompressed preset cache',
    'from', fileSize(cache.length * 2),
    'to', fileSize(decompressed.length * 2),
  );

  const hydration = hydratePresets(decompressed, format, source);

  if (!hydration.descriptorValid) {
    return [];
  }

  const [header] = hydrateHeader(decompressed);

  const buildChanged = !__DEV__ && !!header?.timestamp && (
    env('build-date') !== header.timestamp
      || env('package-version') !== header.version
  );

  /**
   * @todo find a better cache purging method (might be race-condition-mania here lol)
   */
  if (buildChanged) {
    l.info(
      'Purging stale preset cache due to detected build change!',
      '\n', 'version', '(prev)', header.version, '(now)', env('package-version'),
      '\n', 'build', '(prev)', header.timestamp, '(now)', env('build-date'),
    );

    clearStoredItem('storage-preset-cache-key');
  }

  const stale = buildChanged
    ? true
    : nonEmptyObject(maxAge)
      ? compareAsc(new Date(), add(hydration.date, maxAge)) > -1
      : undefined;

  return [
    hydration.presets,
    stale,
  ];
};
