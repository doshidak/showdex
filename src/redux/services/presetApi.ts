import { type GenerationNum } from '@smogon/calc';
import { type Duration } from 'date-fns';
import {
  type PkmnApiSmogonFormatPresetResponse,
  type PkmnApiSmogonFormatStatsResponse,
  type PkmnApiSmogonPresetResponse,
  type PkmnApiSmogonRandomsPresetResponse,
  type PkmnApiSmogonRandomsStatsResponse,
} from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { buildPresetQuery, createTagProvider } from '@showdex/redux/factories';
import {
  transformFormatPresetResponse,
  transformFormatStatsResponse,
  transformPresetResponse,
  transformRandomsPresetResponse,
  transformRandomsStatsResponse,
} from '@showdex/redux/transformers';
import { env } from '@showdex/utils/core';
import { pkmnApi } from './pkmnApi';
import { PokemonReduxTagType } from './tagTypes';

/**
 * Request arguments for a pkmn API endpoint.
 *
 * @since 0.1.3
 */
export interface PkmnApiSmogonPresetRequest {
  gen: GenerationNum;

  /**
   * Primarily intended to distinguish BDSP from any other gen.
   *
   * * BDSP is a special case:
   *   - For non-randoms, we must pull from Gen 4 since Pokemon like Breloom don't exist in Gen 8,
   *     despite the format being `'gen8bdsp*'`.
   *   - For randoms, we must pull from `'gen8bdsprandombattle'`, not `'gen4randombattle'` nor `'gen8randombattle'`.
   *
   * @example 'gen8bdsprandombattle'
   * @since 0.1.3
   */
  format?: string;

  /**
   * Whether to download presets for the specified `format` only.
   *
   * @default false
   * @since 1.0.1
   */
  formatOnly?: boolean;

  /**
   * Maximum age of cached presets before they're considered "stale."
   *
   * * When specified, caching will be enabled.
   *
   * @example
   * ```ts
   * {
   *   weeks: 1,
   * }
   * ```
   * @since 1.1.6
   */
  maxAge?: Duration;
}

export const presetApi = pkmnApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (build) => ({
    pokemonFormatPreset: build.query<CalcdexPokemonPreset[], PkmnApiSmogonPresetRequest>({
      queryFn: buildPresetQuery<PkmnApiSmogonPresetResponse | PkmnApiSmogonFormatPresetResponse>(
        'smogon',
        env('pkmn-presets-format-path'),
        ({ formatOnly }) => (formatOnly ? transformFormatPresetResponse : transformPresetResponse),
      ),

      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonFormatStats: build.query<CalcdexPokemonPreset[], Omit<PkmnApiSmogonPresetRequest, 'formatOnly'>>({
      queryFn: buildPresetQuery<PkmnApiSmogonFormatStatsResponse>(
        'usage',
        env('pkmn-presets-format-stats-path'),
        () => transformFormatStatsResponse,
      ),

      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonRandomsPreset: build.query<CalcdexPokemonPreset[], PkmnApiSmogonPresetRequest>({
      queryFn: buildPresetQuery<PkmnApiSmogonRandomsPresetResponse>(
        'smogon',
        env('pkmn-presets-randoms-path'),
        () => transformRandomsPresetResponse,
      ),

      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonRandomsStats: build.query<CalcdexPokemonPreset[], Omit<PkmnApiSmogonPresetRequest, 'formatOnly'>>({
      queryFn: buildPresetQuery<PkmnApiSmogonRandomsStatsResponse>(
        'usage',
        env('pkmn-presets-randoms-stats-path'),
        () => transformRandomsStatsResponse,
      ),

      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),
  }),
});

export const {
  usePokemonFormatPresetQuery,
  usePokemonFormatStatsQuery,
  usePokemonRandomsPresetQuery,
  usePokemonRandomsStatsQuery,
} = presetApi;
