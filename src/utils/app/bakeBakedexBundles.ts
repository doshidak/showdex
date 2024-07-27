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
  const cacheStale = !nonEmptyObject(buns) || (bundled && compareAsc(new Date(), add(new Date(bundled), maxAge)) > -1);

  let latestBunNsps = buns;

  if (cacheStale) {
    const bunsUrl = enabled ? joinUris(baseUrl, 'buns') : getResourceUrl('buns.json');
    const bunsResponse = await runtimeFetch<BakedexApiBunsResponse>(bunsUrl, fetchOptions);
    const bunsData = bunsResponse.json();

    if (!bunsData?.ok || bunsData.ntt !== 'buns' || !nonEmptyObject(bunsData.payload)) {
      return l.error('Couldn\'t fetch the latest bundle catalog:', bunsData);
    }

    ({ payload: latestBunNsps } = bunsData);
  }

  if (!nonEmptyObject(latestBunNsps)) {
    return void l.error(
      'Couldn\'t load any bundle catalog at all :o !!',
      '\n', 'buns', '(cached)', buns, '\n', '(latest)', latestBunNsps,
    );
  }

  const staleBunIds: Partial<Record<BakedexApiBunsNamespace, string[]>> = {};

  for (const [nsp, nspBuns] of Object.entries(latestBunNsps) as Entries<typeof latestBunNsps>) {
    if (!BakedexApiBunsNamespaces.includes(nsp)) {
      continue;
    }

    if (!Array.isArray(staleBunIds[nsp])) {
      staleBunIds[nsp] = [];
    }

    const cachedNspBuns = Object.values({ ...buns?.[nsp] }) as BakedexApiBunsAssetBundle[];

    for (const nspBun of Object.values(nspBuns) as typeof cachedNspBuns) {
      const cachedNspBun = cachedNspBuns.find((b) => !!b?.id && b.id === nspBun?.id);

      if (!cachedNspBun?.id) {
        staleBunIds[nsp].push(nspBun.id);

        continue;
      }

      const cachedDate = new Date(cachedNspBun.updated).valueOf() || 0;
      const latestDate = new Date(nspBun.updated).valueOf() || 0;

      if (latestDate > cachedDate) {
        staleBunIds[nsp].push(nspBun.id);

        continue;
      }

      // load cached bundle into Redux
      const cached = await readBundlesDb([nsp], { db });

      if (!nonEmptyObject(cached[nsp]?.[nspBun.id])) {
        staleBunIds[nsp].push(nspBun.id);

        continue;
      }

      // 'presets' aren't being *directly* loaded into Redux btw (i.e., the ShowdexSliceState)
      // (instead, they're loaded into the RTK Query API endpoint slice via buildBundleQuery() from @showdex/redux/factories)
      if (nspBun.ntt !== 'presets') {
        (statePayload as Record<typeof nspBun.ntt, unknown[]>)[nspBun.ntt] = [
          ...(statePayload[nspBun.ntt] || []),
          ...(Array.isArray(cached[nsp][nspBun.id]) ? (cached[nsp][nspBun.id] as unknown[]).map((item) => ({
            ...(item as Record<string, unknown>),
            __bunId: nspBun.id,
            __updated: cachedDate,
          })) : []),
        ];
      }

      statePayload.buns = {
        ...statePayload.buns,
        [nsp]: { ...statePayload.buns?.[nsp], [nspBun.id]: { ...nspBun } },
      };
    }
  }

  const hasChanges = Object.values(staleBunIds).some((ids) => !!ids.length);

  l.debug(
    'Found', hasChanges ? 'some' : 'no', 'bundles to', enabled ? 'update' : 'load',
    '\n', 'buns', '(cached)', buns, '\n', '(latest)', latestBunNsps,
    '\n', 'staleBunIds', staleBunIds,
  );

  if (hasChanges) {
    for (const [nsp, ids] of Object.entries(staleBunIds) as Entries<typeof staleBunIds>) {
      if (!ids?.length) {
        continue;
      }

      for (const id of ids) {
        const nspBun = latestBunNsps[nsp][id];
        const prebundleUrl = getResourceUrl(`${id}.${nspBun.ext || 'json'}`);
        const bundleUrl = enabled ? joinUris(baseUrl, nsp, id) : prebundleUrl;

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
          ...writePayload[nsp],
          [id]: bundleData.payload,
        };

        const shouldUpdateState = (nsp === 'players' || nsp === 'supporters')
          && (bundleData.ntt === 'titles' || bundleData.ntt === 'tiers')
          && Array.isArray(bundleData.payload);

        if (shouldUpdateState) {
          const ntt = bundleData.ntt as 'titles' | 'tiers'; // nt ts
          const payload = bundleData.payload as typeof statePayload[typeof ntt];

          // ggwp
          (statePayload as Record<typeof ntt, unknown[]>)[ntt] = [
            ...(statePayload[ntt] || []),
            ...payload.map((item) => ({
              ...(item as Record<string, unknown>),
              __bunId: id,
              __updated: new Date(nspBun.updated).valueOf(),
            })),
          ];
        }

        writePayload.buns = {
          ...writePayload.buns,
          [nsp]: { ...writePayload.buns?.[nsp], [id]: { ...nspBun } },
        };
      }
    }
  }

  const hasWrites = Object.values(writePayload).some((v) => nonEmptyObject(v));

  if (hasWrites) {
    await writeBundlesDb(writePayload, { db });
    await writeMetaDb({ bundled: Date.now() }, { db });

    statePayload.buns = { ...writePayload.buns };
  }

  l.debug(
    'Updated', hasWrites ? 'no' : 'some', 'new bundles',
    '\n', 'buns', '(cached)', buns, '\n', '(latest)', latestBunNsps,
    '\n', 'staleBunIds[]', staleBunIds,
    '\n', 'writePayload', writePayload,
    '\n', 'statePayload', statePayload,
  );

  if (typeof store?.dispatch !== 'function' || !Object.values(statePayload).some((v) => nonEmptyObject(v))) {
    return;
  }

  store.dispatch(showdexSlice.actions.updateBundles(statePayload));
};
