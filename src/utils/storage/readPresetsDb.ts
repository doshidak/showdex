import { type GenerationNum } from '@smogon/calc';
import { type Duration, add, compareAsc } from 'date-fns';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/interfaces/calc';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { detectGenFromFormat, getGenlessFormat } from '@showdex/utils/dex';
import { logger, runtimer } from '@showdex/utils/debug';
import { detectCompletePreset } from '@showdex/utils/presets';
import { showdexedDb } from './openIndexedDb';

const metaName = env('indexed-db-meta-store-name');
const presetsName = env('indexed-db-presets-store-name');
const l = logger('@showdex/utils/storage/writePresetsDb()');

/**
 * Grabs the cached `CalcdexPokemonPreset[]`'s from Showdex's IndexedDB presets store.
 *
 * * `format` is optional & will return every cached preset when omitted.
 *   - Providing a Randoms format or enabling `config.formatOnly` will only grab presets of the matching format.
 *   - Providing any other format will grab all presets of the matching gen.
 * * When `config.maxAge` is specified, stale presets will automatically be purged & omitted from the returned array.
 *   - This can potentially result in an empty array should all presets be stale.
 * * Additionally in production, any changes in the stored build number from the meta store will purge all entries.
 * * This Promise will always `resolve()` when the arguments are invalid, resulting in a no-op.
 *   - `IDBTransaction` errors will be bubbled up to the `IDBDatabase`'s `onerror()` handler.
 * * Guaranteed to return an empty array.
 *
 * @since 1.2.0
 */
export const readPresetsDb = (
  format?: string | GenerationNum,
  config?: {
    db?: IDBDatabase;
    formatOnly?: boolean;
    source?: CalcdexPokemonPresetSource;
    maxAge?: Duration;
  },
): Promise<CalcdexPokemonPreset[]> => new Promise((
  resolve,
  // reject,
) => {
  const endTimer = runtimer(l.scope, l);

  const output: CalcdexPokemonPreset[] = [];
  const db = config?.db || showdexedDb.value;

  if (!presetsName || typeof db?.transaction !== 'function') {
    endTimer('(bad args)');
    resolve(output);

    return;
  }

  const gen = detectGenFromFormat(format);
  const genlessFormat = (typeof format === 'string' && getGenlessFormat(format)) || null;
  const randoms = typeof format === 'string' && format.includes('random');

  const {
    formatOnly,
    source,
    maxAge,
  } = config || {};

  const maxAgeSupplied = nonEmptyObject(maxAge);

  const metaStore = db.transaction(metaName, 'readonly').objectStore(metaName);
  const metaRead = metaStore.get('build-date');

  metaRead.onsuccess = (metaEvent) => {
    const value = (metaEvent.target as typeof metaRead).result as string;
    const buildChanged = !__DEV__ && !!value && env('build-date', value) !== value;

    const txn = db.transaction(presetsName, 'readwrite');
    const store = txn.objectStore(presetsName);

    if (buildChanged) {
      // deletes all entries cause the build changed; not bothering to wait for it, so resolve()'ing immediately
      store.clear();
      endTimer('(build changed)');
      resolve(output);

      return;
    }

    const range = (
      !!gen
        && !!(genlessFormat || source)
        && [
          gen,
          formatOnly && genlessFormat,
          source,
        ].filter(Boolean)
    ) || gen || null;

    const indexName = (
      !!gen
        && [
          'gen',
          formatOnly && !!format && 'format',
          !!source && 'source',
        ].filter(Boolean).join(':')
    ) || null;

    const req = (indexName ? store.index(indexName) : store)
      .openCursor((!!range && IDBKeyRange.only(range)) || undefined);

    req.onsuccess = (reqEvent) => {
      const cursor = (reqEvent.target as typeof req).result;

      // falsy cursor means no more results
      if (!cursor) {
        endTimer('(done)');
        resolve(output);

        return;
      }

      const preset = cursor.value as CalcdexPokemonPreset;

      if (!detectCompletePreset(preset)) {
        return void cursor.continue();
      }

      const stale = maxAgeSupplied
        && !!preset.cached
        && compareAsc(new Date(), add(preset.cached, maxAge)) > -1;

      if (stale) {
        store.delete(cursor.key);
        cursor.continue();

        return;
      }

      if ((!randoms && !preset.format.includes('random')) || preset.format === genlessFormat) {
        output.push(preset);
      }

      cursor.continue();
    };
  };
});
