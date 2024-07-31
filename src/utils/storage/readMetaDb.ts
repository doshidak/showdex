import { env } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const metaName = env('indexed-db-meta-store-name');
const l = logger('@showdex/utils/storage/readMetaDb()');

/* eslint-disable @typescript-eslint/indent */

/**
 * Builds the arbitrary payload object of the requested `keys[]` from Showdex's meta store.
 *
 * @since 1.2.0
 */
export const readMetaDb = <
  T extends object = Record<string, unknown>,
>(
  keys: string[],
  config?: {
    db?: IDBDatabase;
  },
): Promise<T> => new Promise((
  resolve,
  reject,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = config?.db || showdexedDb.value;

  if (!metaName || typeof db?.transaction !== 'function' || !keys?.length) {
    endTimer('(bad args)');
    resolve({} as T);

    return;
  }

  const store = db.transaction(metaName, 'readonly').objectStore(metaName);
  const req = store.openCursor();

  const output = {} as T;

  req.onsuccess = (event) => {
    const cursor = (event.target as typeof req).result;

    // falsy cursor means no more results
    if (!cursor) {
      endTimer('(done)');
      resolve(output);

      return;
    }

    const key = String(cursor.key);

    if (!keys.includes(key)) {
      return void cursor.continue();
    }

    output[key] = cursor.value as T[keyof T];
    cursor.continue();
  };

  req.onerror = (event) => {
    const error = (event.target as typeof req)?.error;

    l.error(
      'req.onerror()', error,
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );

    endTimer('(error)');
    reject(error);
  };
});

/* eslint-enable @typescript-eslint/indent */
