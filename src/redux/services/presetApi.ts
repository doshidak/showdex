import { HttpMethod } from '@showdex/consts/core';
import { createTagProvider } from '@showdex/redux/helpers';
import {
  transformFormatPresetResponse,
  transformFormatStatsResponse,
  transformPresetResponse,
  transformRandomsPresetResponse,
  transformRandomsStatsResponse,
} from '@showdex/redux/transformers';
import { env, runtimeFetch } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { AbilityName, ItemName, MoveName } from '@smogon/calc/dist/data/interface';
import type { CalcdexPokemonPreset } from '@showdex/redux/store';
import { PokemonReduxTagType } from './tagTypes';
import { pkmnApi } from './pkmnApi';

/**
 * Request arguments for a pkmn API endpoint.
 *
 * @since 0.1.3
 */
export interface PkmnSmogonPresetRequest {
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
}

/**
 * Schema of a (battle) format set for a given Pokemon.
 *
 * @since 0.1.0
 */
export interface PkmnSmogonPreset {
  /**
   * Note that this key is purposefully all lowercase.
   *
   * @since 1.1.0
   */
  teratypes?: Showdown.TypeName | Showdown.TypeName[];

  /**
   * Note that this key exists in case the pkmn API changes the casing.
   *
   * @since 1.1.0
   */
  teraTypes?: Showdown.TypeName | Showdown.TypeName[];

  ability: AbilityName | AbilityName[];
  nature: Showdown.PokemonNature | Showdown.PokemonNature[];
  item: ItemName | ItemName[];
  moves: (MoveName | MoveName[])[];
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
}

/**
 * Downloaded JSON from the pkmn Gen Sets API.
 *
 * * Models the structure of the sets of an entire gen (e.g., `'/gen8.json'`),
 *   which includes every format in that gen.
 *   - Incompatible with the structure of the sets of a single format (e.g., `'/gen8ou.json'`),
 *     which does not have the `format` key wrapping each `PkmnSmogonPreset`.
 * * Note that the Randoms API has a different schema, so you should use `PkmnSmogonRandomsPresetResponse` instead.
 * * Won't be used as a final type since we'll convert these into `CalcdexPokemonPreset`s
 *   in the `transformPresetResponse()` function.
 * * Updated from v0.1.0, where the original typing was something like:
 *   `Record<string, Record<string, Record<string, unknown>>>`.
 *   - Required lots of manual type assertions, so this is a lot cleaner.
 *   - No idea why I didn't type it like this in the first place... LOL.
 *
 * @since 0.1.3
 */
export interface PkmnSmogonPresetResponse {
  [speciesForme: string]: {
    [format: string]: {
      [presetName: string]: PkmnSmogonPreset;
    }
  }
}

/**
 * Downloaded JSON from the Gen Format Sets API via `@pkmn/smogon`.
 *
 * @since 1.0.1
 */
export interface PkmnSmogonFormatPresetResponse {
  [speciesForme: string]: {
    [presetName: string]: PkmnSmogonPreset;
  };
}

/**
 * Downloaded JSON from the pkmn Gen Format Stats API.
 *
 * @since 1.0.3
 */
export interface PkmnSmogonFormatStatsResponse {
  battles: number;

  pokemon: {
    [speciesForme: string]: {
      count: number;
      weight: number;

      lead: {
        raw: number;
        real: number;
        weighted: number;
      };

      usage: {
        raw: number;
        real: number;
        weighted: number;
      };

      viability: [
        bigBigNumberIdk: number,
        smallerNumberMaybe: number,
        maybeSmallerNumber: number,
        noIdeaTbh: number,
      ];

      abilities: { [name: AbilityName]: number; };
      items: { [name: ItemName]: number; };
      spreads: { [spread: string]: number; };
      moves: { [name: MoveName]: number; };
      happinesses: { [value: string]: number; };

      teammates: {
        [speciesForme: string]: number;
      };

      counters: {
        [speciesForme: string]: [
          bigBigNumberIdk: number,
          percentageProbably: number,
          anotherPercentageIdk: number,
        ];
      };
    };
  };
}

/**
 * Schema of a randoms set for a given Pokemon.
 *
 * * Note that in randoms, all Pokemon are given the *Hardy* nature,
 *   which provides no stat increases/decreases (neutral).
 *   - There are 4 other neutral natures like *Bashful* and *Serious*,
 *     but looking at the `@smogon/damage-calc` (aka. ex-`@honko/damage-calc`) code,
 *     it seems the choice was *Hardy*.
 *
 * @see https://calc.pokemonshowdown.com/randoms.html
 * @since 0.1.0
 */
export interface PkmnSmogonRandomPreset {
  level: number;
  abilities: AbilityName[];
  items: ItemName[];

  /**
   * Won't exist in Gen 9 due to the introduction of the `roles` system.
   *
   * @since 0.1.0
   */
  moves?: MoveName[];

  /**
   * Unless specified, all IVs should default to `31`.
   *
   * @example
   * ```ts
   * // results in IVs: 31 HP, 0 ATK, 31 DEF, 31 SPA, 31 SPD, 31 SPE
   * { atk: 0 }
   * ```
   * @since 0.1.0
   */
  ivs?: Showdown.StatsTable;

  /**
   * Unless specified, all EVs should default to `84`.
   *
   * * Why 84? Since you can only have total of 508 EVs, considering there are 6 different stats,
   *   we can apply a simple mathematical algorithm to arrive at the value 84 for each stat.
   *   - Technically, 508 ÷ 6 is 84.6667, but we floor the value to 84.
   *   - Why 508? Because Pokemon said so. ¯\_(ツ)_/¯
   *   - Also for non-Chinese EVs, you typically apply 252 EVs to 2 stats and the remaining 4 EVs
   *     to another, so 252 + 252 + 4 = 508.
   *   - Showdown's Teambuilder also reports a max of 508 EVs.
   *
   * @example
   * ```ts
   * // results in EVs: 84 HP, 84 ATK, 84 DEF, 84 SPA, 84 SPD, 0 SPE
   * // (yes, this doesn't add up to 508 EVs, but that's how random sets work apparently)
   * { spe: 0 }
   * ```
   * @see https://calc.pokemonshowdown.com/randoms.html
   * @since 0.1.0
   */
  evs?: Showdown.StatsTable;

  /**
   * New roles system introduced for Gen 9 random battles.
   *
   * @since 1.1.0
   */
  roles?: {
    [roleName: string]: {
      abilities: AbilityName[];
      items: ItemName[];
      teraTypes: Showdown.TypeName[];
      moves: MoveName[];
      ivs?: Showdown.StatsTable;
      evs?: Showdown.StatsTable;
    };
  };
}

/**
 * Downloaded JSON from the pkmn Randoms API.
 *
 * * Note that the schema is different from that of the Gen Sets API,
 *   as outlined in the `PkmnSmogonPresetResponse` interface.
 * * Won't be used as a final type since we'll convert these into `CalcdexPokemonPreset`s
 *   in the `transformRandomsPresetResponse()` function.
 *   - Also note the slight difference in function's name, as it includes "Randoms".
 *   - Function without "Randoms" is for transforming the response from the Gen Sets API.
 *
 * @since 0.1.0
 */
export interface PkmnSmogonRandomsPresetResponse {
  [speciesForme: string]: PkmnSmogonRandomPreset;
}

/**
 * Downloaded JSON from the pkmn Randoms Stats API.
 *
 * @since 1.0.7
 */
export interface PkmnSmogonRandomsStatsResponse {
  [speciesForme: string]: {
    level: number;
    abilities: { [name: AbilityName]: number; };
    items: { [name: ItemName]: number; };
    moves?: { [name: MoveName]: number; };
    ivs?: Showdown.StatsTable;
    evs?: Showdown.StatsTable;
    roles?: {
      [roleName: string]: {
        weight: number;
        abilities?: { [name: AbilityName]: number; };
        items?: { [name: ItemName]: number; };
        teraTypes: Record<Showdown.TypeName, number>;
        moves: { [name: MoveName]: number; };
      };
    };
  };
}

export const presetApi = pkmnApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (build) => ({
    pokemonFormatPreset: build.query<CalcdexPokemonPreset[], PkmnSmogonPresetRequest>({
      // using the fetchBaseQuery() with runtimeFetch() as the fetchFn doesn't seem to work
      // (Chrome reports a TypeError when calling fetch() in the background service worker)
      // query: ({ gen, format }) => ({
      //   url: [
      //     env('pkmn-presets-formats-path'), // e.g., '/smogon/data/sets'
      //     `gen${format?.includes('bdsp') ? 4 : gen}.json`, // e.g., 'gen8.json'
      //   ].join('/'), // e.g., '/smogon/data/sets/gen8.json'
      //   method: HttpMethod.GET,
      // }),

      // since this is the workaround, we must manually fetch the data and transform the response
      // (not a big deal though... considering the hours I've spent pulling my hair out LOL)
      queryFn: async ({ gen, format, formatOnly }) => {
        const response = await runtimeFetch([
          env('pkmn-presets-base-url'),
          env('pkmn-presets-format-path'), // e.g., '/smogon/data/sets'
          `/${formatOnly ? format.replace(/series\d+/i, '') : `gen${gen}`}.json`, // e.g., '/gen8.json'
        ].join(''), {
          method: HttpMethod.GET,
          headers: {
            Accept: 'application/json',
          },
        });

        const data = response.json();

        return {
          data: formatOnly ? transformFormatPresetResponse(<PkmnSmogonFormatPresetResponse> data, null, {
            gen,
            format,
            formatOnly,
          }) : transformPresetResponse(<PkmnSmogonPresetResponse> data, null, {
            gen,
            format,
            formatOnly,
          }),
        };
      },

      // transformResponse: transformPresetResponse,
      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonFormatStats: build.query<CalcdexPokemonPreset[], Omit<PkmnSmogonPresetRequest, 'formatOnly'>>({
      queryFn: async ({ gen, format }) => {
        const response = await runtimeFetch<PkmnSmogonFormatStatsResponse>([
          env('pkmn-presets-base-url'),
          env('pkmn-presets-format-stats-path'), // e.g., '/smogon/data/stats'
          `/${format.replace(/series\d+/i, '')}.json`, // e.g., '/gen8bdspou.json', 'gen9vgc2023series1' -> 'gen9vgc2023.json'
        ].join(''), {
          method: HttpMethod.GET,
          headers: {
            Accept: 'application/json',
          },
        });

        const data = response.json();

        return {
          data: transformFormatStatsResponse(data, null, {
            gen,
            format,
          }),
        };
      },

      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonRandomsPreset: build.query<CalcdexPokemonPreset[], PkmnSmogonPresetRequest>({
      // (see the comment in the pokemonGensPreset endpoint as to why we're using queryFn here)
      // query: ({ gen, format }) => ({
      //   url: [
      //     env('pkmn-presets-randoms-path'), // e.g., '/randbats/data'
      //     `gen${format?.includes('bdsp') ? '8bdsp' : gen}randombattle.json`, // e.g., 'gen8randombattle.json'
      //   ].join('/'), // e.g., '/randbats/data/gen8randombattle.json'
      //   method: HttpMethod.GET,
      // }),

      queryFn: async ({ gen, format }) => {
        const response = await runtimeFetch<PkmnSmogonRandomsPresetResponse>([
          env('pkmn-presets-base-url'),
          env('pkmn-presets-randoms-path'), // e.g., '/randbats/data'
          `/gen${format?.includes('bdsp') ? '8bdsp' : gen}randombattle.json`, // e.g., '/gen8randombattle.json'
        ].join(''), {
          method: HttpMethod.GET,
          headers: {
            Accept: 'application/json',
          },
        });

        const data = response.json();

        return {
          data: transformRandomsPresetResponse(data, null, {
            gen,
            format,
          }),
        };
      },

      // transformResponse: transformRandomsPresetResponse,
      providesTags: createTagProvider(PokemonReduxTagType.Preset),
    }),

    pokemonRandomsStats: build.query<CalcdexPokemonPreset[], Omit<PkmnSmogonPresetRequest, 'formatOnly'>>({
      queryFn: async ({ gen, format }) => {
        const response = await runtimeFetch<PkmnSmogonRandomsStatsResponse>([
          env('pkmn-presets-base-url'),
          env('pkmn-presets-randoms-stats-path'), // e.g., '/randbats/data/stats'
          `/${format || `gen${gen}randombattle`}.json`, // e.g., '/gen8randombattle.json'
        ].join(''), {
          method: HttpMethod.GET,
          headers: {
            Accept: 'application/json',
          },
        });

        const data = response.json();

        return {
          data: transformRandomsStatsResponse(data, null, {
            gen,
            format,
          }),
        };
      },

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
