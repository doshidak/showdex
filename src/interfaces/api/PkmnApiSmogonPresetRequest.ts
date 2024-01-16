import { type GenerationNum } from '@smogon/calc';
import { type Duration } from 'date-fns';
import { type CalcdexPokemonPresetSource } from '@showdex/interfaces/calc';

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
   * `ShowdexPresetsBundle` IDs to load.
   *
   * * These are locally stored JSON files formatted like the output of the pkmn Format Sets API.
   * * In order to recycle the same logic, this random property exists.
   * * Should only be used when loading a `ShowdexPresetsBundle` & not when actually fetching from the pkmn API.
   *
   * @since 1.2.1
   */
  bundleIds?: string[];

  /**
   * Specifies the `source` of the transformed presets.
   *
   * @default 'smogon'
   * @since 1.2.1
   */
  source?: CalcdexPokemonPresetSource;

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
