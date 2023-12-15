import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { reverseObjectKv } from '@showdex/utils/core';

/* eslint-disable @typescript-eslint/indent */

/**
 * `CalcdexPokemonPreset` keys that are able to be dehydrated.
 *
 * @since 1.1.6
 */
export type HydroPresetsDehydrationKeys = Exclude<keyof CalcdexPokemonPreset,
  | 'id'
  | 'gen'
  | 'ability'
  | 'nature'
  | 'item'
  | 'moves'
  | 'ivs'
  | 'evs'
>;

/* eslint-enable @typescript-eslint/indent */

/**
 * Mapping of `CalcdexPokemonPreset` properties to their `string` opcodes.
 *
 * @since 1.1.6
 */
export const HydroPresetsDehydrationMap: Record<HydroPresetsDehydrationKeys, string> = {
  calcdexId: 'cid',
  source: 'src',
  name: 'nom',
  playerName: 'pln',
  format: 'fmt',
  nickname: 'nkn',
  usage: 'usg',
  speciesForme: 'fme',
  level: 'lvl',
  gender: 'gdr',
  hiddenPowerType: 'hpt',
  teraTypes: 'trt',
  shiny: 'shy',
  happiness: 'hpy',
  dynamaxLevel: 'dml',
  gigantamax: 'gmx',
  altAbilities: 'abl',
  altItems: 'itm',
  altMoves: 'mov',
  // nature: 'ntr',
  // ivs: 'ivs',
  // evs: 'evs',
  spreads: 'spr',
  pokeball: 'pkb',
};

/**
 * Mapping of `CalcdexPokemonPreset` properties that are `CalcdexPokemonAlt<T>[]`'s to their non-alt properties.
 *
 * * Typically used for dehydrating non-`'smogon'` & non-`'usage'` presets.
 *   - Alt properties like `altAbilities[]` are typically only populated if derived from the aforementioned sources.
 *   - Otherwise, we'll only dehydrate the `ability` (unless that's unavailable too LOL -- no biggie tho).
 * * If there is no mapping (i.e., value is falsy like `null`), then no property override will be performed.
 *
 * @since 1.1.6
 */
export const HydroPresetsDehydrationAltMap: Partial<Record<HydroPresetsDehydrationKeys, keyof CalcdexPokemonPreset>> = {
  teraTypes: null,
  altAbilities: 'ability',
  altItems: 'item',
  altMoves: 'moves',
};

/**
 * Reverse mapping of `string` opcodes to their `CalcdexPokemonPreset` properties.
 *
 * @example
 * ```ts
 * HydroPresetsHydrationMap.cid // 'calcdexId'
 * ```
 * @since 1.1.6
 */
export const HydroPresetsHydrationMap = reverseObjectKv(HydroPresetsDehydrationMap);

/**
 * lol
 *
 * @since 1.1.6
 */
export const HydroPresetsDefaultName = 'de_cache';
