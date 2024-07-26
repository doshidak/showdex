import { type BakedexApiBunsPayload, type PkmnApiSmogonFormatPresetResponse } from '@showdex/interfaces/api';
import { type ShowdexPlayerTitle, type ShowdexSupporterTier } from '@showdex/interfaces/app';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

export type ShowdexBundlesDbResult = {
  buns?: BakedexApiBunsPayload;
  players?: Record<string, ShowdexPlayerTitle[]>;
  presets?: Record<string, PkmnApiSmogonFormatPresetResponse>;
  supporters?: Record<string, ShowdexSupporterTier[]>;
};

const bundlesName = env('indexed-db-bundles-store-name');
const l = logger('@showdex/utils/storage/readBundlesDb()');

/* eslint-disable no-promise-executor-return */

/**
 * Builds a payload mapping of the requested entity `keys[]` from Showdex's IndexedDB bundles store.
 *
 * @since 1.2.4
 */
export const readBundlesDb = (
  keys: string[],
  config?: {
    db?: IDBDatabase;
  },
): Promise<ShowdexBundlesDbResult> => new Promise((
  resolve,
  reject,
) => {
  const db = config?.db || showdexedDb.value;

  if (!bundlesName || typeof db?.transaction !== 'function') {
    const message = 'IndexedDB may have not been initialized yet o_O did you forget to open it first?';

    l.warn(
      message,
      '\n', 'INDEXED_DB_BUNDLES_STORE_NAME', bundlesName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return void reject(new Error(message));
  }

  if (!keys?.length) {
    return void resolve({});
  }

  const store = db.transaction(bundlesName, 'readonly').objectStore(bundlesName);
  const req = store.openCursor();

  const output: ShowdexBundlesDbResult = {};

  req.onsuccess = (event) => {
    const cursor = (event.target as typeof req).result;

    // falsy cursor means no more results
    if (!cursor) {
      return void resolve(output);
    }

    const key = String(cursor.key) as keyof ShowdexBundlesDbResult;

    if (!keys.includes(key)) {
      return void cursor.continue();
    }

    (output as Record<typeof key, unknown>)[key] = cursor.value;
    cursor.continue();
  };

  req.onerror = (event) => {
    const error = (event.target as typeof req)?.error;

    l.error(
      'req.onerror()', error,
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );

    reject(error);
  };
});

/* eslint-enable no-promise-executor-return */
