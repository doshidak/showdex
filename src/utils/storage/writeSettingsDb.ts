import { type ShowdexSettings, ShowdexSettingsGroups } from '@showdex/interfaces/app';
import { env, nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const settingsName = env('indexed-db-settings-store-name');
const l = logger('@showdex/utils/storage/writeSettingsDb()');

/**
 * Writes a `ShowdexSettings` object to the IndexedDB settings object store.
 *
 * @since 1.2.0
 */
export const writeSettingsDb = (
  settings: ShowdexSettings,
  config?: {
    db?: IDBDatabase;
  },
): Promise<void> => new Promise((
  resolve,
  reject,
) => {
  const db = config?.db || showdexedDb.value;

  if (!settingsName || !nonEmptyObject(settings) || typeof db?.transaction !== 'function') {
    const message = !nonEmptyObject(settings)
      ? 'did you forget the settings arg perchance :o'
      : 'o where o where has my IndexedDB gone ???';

    l.warn(
      message,
      '\n', 'INDEXED_DB_SETTINGS_STORE_NAME', settingsName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    reject(new Error(message));

    return;
  }

  const txn = db.transaction(settingsName, 'readwrite');
  const store = txn.objectStore(settingsName);
  const remaining = { ...settings };

  ShowdexSettingsGroups.forEach((group) => {
    if (group === 'showdex') {
      return;
    }

    store.put(remaining[group], group);
    delete remaining[group];
  });

  if (nonEmptyObject(remaining)) {
    store.put(remaining, 'showdex');
  }

  txn.oncomplete = () => resolve();

  txn.onerror = (event) => {
    const error = (event.target as typeof txn)?.error;

    l.error(
      'txn.onerror()', error,
      '\n', 'db', '(name)', db.name, '(v)', db.version,
    );

    reject(error);
  };
});
