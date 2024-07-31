import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';
import { type ShowdexBundlesDbResult } from './readBundlesDb';

const bundlesName = env('indexed-db-bundles-store-name');
const l = logger('@showdex/utils/storage/writeBundlesDb()');

/* eslint-disable no-promise-executor-return */

/**
 * Writes the mapped `payload` to Showdex's IndexedDB bundles object store.
 *
 * @since 1.2.4
 */
export const writeBundlesDb = (
  payload: ShowdexBundlesDbResult,
  config?: {
    db?: IDBDatabase;
  },
): Promise<void> => new Promise((
  resolve,
  reject,
) => {
  const db = config?.db || showdexedDb.value;

  if (!bundlesName || !nonEmptyObject(payload) || typeof db?.transaction !== 'function') {
    const message = !nonEmptyObject(payload)
      ? 'yo u forget the payload arg by any chance'
      : 'wya IndexedDB o_O';

    l.warn(
      message,
      '\n', 'INDEXED_DB_BUNDLES_STORE_NAME', bundlesName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return void reject(new Error(message));
  }

  const txn = db.transaction(bundlesName, 'readwrite');
  const store = txn.objectStore(bundlesName);

  (Object.entries(payload) as Entries<typeof payload>).forEach(([
    key,
    value,
  ]) => void store.put(value, key));

  txn.oncomplete = () => resolve();

  txn.onerror = (event) => {
    const error = (event.target as typeof txn)?.error;

    l.error(
      'txn.onerror()', error,
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );

    reject(error);
  };
});

/* eslint-enable no-promise-executor-return */
