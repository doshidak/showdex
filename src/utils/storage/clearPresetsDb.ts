import { env } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const presetsName = env('indexed-db-presets-store-name');
const l = logger('@showdex/utils/storage/clearPresetsDb()');

/**
 * Clears the entire Showdex's IndexedDB presets store.
 *
 * * This Promise will always `resolve()` when the arguments are invalid, resulting in a no-op.
 *   - `IDBTransaction` errors will be bubbled up to the `IDBDatabase`'s `onerror()` handler.
 *
 * @since 1.2.0
 */
export const clearPresetsDb = (
  config?: {
    db?: IDBDatabase;
  },
): Promise<void> => new Promise((
  resolve,
  // reject,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = config?.db || showdexedDb.value;

  if (!presetsName || typeof db?.transaction !== 'function') {
    endTimer('(bad args)');
    resolve();

    return;
  }

  const txn = db.transaction(presetsName, 'readwrite');
  const store = txn.objectStore(presetsName);
  const req = store.clear();

  req.onsuccess = () => {
    endTimer('(done)');
    resolve();
  };
});
