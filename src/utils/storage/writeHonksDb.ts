import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const honksName = env('indexed-db-honks-store-name');
const l = logger('@showdex/utils/storage/writeHonksDb()');

/**
 * Writes a `CalcdexBattleState` object to the IndexedDB honks object store.
 *
 * * Returns the Unix epoch timestamp at which the `state` was cached.
 * * `null` will be returned if the writing failed for whatever reason.
 *
 * @since 1.2.0
 */
export const writeHonksDb = (
  state: CalcdexBattleState,
  config?: {
    db: IDBDatabase;
  },
): Promise<number> => new Promise((
  resolve,
  // reject,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = config?.db || showdexedDb.value;

  if (!nonEmptyObject(state) || !state.battleId || typeof db?.transaction !== 'function') {
    endTimer('(bad args)');
    resolve(null);

    return;
  }

  if (!state.name || state.operatingMode !== 'standalone') {
    endTimer('(bad state)');
    resolve(null);

    return;
  }

  const txn = db.transaction(honksName, 'readwrite');
  const store = txn.objectStore(honksName);
  const cached = Date.now();

  store.put({ ...state, cached });

  txn.oncomplete = () => {
    endTimer(
      '(done)',
      '\n', 'battleId', state.battleId,
      '\n', 'cached', cached,
    );

    resolve(cached);
  };
});
