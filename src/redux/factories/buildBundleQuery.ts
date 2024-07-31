import { type BaseQueryApi } from '@reduxjs/toolkit/dist/query';
import { type PkmnApiSmogonPresetRequest, type PkmnApiSmogonFormatPresetResponse } from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { type RootState } from '@showdex/redux/store';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { readBundlesDb } from '@showdex/utils/storage';

const l = logger('@showdex/redux/factories/buildBundleQuery()');

/* eslint-disable @typescript-eslint/indent */

/**
 * RTK Query factory for fetching `CalcdexPokemonPreset[]`'s from a locally bundled `ShowdexPresetsBundle`.
 *
 * * No caching occurs as the file itself is locally bundled with Showdex.
 *
 * @since 1.2.1
 */
export const buildBundleQuery = (
  transformer: (
    data: PkmnApiSmogonFormatPresetResponse,
    meta: unknown,
    args: PkmnApiSmogonPresetRequest,
  ) => CalcdexPokemonPreset[],
): (
  args: PkmnApiSmogonPresetRequest,
  api: BaseQueryApi,
) => Promise<{
  data: CalcdexPokemonPreset[],
}> => {
  if (typeof transformer !== 'function') {
    l.error(
      'got a bad transformer !!',
      '\n', 'transformer', '(type)', typeof transformer,
    );

    throw new Error('buildBundleQuery() was provided a bad transformer :o');
  }

  return async (args, api) => {
    const endTimer = runtimer(l.scope, l);

    const {
      gen,
      bundleIds,
    } = args || {};

    const output: CalcdexPokemonPreset[] = [];

    if (!gen || !bundleIds?.length) {
      endTimer(
        '(empty req)', 'gen', gen,
        '\n', 'bundleIds[]', bundleIds,
        '\n', 'args', args,
      );

      return { data: output };
    }

    const bundles = (api.getState() as RootState)?.showdex?.bundles;

    if (!nonEmptyObject(bundles?.buns?.presets)) {
      endTimer(
        '(empty buns.presets)', 'gen', gen,
        '\n', 'bundleIds[]', bundleIds,
        '\n', 'bundles', bundles,
        '\n', 'args', args,
      );

      return { data: output };
    }

    for (const id of bundleIds) {
      // const bundle = ShowdexPresetsBundles.find((b) => b?.id === id);
      const bundle = bundles.buns.presets[id];

      const validBundle = !!bundle?.id
        && bundle.ntt === 'presets'
        && !bundle.disabled
        && bundle.gen === gen;

      if (!validBundle) {
        continue;
      }

      /*
      const url = getResourceUrl(`${bundle.id}${bundle.ext ? `.${bundle.ext}` : ''}`);
      const response = await runtimeFetch<PkmnApiSmogonFormatPresetResponse>(url, {
        method: HttpMethod.GET,
        headers: { Accept: 'application/json' },
      });

      const data = response.json();
      */

      const { presets: bundledPresets } = await readBundlesDb(['presets']);
      const data = bundledPresets?.[bundle.id];

      const presets = transformer(data, null, {
        ...args,
        source: 'bundle',
        format: bundle.format,
      });

      if (!presets?.length) {
        continue;
      }

      presets.forEach((preset) => {
        if (!preset?.calcdexId || output.some((o) => o.calcdexId === preset.calcdexId)) {
          return;
        }

        preset.bundleId = bundle.id;
        preset.bundleName = bundle.name;

        output.push(preset);
      });
    }

    endTimer(
      '(unpacked)', 'gen', gen,
      '\n', 'bundleIds[]', bundleIds,
      '\n', '#output', output.length,
    );

    return { data: output };
  };
};

/* eslint-enable @typescript-eslint/indent */
