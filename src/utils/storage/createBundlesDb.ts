import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

const bundlesName = env('indexed-db-bundles-store-name');
const l = logger('@showdex/utils/storage/createBundlesDb()');

/**
 * Creates the meta object store in the provided IndexedDB `db`.
 *
 * * This particular object store has no `keyPath` & disabled `autoIncrement`.
 *   - Has no indices either.
 *   - For this reason, `oncomplete()` from the returned `store.transaction` object won't fire!
 * * Contains information about the Showdex installation that last opened the IndexedDB.
 *   - Typically used to determine whether presets should be considered stale.
 *   - May be used for other things tho.
 * * For use within the `onupgradeneeded()` callback.
 *
 * @since 1.2.4
 */
export const createBundlesDb = (
  db: IDBDatabase,
): IDBObjectStore => {
  if (!bundlesName || typeof db?.createObjectStore !== 'function') {
    l.warn(
      'you require more minerals',
      '\n', 'db.createObjectStore()', '(type)', typeof db?.createObjectStore,
      '\n', 'INDEXED_DB_BUNDLES_STORE_NAME', bundlesName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return null;
  }

  if (db.objectStoreNames.contains(bundlesName)) {
    l.silly(bundlesName, 'object store already exists');

    return null;
  }

  const store = db.createObjectStore(bundlesName);

  l.verbose(
    'Created object store:', store?.name,
    '\n', 'db', '(name)', db.name, '(v)', db.version,
  );

  return store;
};
