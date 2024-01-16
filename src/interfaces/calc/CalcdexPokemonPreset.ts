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
 * * `'smogon'` refers to any preset downloaded from a live repository of Smogon sets.
 * * `'bundle'` refers to any preset from a sets dump bundled with this build & locally accessed at runtime.
 * * `'storage'` refers to any preset derived from locally-stored Teambuilder teams & boxes.
 *   - `'storage'` refers to any preset derived from a Teambuilder team.
 *   - `'storage-box'` refers to any preset derived from a Teambuilder box.
 * * `'usage'` refers to any preset derived from downloaded Showdown usage stats.
 * * `'user'` refers to any preset derived from the user's manual modifications.
 *
 * @since 1.0.7
 */
export type CalcdexPokemonPresetSource =
  | 'import'
  | 'server'
  | 'sheet'
  | 'smogon'
  | 'bundle'
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
  calcdexId: string;

  /**
   * Alias of `calcdexId`, used internally by RTK Query in its internal tagging system.
   *
   * * Wherever the `calcdexId` is set, this property should be set to the same value as well.
   * * Recommended you use `calcdexId` over this property to avoid confusion.
   *
   * @since 0.1.3
   */
  id: string;

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
   * ID of the bundle that this preset is sourced from, if applicable.
   *
   * @since 1.2.1
   */
  bundleId?: string;

  /**
   * Name of the bundle that this preset is sourced from, if applicable.
   *
   * @since 1.2.1
   */
  bundleName?: string;

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
   * Optional index used for sorting presets of the same format.
   *
   * * Typically used for `'smogon'` presets as to preserve the ordering on the Pokemon's Smogon StrategyDex page.
   *
   * @since 1.2.3
   */
  formatIndex?: number;

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

  /**
   * Species forme that this preset applies to.
   *
   * * Generally this isn't hard filtered for & may appear for Pokemon of the same base species, but different forme.
   *   - e.g., if this preset was for a *Charizard-Gmax*, it could appear if the current Pokemon was just *Charizard*.
   *
   * @example 'Talonflame'
   * @since 0.1.0
   */
  speciesForme: string;

  /**
   * Usage percentage of this particular species forme in this specific `format`.
   *
   * * Primarily only available in the pkmn Usage Stats API (for formats like OU) & not Randoms.
   * * Also primarily only visible in standalone Calcdexes, aka. Honkdexes, where the user can manually add Pokemon.
   * * Value is a percentage represented as a decimal in the interval `[0, 1]`, both inclusive.
   *
   * @since 1.2.0
   */
  formeUsage?: number;

  /**
   * Pokemon's level.
   *
   * * Defaults to the `CalcdexBattleState`'s `defaultLevel` if unspecified.
   *
   * @example 50
   * @since 0.1.0
   */
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
   * Unix epoch timestamp of when this preset was last updated, in milliseconds.
   *
   * * Primarily used for displaying the human-readable date in the presets dropdown.
   * * Typically populated for `'usage'`-sourced presets via the `'Last-Modified'` response header.
   *
   * @since 1.2.3
   */
  updated?: number;

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
