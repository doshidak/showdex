import { ShowdexSettingsGroups } from '@showdex/interfaces/app';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { hydrateSettings } from '@showdex/utils/hydro';
import { purgeLocalStorageItem, readLocalStorageItem } from './localStorage';

const settingsName = env('indexed-db-settings-store-name');
const l = logger('@showdex/utils/storage/migrateSettingsDb()');

/**
 * Moves the settings stored in LocalStorage from pre-v1.2.0 installations to the post-v1.2.0 IndexedDB.
 *
 * * Existing stored entries, if any, will be merged with default settings.
 * * Will also purge the LocalStorage entry itself.
 * * No-op if no value was read from the LocalStorage.
 * * For use within a `IDBTransaction` callback, such as `onsuccess()` & `oncomplete()`.
 *
 * @since 1.2.0
 */
export const migrateSettingsDb = (
  db: IDBDatabase,
): void => {
  if (!settingsName || typeof db?.transaction !== 'function') {
    return void l.warn(
      '...something\'s wrong... I can feel it',
      '\n', 'INDEXED_DB_SETTINGS_STORE_NAME', settingsName,
      '\n', 'db.transaction()', '(type)', typeof db?.transaction,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );
  }

  const locallyStored = readLocalStorageItem('local-storage-deprecated-settings-key');

  if (!locallyStored) {
    // return l.silly(
    //   'Ignoring migration due to empty LocalStorage value',
    //   '\n', 'locallyStored', locallyStored,
    //   '\n', 'INDEXED_DB_SETTINGS_STORE_NAME', settingsName,
    //   '\n', 'db', '(name)', db.name, '(v)', db.version,
    // );

    return;
  }

  const txn = db.transaction(settingsName, 'readwrite');
  const store = txn.objectStore(settingsName);
  const hydrated = hydrateSettings(locallyStored);

  ShowdexSettingsGroups.forEach((group) => {
    // this is a pseudo-group since its properties are at the object root of `hydrated`
    if (group === 'showdex') {
      return;
    }

    store.put(hydrated[group], group);
    delete hydrated[group];
  });

  // what's left should be the Showdex settings
  if (nonEmptyObject(hydrated)) {
    store.put(hydrated, 'showdex');
  }

  /*
  txn.onabort = (e) => {
    const error = (e.target as typeof txn)?.error;

    l.warn(
      'txn.onabort()', 'Migration transaction aborted',
      '\n', 'error', error,
      '\n', 'db', '(name)', db.name, '(v)', db.version, '(store)', store?.name || settingsName,
    );
  };

  txn.onerror = (e) => {
    const error = (e.target as typeof txn)?.error;

    l.warn(
      'txn.onerror()', 'Migration transaction failed',
      '\n', 'error', error,
      '\n', 'db', '(name)', db.name, '(v)', db.version, '(store)', store?.name || settingsName,
    );
  };
  */

  if (locallyStored) {
    purgeLocalStorageItem('local-storage-deprecated-settings-key');
  }

  l.verbose(
    'Migrated ShowdexSettings from LocalStorage -> IndexedDB',
    '\n', 'locallyStored', locallyStored,
    '\n', 'db', '(name)', db.name, '(v)', db.version, '(store)', store?.name || settingsName,
  );
};
