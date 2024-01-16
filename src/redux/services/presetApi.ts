import {
  type PkmnApiSmogonFormatPresetResponse,
  type PkmnApiSmogonFormatStatsResponse,
  type PkmnApiSmogonPresetRequest,
  type PkmnApiSmogonPresetResponse,
  type PkmnApiSmogonRandomsPresetResponse,
  type PkmnApiSmogonRandomsStatsResponse,
} from '@showdex/interfaces/api';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { buildBundleQuery, buildPresetQuery, createTagProvider } from '@showdex/redux/factories';
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

export const presetApi = pkmnApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (build) => ({
    pokemonBundledPreset: build.query<CalcdexPokemonPreset[], PkmnApiSmogonPresetRequest>({
      queryFn: buildBundleQuery(transformFormatPresetResponse),
      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonFormatPreset: build.query<CalcdexPokemonPreset[], PkmnApiSmogonPresetRequest>({
      queryFn: buildPresetQuery<PkmnApiSmogonPresetResponse | PkmnApiSmogonFormatPresetResponse>(
        'smogon',
        env('pkmn-presets-format-path'),
        ({ formatOnly }) => (formatOnly ? transformFormatPresetResponse : transformPresetResponse),
      ),

      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonFormatStats: build.query<CalcdexPokemonPreset[], PkmnApiSmogonPresetRequest>({
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

    pokemonRandomsStats: build.query<CalcdexPokemonPreset[], PkmnApiSmogonPresetRequest>({
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
  usePokemonBundledPresetQuery,
  usePokemonFormatPresetQuery,
  usePokemonFormatStatsQuery,
  usePokemonRandomsPresetQuery,
  usePokemonRandomsStatsQuery,
} = presetApi;
