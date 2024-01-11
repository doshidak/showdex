import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

const metaName = env('indexed-db-meta-store-name');
const l = logger('@showdex/utils/storage/createMetaDb()');

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
 * @since 1.2.0
 */
export const createMetaDb = (
  db: IDBDatabase,
): IDBObjectStore => {
  if (!metaName || typeof db?.createObjectStore !== 'function') {
    l.warn(
      'spawn more overlords',
      '\n', 'db.createObjectStore()', '(type)', typeof db?.createObjectStore,
      '\n', 'INDEXED_DB_META_STORE_NAME', metaName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return null;
  }

  const store = db.createObjectStore(metaName);

  l.verbose(
    'Created object store:', store?.name,
    '\n', 'db', '(name)', db.name, '(v)', db.version,
  );

  return store;
};
