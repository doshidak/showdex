import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { purgeLocalStorageItem } from './localStorage';

const presetsName = env('indexed-db-presets-store-name');
const l = logger('@showdex/utils/storage/createPresetsDb()');

/**
 * Creates the presets object store in the provided IndexedDB `db`.
 *
 * * This particular object store has the `'calcdexId'` as the `keyPath` (i.e., in-line keys) & disabled `autoIncrement`.
 *   - Has a couple non-unique indices too, such as `'gen'` & `'speciesForme'`.
 *   - All data in the LocalStorage preset cache will be purged on the `transaction`'s `oncomplete()` callback.
 *   - New presets will be cached in this store afterward on the next download of fresh Smogon sets.
 * * For use within the `onupgradeneeded()` callback.
 *
 * @since 1.2.0
 */
export const createPresetsDb = (
  db: IDBDatabase,
): IDBObjectStore => {
  if (!presetsName || typeof db?.createObjectStore !== 'function') {
    l.warn(
      'additional supply depots required',
      '\n', 'db.createObjectStore()', '(type)', typeof db?.createObjectStore,
      '\n', 'INDEXED_DB_PRESETS_STORE_NAME', presetsName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return null;
  }

  const store = db.createObjectStore(presetsName, {
    keyPath: 'calcdexId',
  });

  store.createIndex('gen', 'gen', { unique: false });
  store.createIndex('format', 'format', { unique: false });
  store.createIndex('source', 'source', { unique: false });
  store.createIndex('gen:format', ['gen', 'format'], { unique: false });
  store.createIndex('gen:source', ['gen', 'source'], { unique: false });
  store.createIndex('gen:format:source', ['gen', 'format', 'source'], { unique: false });
  store.createIndex('speciesForme', 'speciesForme', { unique: false });
  store.createIndex('cached', 'cached', { unique: false });

  store.transaction.oncomplete = () => {
    purgeLocalStorageItem('local-storage-deprecated-preset-cache-key');

    l.verbose(
      'Created object store:', store?.name,
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );
  };

  return store;
};
