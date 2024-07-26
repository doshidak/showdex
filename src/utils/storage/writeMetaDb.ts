import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const metaName = env('indexed-db-meta-store-name');
const l = logger('@showdex/utils/storage/writeMetaDb()');

/**
 * Writes the provided arbitrary `payload` to Showdex's IndexedDB meta store.
 *
 * @since 1.2.4
 */
export const writeMetaDb = (
  payload: Record<string, unknown>,
  config?: {
    db?: IDBDatabase;
  },
): Promise<void> => new Promise((
  resolve,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = config?.db || showdexedDb.value;

  if (!metaName || typeof db?.transaction !== 'function' || !nonEmptyObject(payload)) {
    endTimer('(bad args)');
    resolve();

    return;
  }

  const txn = db.transaction(metaName, 'readwrite');
  const store = txn.objectStore(metaName);

  (Object.entries(payload) as Entries<typeof payload>).forEach(([k, v]) => store.put(v, k));

  txn.oncomplete = () => {
    endTimer('(done)');
    resolve();
  };
});
