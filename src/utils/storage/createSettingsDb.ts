import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

const settingsName = env('indexed-db-settings-store-name');
const l = logger('@showdex/utils/storage/createSettingsDb()');

/**
 * Creates the settings object store in the provided IndexedDB `db`.
 *
 * * This particular object store has no `keyPath` (i.e., out-of-line keys) & disabled `autoIncrement`.
 *   - Has no indices either.
 *   - For this reason, `oncomplete()` from the returned `store.transaction` object won't fire!
 * * Keys in this store will correspond to those of `ShowdexSettings`, as defined by `ShowdexSettingsGroup`.
 *   - Only exception is `'showdex'`, which is a pseudo-group since its properties are in the root of the settings object.
 * * For use within the `onupgradeneeded()` callback.
 *
 * @since 1.2.0
 */
export const createSettingsDb = (
  db: IDBDatabase,
): IDBObjectStore => {
  if (!settingsName || typeof db?.createObjectStore !== 'function') {
    l.warn(
      'you must construct additional pylons',
      '\n', 'db.createObjectStore()', '(typeo', typeof db?.createObjectStore,
      '\n', 'INDEXED_DB_SETTINGS_STORE_NAME', settingsName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    return null;
  }

  const store = db.createObjectStore(settingsName);

  l.verbose(
    'Created object store:', store?.name,
    '\n', 'db', '(name)', db.name, '(v)', db.version,
  );

  return store;
};
