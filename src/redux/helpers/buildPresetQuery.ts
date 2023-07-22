import { HttpMethod } from '@showdex/consts/core';
import { type PkmnSmogonPresetRequest } from '@showdex/redux/services';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/redux/store';
import { detectGenFromFormat } from '@showdex/utils/battle/detectGenFromFormat'; /** @todo reorganize me */
import { env, nonEmptyObject, runtimeFetch } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { cachePresets } from '@showdex/utils/presets/cachePresets'; /** @todo fix circular dependency import */
import { getCachedPresets } from '@showdex/utils/presets/getCachedPresets'; /** @todo fix circular dependency import */

const l = logger('@showdex/redux/helpers/buildPresetQuery()');

/* eslint-disable @typescript-eslint/indent */

/**
 * RTK Query factory for fetching `CalcdexPokemonPreset`'s, or if available & still fresh,
 * use the cached `CalcdexPokemonPreset`'s from `LocalStorage`.
 *
 * * now that I look at it again, this function looks like the final boss of TypeScript lmao
 *
 * @since 1.1.6
 */
export const buildPresetQuery = <TResponse>(
  source: CalcdexPokemonPresetSource,
  path: string,
  transformer: (
    args: PkmnSmogonPresetRequest,
  ) => (
    data: TResponse,
    meta: unknown,
    args: PkmnSmogonPresetRequest,
  ) => CalcdexPokemonPreset[],
): (
  args: PkmnSmogonPresetRequest,
) => Promise<{
  data: CalcdexPokemonPreset[],
}> => {
  if (!source || !path || typeof transformer !== 'function') {
    l.error(
      'did you forget the factory args?',
      '\n', 'source', '(type)', typeof source, '(value)', source,
      '\n', 'path', '(type)', typeof path, '(value)', path,
      '\n', 'transformer', '(type)', typeof transformer,
    );

    throw new Error('buildPresetQuery() received invalid factory arguments :o');
  }

  return async (args) => {
    const endTimer = runtimer(l.scope, l);

    const {
      gen,
      format,
      formatOnly,
      maxAge,
    } = args || {};

    let output: CalcdexPokemonPreset[] = [];

    // if this is false, then we'll fetch ALL presets for the detected gen
    const filterByFormat = !!format && (
      source === 'usage'
        || formatOnly
        || [
          'random', // e.g., 'gen9randomdoublesbattle'
          'bdsp', // e.g., 'gen8bdspou'
          'letsgo', // e.g., 'gen7letsgoou'
        ].some((f) => format.includes(f))
    );

    // attempt to guess the endpoint from the args
    const endpoint = filterByFormat
      // e.g., 'gen9vgc2023series1' -> 'gen9vgc2023';
      // 'gen9battlestadiumsinglesregulationd' -> 'gen9battlestadiumsingles';
      // 'gen9randombattleblitz' -> 'gen9randombattle';
      // 'gen9unratedrandombattle' -> 'gen9randombattle';
      // 'gen9randomdoublesbattle' -> 'gen9randomdoublesbattle' (no change);
      // 'gen8bdspou' -> 'gen8bdspou' (no change) -- you get the idea lol
      ? format.replace(/series\d+$|regulation[a-z]$|blitz|unrated/i, '')
      // e.g., 'gen9'
      : `gen${gen}`;

    const cacheEnabled = nonEmptyObject(maxAge);

    if (cacheEnabled) {
      const [presets, stale] = getCachedPresets(
        filterByFormat
          ? endpoint
          : typeof format === 'number'
            ? format
            : detectGenFromFormat(format, gen),
        source,
        maxAge,
      );

      if (presets?.length) {
        output = presets;

        if (!stale) {
          endTimer('(cache hit)', 'endpoint', endpoint);

          return { data: output };
        }
      }
    }

    // build the preset API URL to fetch from
    const url = env('pkmn-presets-base-url')
      // remove any potential double-slashes (or more) in the URL path
      // e.g., '/smogon/data/sets//gen9ou' -> '/smogon/data/sets/gen9ou'
      + `${path}/${endpoint}`.replace(/\/{2,}/g, '/')
      + env('pkmn-presets-endpoint-suffix');

    try {
      // fetch the presets
      const response = await runtimeFetch<TResponse>(url, {
        method: HttpMethod.GET,
        headers: { Accept: 'application/json' },
      });

      // btw, json() here is not async cause it's from runtimeFetch() lmao
      const data = response.json();

      // build a transform function from the `transformer` factory
      const transform = transformer(args);

      if (typeof transform === 'function') {
        output = transform(data, null, args);
      }
    } catch (error) {
      // use the cache if we have to lol
      if (output.length) {
        endTimer('(cache fallback)', 'endpoint', endpoint);

        return { data: output };
      }

      throw error;
    }

    // update the cache if enabled
    if (cacheEnabled && output.length) {
      cachePresets(output, endpoint, source);
    }

    endTimer('(cache miss)', 'endpoint', endpoint);

    return { data: output };
  };
};

/* eslint-enable @typescript-eslint/indent */
