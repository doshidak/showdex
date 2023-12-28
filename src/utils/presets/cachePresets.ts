import LzString from 'lz-string';
import { type GenerationNum } from '@smogon/calc';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/interfaces/calc';
import { logger } from '@showdex/utils/debug';
import { getGenlessFormat } from '@showdex/utils/dex';
import { fileSize } from '@showdex/utils/humanize';
import { dehydratePresets } from '@showdex/utils/hydro';
import { purgeLocalStorageItem, writeLocalStorageItem } from '@showdex/utils/storage';
import { getCachedPresets } from './getCachedPresets';

const l = logger('@showdex/utils/presets/cachePresets()');

/**
 * Caches the provided `presets` in the client's `LocalStorage`.
 *
 * * When `format` is provided, every cached preset of the matching `GenerationNum` or format
 *   `string` will be replaced with the provided `presets`.
 *   - In other words, providing a `GenerationNum` will replace all cached presets of that gen,
 *     while providing a format `string` will replace those of that format only.
 *   - Additionally, any `presets` with non-matching `gen` or `format` values will be ignored.
 * * Not providing a `format` will simply append the provided `presets` to the existing cache,
 *   replacing any cached presets of a matching `calcdexId`.
 * * Due to `LocalStorage` limitations of 5 MB per cross-origin (domain), this will compress
 *   the dehydrated presets via `lz-string` in order to maximize storage.
 *   - Note that this storage is also shared with the Showdown client, but it doesn't seem to
 *     store any considerable amount of data.
 *   - ...But that doesn't mean we should be flooding it with our own!
 *   - Additionally, from the same developer as `lz-string`, there's `lzma`, which provides
 *     better compression, but slightly slower.
 *   - For now, we're opting to use `lz-string` since it's faster & speed is currently the
 *     name of the game LOL (as of 2023/07/01).
 * * `LocalStorage` key is configurable via the `STORAGE_PRESET_CACHE_KEY` env.
 *
 * @deprecated As of v1.2.0, Showdex is now using IndexedDB for all things locally stored. Use `writePresetsDb()` from
 *   `@showdex/utils/storage` instead.
 * @since 1.1.6
 */
export const cachePresets = (
  presets: CalcdexPokemonPreset[],
  format?: string | GenerationNum,
  source?: CalcdexPokemonPresetSource,
): void => {
  // l.debug(
  //   '\n', 'presets', presets,
  //   '\n', 'format', format,
  //   '\n', 'source', source,
  // );

  if (!presets?.length) {
    return;
  }

  const genlessFormat = format && typeof format === 'string'
    ? getGenlessFormat(format)
    : null;

  const validPresets = presets.filter((preset) => (
    !!preset?.calcdexId
      && (!source || (!!preset.source && preset.source === source))
      && (typeof preset.gen === 'number' && preset.gen > 0)
      && !!preset.format
      && (!format || (
        typeof format === 'number'
          ? preset.gen === format
          : (
            // `format` could be `'gen9'` or `'gen9ou'`, while `preset.format` will
            // at most be `'ou'`, hence these checks
            format === `gen${preset.gen}` // e.g., 'gen9' === `gen${9}` -> true
              // e.g., getGenlessFormat('gen9ou') === 'ou' -> true
              || genlessFormat === preset.format
          )
      ))
      && !!preset.speciesForme
  ));

  // l.debug('validPresets', validPresets);

  if (!validPresets.length) {
    return null;
  }

  // `cachedPresets` will store our updated preset cache
  // (note: not passing `format` here since we want the entire cache in memory to manipulate it)
  let [cachedPresets = []] = getCachedPresets();

  // l.debug('cachedPresets', '(pre)', cachedPresets);

  // there are 2 possible "modes" based on the input args:
  // 1. `format` isn't provided, so just append/replace the provided `presets`
  if (!format) { // no such thing as gen 0 btw, so all good lmao
    validPresets.forEach((preset) => {
      // check if there's an existing preset
      const existingIndex = cachedPresets.findIndex((p) => p.calcdexId === preset.calcdexId);

      if (existingIndex > -1) {
        // hard-replace the existing preset (i.e., not spreading here)
        return cachedPresets.splice(existingIndex, 1, preset);
      }

      // in ya go
      cachedPresets.push(preset);
    });
  } else {
    // 2. `format` is provided, so remove all cached presets of the matching `format` ...
    // (& optionally `source`, if provided)
    cachedPresets = cachedPresets.filter((preset) => (
      (!!source && preset.source !== source)
        || (typeof format === 'number' && preset.gen !== format)
        || (typeof format === 'string' && (
          /^gen\d+$/i.test(format)
            ? (preset.format.includes('random') || format !== `gen${preset.gen}`)
            : genlessFormat !== preset.format
        ))
    ));

    // ... then add the provided `presets`
    cachedPresets.push(...validPresets);
  }

  // l.debug('cachedPresets', '(post)', cachedPresets);

  // if there's nothing in the cache, delete the key
  if (!cachedPresets.length) {
    return purgeLocalStorageItem('local-storage-deprecated-preset-cache-key');
  }

  // otherwise, compress the cache & store it in `LocalStorage`
  const dehydratedPresets = dehydratePresets(cachedPresets);

  l.debug(
    'Uncompressed preset cache is',
    fileSize(dehydratedPresets?.length),
  );

  if (!dehydratedPresets) {
    if (__DEV__) {
      l.warn(
        'No dehydratedPresets despite having cachedPresets! w0t o_O',
        '\n', 'dehydratedPresets', '(length)', dehydratePresets?.length,
        '\n', 'cachedPresets', '(length)', cachedPresets.length,
        '\n', '(dev warn)',
      );
    }

    return;
  }

  // according to the lz-string docs, the `UTF16` version produces "valid" UTF-16 strings,
  // as opposed to compress(), which uses all 16 bits as needed, potentially out of the
  // valid UTF-16 range; valid ones can be safely stored in every major browser's
  // LocalStorage, at the satanic expense of 6.66% larger size LOL :o
  const compressedPresets = LzString.compressToUTF16(dehydratedPresets);

  if (!compressedPresets) {
    if (__DEV__) {
      l.warn(
        'Failed to compress dehydratedPresets :c',
        '\n', 'dehydratedPresets', '(length)', dehydratePresets?.length,
        '\n', 'compressedPresets', '(length)', compressedPresets?.length,
        '\n', '(dev warn)',
      );
    }

    return;
  }

  l.debug(
    'Compressed preset cache is',
    fileSize(compressedPresets.length * 2),
  );

  // finally store the compressed presets
  writeLocalStorageItem('local-storage-deprecated-preset-cache-key', compressedPresets);
};
