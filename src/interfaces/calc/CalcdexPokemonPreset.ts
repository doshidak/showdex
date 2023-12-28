import {
  type AbilityName,
  type GenerationNum,
  type ItemName,
  type MoveName,
} from '@smogon/calc';
import { type CalcdexPokemonAlt } from './CalcdexPokemonAlt';

/**
 * Source of the Calcdex Pokemon set (preset).
 *
 * * `'import'` refers to any preset imported from the user's clipboard.
 * * `'server'` refers to any preset provided by the Showdown server, typically for the logged-in user's Pokemon.
 * * `'sheet'` refers to any preset derived from an open team sheet or the `!showteam` chat command.
 * * `'smogon'` refers to any preset downloaded from a repository of Smogon sets.
 * * `'storage'` refers to any preset derived from locally-stored Teambuilder teams & boxes.
 *   - `'storage'` refers to any preset derived from a Teambuilder team.
 *   - `'storage-box'` refers to any preset derived from a Teambuilder box.
 * * `'usage'` refers to any preset derived from Showdown usage stats.
 * * `'user'` refers to the user's manual modifications represented as a preset.
 *
 * @since 1.0.7
 */
export type CalcdexPokemonPresetSource =
  | 'import'
  | 'server'
  | 'sheet'
  | 'smogon'
  | 'storage'
  | 'storage-box'
  | 'usage'
  | 'user';

/**
 * Single Pokemon spread configuration.
 *
 * * For legacy gens where certain properties like `nature` won't exist, explicitly specify `null`.
 *
 * @since 1.1.8
 */
export interface CalcdexPokemonPresetSpread {
  nature: Showdown.NatureName;
  ivs: Showdown.StatsTable;
  evs: Showdown.StatsTable;
  usage?: number;
}

/**
 * Pokemon set, ~~basically~~ probably.
 *
 * * Types for some properties are more specifically typed,
 *   such as defining `item` as type `ItemName` instead of `string` (from generic `T` in `PokemonSet<T>`).
 *
 * Any mention of the word *preset* here (and anywhere else within the code) is meant to be used interchangably with *set*.
 * * Avoids potential confusion (and hurting yourself in that confusion) by avoiding the JavaScript keyword `set`.
 * * Similar to naming a property *delete*, you can imagine having to destructure `delete` as a variable!
 * * Also, `setSet()` or `setPreset()`? Hmm...
 *
 * @since 0.1.0
 */
export interface CalcdexPokemonPreset {
  /**
   * Unique ID (via `uuid`) generated from a serialized checksum of this preset.
   *
   * * For more information about why this property exists, see the `name` property.
   * * Note that a preset won't have a `calcdexNonce` property since none of the preset's
   *   properties should be mutable (they're pre-*set*, after all!).
   *
   * @since 0.1.0
   */
  calcdexId?: string;

  /**
   * Alias of `calcdexId`, used internally by RTK Query in its internal tagging system.
   *
   * * Wherever the `calcdexId` is set, this property will be set to the same value as well.
   * * Recommended you use `calcdexId` over this property to avoid confusion.
   *
   * @since 0.1.3
   */
  id?: string;

  /**
   * Source of the preset.
   *
   * @example 'server'
   * @since 1.0.7
   */
  source?: CalcdexPokemonPresetSource;

  /**
   * Username of the player that the preset belongs to.
   *
   * * Primarily used to distinguish open team sheets in formats like VGC 2023.
   *   - Presets sourced from team sheets will have a `source` value of `'sheet'`.
   *   - Revealed team sheets include all active players, so this will be useful when filtering for presets
   *     belonging to a specific player.
   * * Note that this has not been formatted by as ID and could possibly include unicode symbols.
   * * Don't always expect this to be populated; most preset builders don't make use of this property.
   *
   * @example 'sumfuk'
   * @since 1.1.3
   */
  playerName?: string;

  /**
   * Name of the preset.
   *
   * * Unfortunately, when accessing the presets via `smogon.sets()` in `@pkmn/smogon` without a `format` argument,
   *   none of the presets have their tier prefixed to the name.
   *   - e.g., "OU Choice Band" (how Smogon does it) vs. "Choice Band" (what `smogon.sets()` returns)
   * * This makes it difficult to differentiate presets between each tier,
   *   especially if you're using the `name` as the value.
   *   - e.g., "OU Choice Band" and "UU Choice Band" will both have the `name` "Choice Band".
   * * For indexing, it's better to use the `calcdexId` property,
   *   which is calculated from the actual preset values themselves.
   *   - For instance, "OU Choice Band" may run a different item/nature/moveset than "UU Choice Band",
   *     resulting in a different `calcdexId`.
   *
   * @example 'Choice Band'
   * @since 0.1.0
   */
  name?: string;

  /**
   * Generation that this preset applies to.
   *
   * @example 8
   * @since 0.1.0
   */
  gen?: GenerationNum;

  /**
   * Format that this preset applies to.
   *
   * * Does not include the gen number!
   *
   * @example 'ou'
   * @since 0.1.0
   */
  format?: string;

  /**
   * Nickname of the Pokemon.
   *
   * @example 'Smogonbirb'
   * @since 1.0.7
   */
  nickname?: string;

  /**
   * Usage percentage of the preset.
   *
   * * Primarily only available in Gen 9 Randoms with role-based sets.
   *   - Side note: `usage` in Randoms would refer to probability of the set.
   * * Value is a percentage represented as a decimal in the interval `[0, 1]`, both inclusive.
   *
   * @since 1.1.0
   */
  usage?: number;

  speciesForme?: string;
  level?: number;
  gender?: Showdown.GenderName;
  hiddenPowerType?: string;
  teraTypes?: CalcdexPokemonAlt<Showdown.TypeName>[];
  shiny?: boolean;
  happiness?: number;
  dynamaxLevel?: number;
  gigantamax?: boolean;
  ability?: AbilityName;
  altAbilities?: CalcdexPokemonAlt<AbilityName>[];
  item?: ItemName;
  altItems?: CalcdexPokemonAlt<ItemName>[];
  moves?: MoveName[];
  altMoves?: CalcdexPokemonAlt<MoveName>[];
  nature?: Showdown.PokemonNature;
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
  spreads?: CalcdexPokemonPresetSpread[];
  pokeball?: string;

  /**
   * Unix epoch timestamp of when this preset was cached, in milliseconds.
   *
   * * Primarily used for determining which presets should be considered stale.
   * * Using a numerical value instead of an ISO 8601 date for use as an IndexedDB index in key range queries.
   *
   * @since 1.2.0
   */
  cached?: number;
}
