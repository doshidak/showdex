import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

const metaName = env('indexed-db-meta-store-name');
const l = logger('@showdex/utils/storage/updateMetaDb');

const metaEnv: string[] = [
  'build-name',
  'build-date',
  'build-target',
  'package-name',
  'package-version',
];

/**
 * Updates the metadata in Showdex's IndexedDB meta store.
 *
 * * For use in the `oncomplete()` callback of the `IDBOpenDBRequest`.
 *
 * @since 1.2.0
 */
export const updateMetaDb = (
  db: IDBDatabase,
): void => {
  if (!metaName || typeof db?.transaction !== 'function') {
    return void l.warn(
      'huh',
      '\n', 'INDEXED_DB_META_STORE_NAME', metaName,
      '\n', 'db.transaction()', '(type)', typeof db?.transaction,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );
  }

  const txn = db.transaction(metaName, 'readwrite');
  const store = txn.objectStore(metaName);

  metaEnv.forEach((key) => {
    store.put(env(key), key);
  });

  store.put(Date.now(), 'updated');
};
