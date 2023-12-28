import { env } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const honksName = env('indexed-db-honks-store-name');
const l = logger('@showdex/utils/storage/purgeHonksDb()');

/**
 * Removes saved standalone `CalcdexBattleState`'s (aka. honks) from Showdex's IndexedDB honks store.
 *
 * @since 1.2.0
 */
export const purgeHonksDb = (
  battleId: string | string[],
  config?: {
    db?: IDBDatabase;
  },
): Promise<void> => new Promise((
  resolve,
  // reject,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = config?.db || showdexedDb.value;
  const battleIds = [...(Array.isArray(battleId) ? battleId : [battleId])].filter(Boolean);

  if (!battleIds.length || typeof db?.transaction !== 'function') {
    endTimer('(bad args)');
    resolve();

    return;
  }

  const txn = db.transaction(honksName, 'readwrite');
  const store = txn.objectStore(honksName);

  battleIds.forEach((id) => store.delete(id));

  txn.oncomplete = () => {
    endTimer('(done)');
    resolve();
  };
});
