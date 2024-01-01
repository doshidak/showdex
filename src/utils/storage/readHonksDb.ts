import { type CalcdexBattleState } from '@showdex/interfaces/calc';
import { type CalcdexSliceState } from '@showdex/redux/store';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const honksName = env('indexed-db-honks-store-name');
const l = logger('@showdex/utils/storage/readHonksDb()');

/**
 * Reads from Showdex's IndexedDB honks store & returns all the stored honks, if any.
 *
 * * Guaranteed to return an empty object.
 *
 * @since 1.2.0
 */
export const readHonksDb = (
  database?: IDBDatabase,
): Promise<CalcdexSliceState> => new Promise((
  resolve,
  // reject,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = database || showdexedDb.value;
  const output: CalcdexSliceState = {};

  if (!honksName || typeof db?.transaction !== 'function') {
    endTimer('(bad args)');
    resolve(output);

    return;
  }

  const txn = db.transaction(honksName);
  const store = txn.objectStore(honksName);
  const req = store.index('cached').openCursor();

  req.onsuccess = (event) => {
    const cursor = (event.target as typeof req).result;

    if (!cursor) {
      endTimer('(done)');
      resolve(output);

      return;
    }

    const state = cursor.value as CalcdexBattleState;

    if (!nonEmptyObject(state) || !state.battleId) {
      return void cursor.continue();
    }

    output[state.battleId] = state;
    cursor.continue();
  };
});
