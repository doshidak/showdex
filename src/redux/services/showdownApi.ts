import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '@showdex/utils/core';
import { ShowdownReduxTagType } from './tagTypes';

/**
 * Serves as the base query for all calls to Showdown's client API.
 *
 * @warning Do not use this directly. Add `endpoints` by calling `showdownApi.injectEndpoints()`.
 * @since 1.0.7
 */
export const showdownApi = createApi({
  reducerPath: 'showdownApi',

  // note: endpoints use queryFn() to get around the fetch() limitations within an WebExtension environment,
  // so while this is defined and initialized, is ultimately unused lmao
  baseQuery: fetchBaseQuery({
    baseUrl: env('showdown-client-base-url'), // e.g., 'https://play.pokemonshowdown.com'
  }),

  tagTypes: [
    ShowdownReduxTagType,
  ].flatMap((type) => <string[]> Object.values(type)),

  // do not add endpoints here; inject them in other files for code-splitting
  endpoints: () => ({}),
});
