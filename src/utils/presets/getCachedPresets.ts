import { type GenerationNum } from '@smogon/calc';
import { type Duration, add, compareAsc } from 'date-fns';
import LzString from 'lz-string';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/redux/store';
import { getStoredItem, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { fileSize } from '@showdex/utils/humanize';
import { hydratePresets } from '@showdex/utils/hydro';

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

  const stale = nonEmptyObject(maxAge)
    ? compareAsc(new Date(), add(hydration.date, maxAge)) > -1
    : undefined;

  return [
    hydration.presets,
    stale,
  ];
};
