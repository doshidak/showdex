import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

const honksName = env('indexed-db-honks-store-name');
const l = logger('@showdex/utils/storage/createHonksDb()');

/**
 * Creates the honks object store in the provided IndexedDB `db`.
 *
 * * This particular object store has the `'battleId'` as the `keyPath` (i.e., in-line keys) & disabled `autoIncrement`.
 * * These contained saved honks (each of type `CalcdexBattleState`), which are created by Honkdexes.
 * * For use within the `onupgradeneeded()` callback.
 *
 * @since 1.2.0
 */
export const createHonksDb = (
  db: IDBDatabase,
): IDBObjectStore => {
  if (!honksName || typeof db?.createObjectStore !== 'function') {
    l.warn(
      'there is no cow level',
      '\n', 'db.createObjectStore()', '(type)', typeof db?.createObjectStore,
      '\n', 'INDEXED_DB_HONKS_STORE_NAME', honksName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return null;
  }

  const store = db.createObjectStore(honksName, {
    keyPath: 'battleId',
  });

  store.createIndex('format', 'format', { unique: false });
  store.createIndex('name', 'name', { unique: false });
  store.createIndex('cached', 'cached', { unique: false });

  store.transaction.oncomplete = () => {
    l.verbose(
      'Created object store:', store?.name,
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );
  };

  return store;
};
