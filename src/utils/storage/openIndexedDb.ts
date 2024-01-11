import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { createHonksDb } from './createHonksDb';
import { createMetaDb } from './createMetaDb';
import { createPresetsDb } from './createPresetsDb';
import { createSettingsDb } from './createSettingsDb';
import { migrateSettingsDb } from './migrateSettingsDb';
import { updateMetaDb } from './updateMetaDb';

/**
 * Shared opened IndexedDB database, populated at runtime.
 *
 * * Accessible anywhere via a simple `import`.
 *   - This is possible since the object's memory address (aka. a reference) -- not the object itself -- is exported.
 *   - All modules importing this will access the same point in memory to access the mutable `value` property.
 * * You should always check if its `value` is falsy, which it will be prior to the database opening.
 * * Has a terrible name in order to prevent potential `indexedDB` typos if this were to be called `indexedDb`.
 *   - I'm sorry & you're welcome in advance.
 *
 * @since 1.2.0
 */
export const showdexedDb: Record<'value', IDBDatabase> = {
  value: null,
};

const dbName = env('indexed-db-name');
const dbVersion = env.int('indexed-db-version', 1); // defaults to 1 when the `version` arg isn't provided anyway

const l = logger('@showdex/utils/storage/openIndexedDb()');

/* eslint-disable no-promise-executor-return */

/**
 * Opens a connection to Showdex's IndexedDB database hosted on the client's origin (e.g., `play.pokemonshowdown.com`).
 *
 * * In addition to being returned, the opened `IDBDatabase` object will be stored in `indexedDb`.
 * * This should be run during Showdex's initialization, such as in the `main.ts` script.
 *
 * @since 1.2.0
 */
export const openIndexedDb = (): Promise<IDBDatabase> => new Promise((
  resolve,
  reject,
) => {
  if (typeof indexedDB === 'undefined' || !dbName || !dbVersion) {
    const message = 'IndexedDB is\'nt globally available or is not configured in the env.';

    l.error(
      message,
      '\n', 'window.indexedDB', '(type)', typeof window?.indexedDB,
      '\n', 'INDEXED_DB_NAME', dbName, 'INDEXED_DB_VERSION', dbVersion,
    );

    return void reject(new Error(message));
  }

  const settingsName = env('indexed-db-settings-store-name');
  const presetsName = env('indexed-db-presets-store-name');

  if (!settingsName || !presetsName) {
    const message = 'Couldn\'t create the stores cause their names weren\'t provided in the env.';

    l.warn(
      message,
      '\n', 'INDEXED_DB_SETTINGS_STORE_NAME', settingsName,
      '\n', 'INDEXED_DB_PRESETS_STORE_NAME', presetsName,
      '\n', 'INDEXED_DB_NAME', dbName, 'INDEXED_DB_VERSION', dbVersion,
    );

    return void reject(new Error(message));
  }

  const req = indexedDB.open(dbName, dbVersion);

  req.onupgradeneeded = (event) => {
    // note: req.onsuccess() will be fired **after** this callback, so showdexedDb.value won't be available yet!
    const db = (event.target as typeof req)?.result;

    if (typeof db?.createObjectStore !== 'function') {
      return void l.warn(
        'req.onupgradeneeded()', 'Couldn\'t start the upgrade cause of a wack db object.',
        '\n', 'db.createObjectStore()', '(type)', typeof db?.createObjectStore,
        '\n', 'INDEXED_DB_NAME', dbName, 'INDEXED_DB_VERSION', dbVersion,
      );
    }

    createMetaDb(db);
    createSettingsDb(db);
    createPresetsDb(db);
    createHonksDb(db);

    l.verbose(
      'req.onupgradeneeded()', 'Upgrade complete.',
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );
  };

  req.onsuccess = (event) => {
    showdexedDb.value = (event.target as typeof req)?.result;

    // perform localStorage migration from prior Showdex versions
    // (has to be here & not in onupgradeneeded() since the settings object store has no transactions [like createIndex()],
    // so its oncomplete() never fires -- but it will no-op if it reads nothing from LocalStorage)
    migrateSettingsDb(showdexedDb.value);

    // update the metadata
    updateMetaDb(showdexedDb.value);

    if (__DEV__) {
      l.info(
        'req.onsuccess()', 'sdb ready!',
        '\n', 'showdexedDb', '(name)', showdexedDb.value?.name, '(v)', showdexedDb.value?.version,
      );
    }

    resolve(showdexedDb.value);
  };

  req.onerror = (event) => {
    const error = (event.target as typeof req)?.error;

    l.error(
      'req.onerror()', error,
      '\n', 'showdexedDb', '(name)', showdexedDb.value?.name, '(v)', showdexedDb.value?.version,
    );

    reject(error);
  };
});

/* eslint-enable no-promise-executor-return */
