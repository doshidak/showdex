import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@showdex/utils/core';
import { PokemonReduxTagType } from './tagTypes';

/**
 * Serves as the base query for all calls to the pkmn API.
 *
 * * Data in this API's reducer may be massive, typically in the thousands.
 *   - May not be a good idea to enable the Redux `devTools` options since it may cause the
 *     entire website to hang (and eventually crash).
 *
 * @warning Do not use this directly. Add `endpoints` by calling `pkmnApi.injectEndpoints()`.
 * @since 0.1.3
 */
export const pkmnApi = createApi({
  reducerPath: 'pkmnApi',

  baseQuery: fetchBaseQuery({
    baseUrl: env('pkmn-presets-base-url'), // e.g., 'https://pkmn.github.io'

    // uses the background service worker to fetch() data from an external source
    // (Chrome does not allow an injected extension like this to directly call fetch() due to CORS)
    // update: doesn't work -- see the comment in the pokemonGensPreset endpoint for more info
    // fetchFn: runtimeFetch,
  }),

  // note: setupListeners() aren't configured, so these have no effect if `true`;
  // also, these settings are globally applied to any API that injects endpoints into this API (e.g., presetApi)
  refetchOnFocus: false,
  refetchOnReconnect: false,

  // warning: you can't set this to `Infinity` since they use this value for math under-the-hood
  // see: https://github.com/reduxjs/redux-toolkit/discussions/2347#discussioncomment-2873143
  keepUnusedDataFor: 31536000, // in sec; 1 year, which is fine for our purposes

  tagTypes: [
    PokemonReduxTagType,
  ].flatMap((type) => Object.values(type) as string[]),

  // do not add endpoints here; inject them in other files for code-splitting
  endpoints: () => ({}),
});
