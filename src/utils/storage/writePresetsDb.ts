import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { env } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { pluralize } from '@showdex/utils/humanize';
import { detectCompletePreset } from '@showdex/utils/presets';
import { showdexedDb } from './openIndexedDb';

const presetsName = env('indexed-db-presets-store-name');
const l = logger('@showdex/utils/storage/writePresetsDb()');

/**
 * Writes the provided `presets[]` to Showdex's IndexedDB presets store.
 *
 * * Presets store is initialized to have unique `calcdexId` keys (i.e., its `keyPath`).
 *   - `calcdexId`'s are generated based on core properties that affect the resulting damages.
 *   - This includes properties like `speciesForme` & `moves[]`, but not `nickname` or `pokeball`.
 *   - Therefore, it is possible that two different sets with different names have the same `calcdexId`.
 * * Any duplicates will be replaced via the `put()` operation in the `IDBTransaction`.
 * * This Promise will always `resolve()` when the arguments are invalid, resulting in a no-op.
 *   - `IDBTransaction` errors will be bubbled up to the `IDBDatabase`'s `onerror()` handler.
 *   - Where is this exactly, you may ask? Well, in `openIndexedDb()`, of course!
 *
 * @since 1.2.0
 */
export const writePresetsDb = (
  presets: CalcdexPokemonPreset[],
  config?: {
    db?: IDBDatabase;
  },
): Promise<void> => new Promise((
  resolve,
  // reject,
) => {
  const endTimer = runtimer(l.scope, l);
  const db = config?.db || showdexedDb.value;

  if (!presetsName || typeof db?.transaction !== 'function' || !presets?.length) {
    endTimer('(bad args)');
    resolve();

    return;
  }

  const validPresets = presets.filter((p) => detectCompletePreset(p));

  if (!validPresets.length) {
    endTimer('(bad presets)');
    resolve();

    return;
  }

  l.debug(
    'Writing', validPresets.length, pluralize(validPresets.length, 'preset:s', { printNum: false }),
    '\n', 'db', '(name)', db.name, '(v)', db.version,
  );

  const txn = db.transaction(presetsName, 'readwrite');
  const store = txn.objectStore(presetsName);
  const cached = Date.now(); // making sure all the presets have the same timestamp

  validPresets.forEach((preset) => store.put({
    ...preset,
    cached,
  }));

  txn.oncomplete = () => {
    endTimer('(done)');
    resolve();
  };
});
