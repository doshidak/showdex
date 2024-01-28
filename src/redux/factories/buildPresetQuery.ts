import { HttpMethod } from '@showdex/consts/core';
import { type PkmnApiSmogonPresetRequest } from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from '@showdex/interfaces/calc';
import { env, nonEmptyObject, runtimeFetch } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { readPresetsDb, writePresetsDb } from '@showdex/utils/storage';
// import { cachePresets } from '@showdex/utils/presets/cachePresets'; /** @todo fix circular dependency import */
// import { getCachedPresets } from '@showdex/utils/presets/getCachedPresets'; /** @todo fix circular dependency import */

const l = logger('@showdex/redux/factories/buildPresetQuery()');

/**
 * Formats containing any of these keywords will forcibly prevent fetching from the "master list," e.g., `/gen9.json`.
 *
 * * In other words, these formats are probably specialized & don't exist in the standard meta formats, so they wouldn't
 *   be in the aforementioned "master list."
 * * Also, don't put this in `@showdex/consts/dex/formats` cause it's unique to the pkmn API.
 *
 * @since 1.1.6
 */
const FormatOnlyKeywords: string[] = [
  'random', // e.g., 'gen9randomdoublesbattle'
  'bdsp', // e.g., 'gen8bdspou'
  'letsgo', // e.g., 'gen7letsgoou'
];

/**
 * Following keywords (`RegExp` string notation allowed) will be removed when assembling the API endpoint value.
 *
 * * Also, don't put this in `@showdex/consts/dex/formats` cause it's unique to the pkmn API.
 *
 * @since 1.1.6
 */
const IgnoredFormatKeywords: string[] = [
  'blitz', // e.g., 'gen9randombattleblitz' -> 'gen9randombattle'
  'mayhem', // e.g., 'gen9randombattlemayhem' -> 'gen9randombattle'
  'monotype', // e.g., 'gen9monotyperandombattle' -> 'gen9randombattle'
  'nodmax', // e.g., 'gen8randombattlenodmax' -> 'gen8randombattle'
  'regulation[a-z]$', // e.g., 'gen9battlestadiumsinglesregulationd' -> 'gen9battlestadiumsingles'
  'series\\d+$', // e.g., 'gen9vgc2023series1' -> 'gen9vgc2023'
  'unrated', // e.g., 'gen9unratedrandombattle' -> 'gen9randombattle'
];

/**
 * Following expressions will be `replace()`'d when assembling the API endpoint value.
 *
 * * Each element must be a tuple in the following order:
 *   - First element is the `RegExp` test condition,
 *   - Second element is the replacement `RegExp` when the test passes, &
 *   - Third element is the replacement `string` (substring matching allowed, e.g., `'foo-$1-bar'`).
 * * Specify `null` for the second argument to use the `RegExp` in the first element.
 *
 * @since 1.1.6
 */
const FormatReplacements: [test: RegExp, replace: RegExp, replacement: string][] = [
  // only here in order to prevent yeeting 'monotype' in other monotyped formats
  // (not sure atm if they fall under this case as well, but just to play it safe)
  // e.g., 'gen9monotyperandombattle' -> 'gen9randombattle'
  [/monotyperandom/i, null, 'random'],

  // note: this format requires special handling cause the gen number changes, I think
  // e.g., 'gen9randomroulette' -> 'gen9randombattle'
  [/randomroulette/i, /roulette/i, 'battle'],

  // FFA Randoms uses Randoms Doubles presets
  // e.g., 'gen9freeforallrandombattle' -> 'gen9randomdoublesbattle'
  [/freeforallrandom/i, null, 'randomdoubles'],

  // does anybody play this ??? o_O
  // e.g., 'gen9multirandombattle' -> 'gen9randomdoublesbattle'
  [/multirandom/i, null, 'randomdoubles'],

  // Randomized Format Spotlight as of 2023/11/14, requested by Pulse_kS
  // e.g., 'gen9partnersincrimerandombattle' -> 'gen9randomdoublesbattle'
  [/partnersincrimerandom/i, null, 'randomdoubles'],

  // Randomized Format Spotlight as of 2024/01/10
  // e.g., 'gen6firstbloodrandombattle' -> 'gen6randombattle'
  [/firstblood/i, null, ''],
];

// 10/10 function name
const formatEndpointFormat = (
  format: string,
): string => {
  if (!format?.length) {
    return format;
  }

  const removalExp = new RegExp(IgnoredFormatKeywords.join('|'), 'i');
  const removed = format.replace(removalExp, '');

  const replacements = FormatReplacements
    .filter(([test]) => test?.test?.(removed))
    .reduce((prev, [test, search, replace]) => prev.replace(search || test, replace), removed);

  return replacements;
};

/* eslint-disable @typescript-eslint/indent */

/**
 * RTK Query factory for fetching `CalcdexPokemonPreset`'s, or if available & still fresh,
 * use the cached `CalcdexPokemonPreset`'s from `LocalStorage`.
 *
 * * now that I look at it again, this function looks like the final boss of TypeScript lmao
 *
 * @since 1.1.6
 */
export const buildPresetQuery = <
  TResponse,
  TMeta = unknown,
>(
  source: CalcdexPokemonPresetSource,
  path: string,
  transformer: (
    args: PkmnApiSmogonPresetRequest,
  ) => (
    data: TResponse,
    meta: TMeta,
    args: PkmnApiSmogonPresetRequest,
  ) => CalcdexPokemonPreset[],
): (
  args: PkmnApiSmogonPresetRequest,
) => Promise<{
  data: CalcdexPokemonPreset[];
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
        || FormatOnlyKeywords.some((f) => format.includes(f))
    );

    // attempt to guess the endpoint from the args
    const endpoint = (filterByFormat && formatEndpointFormat(format)) || `gen${gen}`;
    const cacheEnabled = nonEmptyObject(maxAge);

    if (cacheEnabled) {
      // const [presets, stale] = getCachedPresets(
      //   endpoint,
      //   source,
      //   maxAge,
      // );

      const presets = await readPresetsDb(format, {
        formatOnly,
        source,
        maxAge,
      });

      /*
      if (presets?.length) {
        output = presets;

        if (!stale) {
          endTimer('(cache hit)', 'endpoint', endpoint);

          return { data: output };
        }
      }
      */

      if (presets.length) {
        endTimer('(cache hit)', 'endpoint', endpoint);

        return { data: presets };
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
        output = transform(data, { resHeaders: response.headers } as TMeta, args);
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
      // cachePresets(output, endpoint, source);
      void writePresetsDb(output);
    }

    endTimer('(cache miss)', 'endpoint', endpoint);

    return { data: output };
  };
};

/* eslint-enable @typescript-eslint/indent */
