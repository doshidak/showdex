import { type ShowdexSettings, type ShowdexSettingsGroup, ShowdexSettingsGroups } from '@showdex/interfaces/app';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { showdexedDb } from './openIndexedDb';

const settingsName = env('indexed-db-settings-store-name');
const l = logger('@showdex/utils/storage/readSettingsDb()');

/**
 * Builds a `ShowdexSettings` object from objects stored in the IndexedDB settings object store.
 *
 * @since 1.2.0
 */
export const readSettingsDb = (
  database?: IDBDatabase,
): Promise<Partial<ShowdexSettings>> => new Promise((
  resolve,
  reject,
) => {
  const db = database || showdexedDb.value;

  if (!settingsName || typeof db?.transaction !== 'function') {
    const message = 'IndexedDB may have not been initialized yet o_O did you forget to open it first?';

    l.warn(
      message,
      '\n', 'INDEXED_DB_SETTINGS_STORE_NAME', settingsName,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );

    reject(new Error(message));

    return;
  }

  const store = db.transaction(settingsName, 'readonly').objectStore(settingsName);
  const req = store.openCursor();

  let output: Partial<ShowdexSettings> = {};

  req.onsuccess = (event) => {
    const cursor = (event.target as typeof req).result;

    // falsy cursor means no more results
    if (!cursor) {
      return void resolve(output);
    }

    const group = cursor.key as ShowdexSettingsGroup;

    if (!ShowdexSettingsGroups.includes(group)) {
      return void cursor.continue();
    }

    if (group === 'showdex') {
      output = {
        ...output,
        ...(cursor.value as Partial<ShowdexSettings>),
      };
    } else {
      // ts angy about the pseudo showdex settings, which is definitely a sign I gotta refactor that bish
      output[group] = cursor.value as never;
    }

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
