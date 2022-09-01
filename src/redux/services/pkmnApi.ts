import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@showdex/utils/core';
import { PokemonReduxTagType } from '@showdex/consts';

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

  tagTypes: [
    PokemonReduxTagType,
  ].flatMap((type) => <string[]> Object.values(type)),

  // do not add endpoints here; inject them in other files for code-splitting
  endpoints: () => ({}),
});
