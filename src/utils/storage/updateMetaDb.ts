import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { writeMetaDb } from './writeMetaDb';

const l = logger('@showdex/utils/storage/updateMetaDb');

const metaEnv: string[] = [
  'build-name',
  'build-date',
  'build-target',
  'package-name',
  'package-version',
];

/**
 * Updates the metadata in Showdex's IndexedDB meta store.
 *
 * * For use in the `oncomplete()` callback of the `IDBOpenDBRequest`.
 *
 * @since 1.2.0
 */
export const updateMetaDb = (
  db: IDBDatabase,
): void => {
  if (typeof db?.transaction !== 'function') {
    return void l.warn(
      'huh',
      '\n', 'db.transaction()', '(type)', typeof db?.transaction,
      '\n', 'db', '(name)', db?.name, '(v)', db?.version,
    );
  }

  const payload = metaEnv.reduce((prev, key) => ({
    ...prev,
    [key]: env(key),
  }), {
    updated: Date.now(),
  });

  void writeMetaDb(payload, { db });
};
