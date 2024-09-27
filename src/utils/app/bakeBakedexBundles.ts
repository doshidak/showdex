import { type Duration, add, compareAsc } from 'date-fns';
import {
  type BakedexApiBundleResponse,
  type BakedexApiBunsAssetBundle,
  type BakedexApiBunsNamespace,
  type BakedexApiBunsResponse,
  BakedexApiBunsNamespaces,
} from '@showdex/interfaces/api';
import { type RootStore, type ShowdexSliceBundles, showdexSlice } from '@showdex/redux/store';
import {
  env,
  getResourceUrl,
  joinUris,
  nonEmptyObject,
  runtimeFetch,
} from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import {
  type ShowdexBundlesDbResult,
  readBundlesDb,
  readMetaDb,
  showdexedDb,
  writeBundlesDb,
  writeMetaDb,
} from '@showdex/utils/storage';

const baseUrl = joinUris(env('bakedex-base-url'), env('bakedex-api-prefix'));
const maxAge: Duration = { [env('bakedex-update-interval-unit', 'weeks')]: env.int('bakedex-update-interval', 2) };

const fetchOptions: Parameters<typeof runtimeFetch>[1] = {
  headers: { Accept: 'text/plain' },
};

const l = logger('@showdex/utils/app/bakeBakedexBundles()');

/**
 * Determines if any Bakedex asset bundles need to be updated & updates them.
 *
 * @since 1.2.4
 */
export const bakeBakedexBundles = async (
  config?: {
    db?: IDBDatabase;
    store?: RootStore;
  },
): Promise<void> => {
  const { db: database, store } = { ...config };
  const db = database || showdexedDb.value;
  const enabled = env.bool('bakedex-enabled');

  const writePayload: ShowdexBundlesDbResult = {};
  const statePayload: Partial<ShowdexSliceBundles> = {};

  const { bundled } = await readMetaDb<Record<'bundled', number>>(['bundled'], { db });
  const { buns } = await readBundlesDb(['buns'], { db });
  const cacheStale = !nonEmptyObject(buns) || !bundled || compareAsc(new Date(), add(new Date(bundled), maxAge)) > -1;

  let latestBuns = buns;

  if (cacheStale) {
    const bunsUrl = enabled && baseUrl ? joinUris(baseUrl, 'buns') : getResourceUrl('buns.json');
    const bunsResponse = await runtimeFetch<BakedexApiBunsResponse>(bunsUrl, fetchOptions);
    const bunsData = bunsResponse.json();

    if (!bunsData?.ok || bunsData.ntt !== 'buns' || !nonEmptyObject(bunsData.payload)) {
      return l.error('Couldn\'t fetch the latest bundle catalog:', bunsData);
    }

    ({ payload: latestBuns } = bunsData);
  }

  if (!nonEmptyObject(latestBuns)) {
    return void l.error(
      'Couldn\'t load any bundle catalog at all :o !!',
      '\n', 'buns', '(cached)', buns,
      '\n', 'buns', '(latest)', latestBuns,
    );
  }

  const staleBunIds: Partial<Record<BakedexApiBunsNamespace, string[]>> = {};

  for (const [nsp, latestNspBuns] of Object.entries(latestBuns) as Entries<typeof latestBuns>) {
    if (!BakedexApiBunsNamespaces.includes(nsp)) {
      continue;
    }

    if (!Array.isArray(staleBunIds[nsp])) {
      staleBunIds[nsp] = [];
    }

    const cachedNspBuns = Object.values({ ...buns?.[nsp] }) as BakedexApiBunsAssetBundle[];

    for (const latestNspBun of Object.values(latestNspBuns) as typeof cachedNspBuns) {
      if (!latestNspBun?.id) {
        continue;
      }

      const cachedNspBun = cachedNspBuns.find((b) => !!b?.id && b.id === latestNspBun.id);

      if (!cachedNspBun?.updated) {
        l.debug(
          'Couldn\'t find the cached bundle namespace metadata; marking', nsp, 'bundle', latestNspBun.id, 'as stale!',
          '\n', 'cachedNspBun', cachedNspBun,
          '\n', 'latestNspBun', latestNspBun,
          '\n', 'buns', '(cached)', buns,
          '\n', 'buns', '(latest)', latestBuns,
        );

        staleBunIds[nsp].push(latestNspBun.id);

        continue;
      }

      const cachedDate = new Date(cachedNspBun.updated).valueOf() || 0;
      const latestDate = new Date(latestNspBun.updated).valueOf() || 0;

      if (latestDate > cachedDate) {
        l.debug(
          'Latest updated timestamp is after cached timestamp; marking', nsp, 'bundle', latestNspBun.id, 'as stale!',
          '\n', 'cachedNspBun', '(updated)', cachedDate, cachedNspBun,
          '\n', 'latestNspBun', '(updated)', latestDate, latestNspBun,
          '\n', 'buns', '(cached)', buns,
          '\n', 'buns', '(latest)', latestBuns,
        );

        staleBunIds[nsp].push(latestNspBun.id);

        continue;
      }

      // load cached bundle into Redux
      const cached = await readBundlesDb([nsp], { db });

      if (!nonEmptyObject(cached[nsp]?.[latestNspBun.id])) {
        l.debug(
          'Actual cached bundle assets don\'t exist apparently; marking', nsp, 'bundle', latestNspBun.id, 'as stale!',
          '\n', 'cached', cached,
          '\n', 'cachedNspBun', cachedNspBun,
          '\n', 'latestNspBun', latestNspBun,
          '\n', 'buns', '(cached)', buns,
          '\n', 'buns', '(latest)', latestBuns,
        );

        staleBunIds[nsp].push(latestNspBun.id);

        continue;
      }

      // 'presets' aren't being *directly* loaded into Redux btw (i.e., the ShowdexSliceState)
      // (instead, they're loaded into the RTK Query API endpoint slice via buildBundleQuery() from @showdex/redux/factories)
      if (latestNspBun.ntt !== 'presets') {
        (statePayload as Record<typeof latestNspBun.ntt, unknown[]>)[latestNspBun.ntt] = [
          ...(statePayload[latestNspBun.ntt] || []),
          ...(Array.isArray(cached[nsp][latestNspBun.id]) ? (cached[nsp][latestNspBun.id] as unknown[]).map((item) => ({
            ...(item as Record<string, unknown>),
            __bunId: latestNspBun.id,
            __updated: cachedDate,
          })) : []),
        ];
      }

      statePayload.buns = {
        ...latestBuns,
        ...statePayload.buns,
        [nsp]: {
          ...latestNspBuns,
          ...statePayload.buns?.[nsp],
          [latestNspBun.id]: { ...latestNspBun },
        },
      };
    }
  }

  const hasChanges = Object.values(staleBunIds).some((ids) => !!ids.length);

  l.debug(
    'Found', hasChanges ? 'some' : 'no', 'bundles to', enabled ? 'update' : 'load',
    '\n', 'buns', '(cached)', buns,
    '\n', 'buns', '(latest)', latestBuns,
    '\n', 'staleBunIds[]', staleBunIds,
    '\n', 'statePayload', statePayload,
  );

  if (hasChanges) {
    for (const [nsp, ids] of Object.entries(staleBunIds) as Entries<typeof staleBunIds>) {
      if (!ids?.length) {
        continue;
      }

      for (const id of ids) {
        const nspBun = latestBuns[nsp][id];
        const prebundleUrl = getResourceUrl(`${id}.${nspBun.ext || 'json'}`);
        const bundleUrl = enabled && baseUrl ? joinUris(baseUrl, nsp, id, nspBun.ext) : prebundleUrl;

        let bundleData: BakedexApiBundleResponse<'presets' | 'titles' | 'tiers'> = null;

        try {
          const bundleResponse = await runtimeFetch<typeof bundleData>(bundleUrl, fetchOptions);

          bundleData = bundleResponse.json();

          if (!bundleData?.ok) {
            throw new Error(`bundleData is not ok from ${bundleUrl} >:((((`);
          }
        } catch (error) {
          if (!enabled) {
            throw error;
          }

          // attempt to load the prebundle since the latest wasn't available from the online repo
          const bundleResponse = await runtimeFetch<typeof bundleData>(prebundleUrl, fetchOptions);

          bundleData = bundleResponse.json();
        }

        if (!bundleData?.ok) { // we tried :c
          l.warn('Couldn\'t fetch the latest bundle:', bundleData);

          continue;
        }

        (writePayload as Record<typeof nsp, unknown>)[nsp] = {
          ...latestBuns[nsp],
          ...writePayload[nsp],
          [id]: bundleData.payload,
        };

        const shouldUpdateState = ['players', 'supporters'].includes(nsp)
          && ['titles', 'tiers'].includes(bundleData.ntt)
          && Array.isArray(bundleData.payload);

        if (shouldUpdateState) {
          const ntt = bundleData.ntt as 'titles' | 'tiers'; // nt ts

          (statePayload as Record<typeof ntt, unknown[]>)[ntt] = [
            ...(statePayload[ntt] || []),
            ...(bundleData.payload as typeof statePayload[typeof ntt]).map((item) => ({
              ...(item as Record<string, unknown>),
              __bunId: id,
              __updated: new Date(nspBun.updated).valueOf(),
            })),
          ];
        }

        writePayload.buns = {
          ...latestBuns,
          ...writePayload.buns,
          [nsp]: {
            ...latestBuns[nsp],
            ...writePayload.buns?.[nsp],
            [id]: { ...nspBun },
          },
        };
      }
    }
  }

  const hasWrites = Object.values(writePayload).some((v) => nonEmptyObject(v));

  if (hasWrites) {
    await writeBundlesDb(writePayload, { db });
    await writeMetaDb({ bundled: Date.now() }, { db });

    statePayload.buns = { ...writePayload.buns };

    l.debug(
      'Updated some new bundles',
      '\n', 'buns', '(cached)', buns,
      '\n', 'buns', '(latest)', latestBuns,
      '\n', 'staleBunIds[]', staleBunIds,
      '\n', 'writePayload', writePayload,
      '\n', 'statePayload', statePayload,
    );
  }

  if (typeof store?.dispatch !== 'function' || !Object.values(statePayload).some((v) => nonEmptyObject(v))) {
    return;
  }

  store.dispatch(showdexSlice.actions.updateBundles(statePayload));
};
