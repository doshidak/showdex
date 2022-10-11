import { createSlice, current } from '@reduxjs/toolkit';
import { syncBattle, SyncBattleActionType } from '@showdex/redux/actions';
import { sanitizeField } from '@showdex/utils/battle';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { Draft, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';
import type { GenerationNum, State as SmogonState } from '@smogon/calc';
import type { AbilityName, ItemName, MoveName } from '@smogon/calc/dist/data/interface';
import { useSelector } from './hooks';

/* eslint-disable @typescript-eslint/indent */

/**
 * Lean version of the `Showdown.Pokemon` object used by the official client.
 *
 * * Basically `Showdown.Pokemon` without the class functions like `isGrounded()`.
 *
 * @since 0.1.0
 */
export type CalcdexLeanPokemon = Omit<NonFunctionProperties<Partial<Showdown.Pokemon>>,
  | 'ability'
  | 'baseAbility'
  | 'item'
  | 'hpcolor'
  | 'moves'
  | 'moveTrack'
  | 'nature'
  | 'prevItem'
  | 'side'
  | 'sprite'
>;

/* eslint-enable @typescript-eslint/indent */

export interface CalcdexPokemon extends CalcdexLeanPokemon {
  /**
   * Internal unqiue ID used by the extension.
   *
   * * As part of the new IDing mechanism introduced in v1.0.3, the corresponding `Pokemon`
   *   and `ServerPokemon` (if applicable) will also have the same `calcdexId` as this one.
   *   - See the notes for `calcdexId` in the `Showdown.Pokemon` interface.
   *
   * @see `Showdown.Pokemon['calcdexId']`
   * @since 0.1.0
   */
  calcdexId?: string;

  /**
   * Internal checksum of the Pokemon's mutable properties used by the extension.
   *
   * @deprecated As of v0.1.3, although assigned, don't think this is used anymore.
   * @since 0.1.0
   */
  calcdexNonce?: string;

  /**
   * Whether the Pokemon object originates from the client or server.
   *
   * * Used to determine whether the Pokemon's `hp` is a percentage or not.
   *   - If it's a percentage (`false`), then we'll need to calculate it from the `maxhp`,
   *     which may also need to be calculated.
   * * `ServerPokemon` provides the actual values for `hp` and `maxhp`,
   *   while (client) `Pokemon` only provides a value range of `[0, 100]`, both inclusive.
   *   - Using the `ServerPokemon` allows for more accurate calculations,
   *     so if it's available, we'll use it.
   * * This is primarily used in the `createSmogonPokemon()` utility.
   *
   * @default false
   * @since 0.1.0
   */
  serverSourced?: boolean;

  /**
   * Whether the Pokemon can Dynamax.
   *
   * * In addition to the Dynamax clause (and whether the gen supports D-maxing),
   *   this value is also used to conditionally display the "Max" button in `PokeMoves`.
   * * Note that if the Pokemon can also Gigantamax, the G-max formes should be available in
   *   `altFormes` for toggling within `PokeInfo`.
   *   - G-max forme will cause the "Max" button to display any G-max moves.
   * * Damage calculator provides invalid damage calculations when manually specifying a
   *   D-max or G-max move (move must be unmaxed with the Pokemon's `isDynamaxed` set to `true`).
   *
   * @default false
   * @since 1.0.3
   */
  dmaxable?: boolean;

  /**
   * Whether the Pokemon can Gigantamax.
   *
   * * Derived from the `requests` of the current `BattleRoom`.
   *   - This value does not exist in the `battle` object!
   * * If `true`, `PokeMoves` should add the `'-Gmax'` suffix to Pokemon's `speciesForme` if the G-max forme
   *   exists in the Pokemon's `altFormes`.
   *   - Otherwise, `PokeMoves` should not prevent the user from switching to a G-max forme.
   * * This is also used to specify the Gigantamax property in `exportPokePaste()`.
   *
   * @default false
   * @since 1.0.3
   */
  gmaxable?: boolean;

  /**
   * Alternative formes of the Pokemon.
   *
   * * Includes the original `speciesForme` for easier cycling in the `PokeInfo` UI.
   *   - Note that if the `speciesForme` is not a base forme or has no alternative formes, this array will be empty.
   *   - Designed this way so that `PokeInfo` can easily check if it should allow switching formes based on this array's `length`.
   *   - For example, `altFormes` for `'Rotom-Wash'` will be empty, while `'Rotom'` will include all possible formes.
   * * If the Pokemon is transformed, this will include the alternative formes of the transformed Pokemon.
   *   - Additionally, this won't include the original `speciesForme`, but the `speciesForme` of the transformed Pokemon.
   * * `PokeInfo` should allow the user to switch between each forme if this array's `length` is greater than `0`.
   *   - No need to retain the user's dirtied forme in a separate property like `dirtySpeciesForme`.
   *   - Therefore, the switched forme should be stored in `speciesForme`.
   *   - On the next sync, any modifications to `speciesForme` will be replaced with the battle's value in `syncPokemon()`.
   * * Note that in the example below, *Urshifu* only has *Urshifu-Rapid-Strike* as its alternative forme.
   *   - `'Urshifu-Gmax'` is added due to the `canGigantamax` property being `true`.
   *   - Another lookup for `'Urshifu-Rapid-Strike'` must be done to find its `canGigantamax` value, which is also `true`.
   *
   * @example
   * ```ts
   * // gen 7
   * ['Charizard', 'Charizard-Mega-X', 'Charizard-Mega-Y']
   *
   * // gen 8
   * ['Charizard', 'Charizard-Gmax', 'Charizard-Mega-X', 'Charizard-Mega-Y']
   * ['Urshifu', 'Urshifu-Gmax', 'Urshifu-Rapid-Strike', 'Urshifu-Rapid-Strike-Gmax']
   * ```
   * @default
   * ```ts
   * []
   * ```
   * @since 1.0.2
   */
  altFormes?: string[];

  /**
   * Transformed `speciesForme`, if applicable.
   *
   * * Derived from the transformed `Showdown.Pokemon` in the current Pokemon's `volatiles.transform[1]`.
   * * Separately tracked from `speciesForme` as this is primarily used to determine if the Pokemon has transformed.
   * * This should be prioritized over `speciesForme` in `createSmogonPokemon()` so that the calculations are based off of the transformed Pokemon.
   *
   * @since 0.1.3
   */
  transformedForme?: string;

  /**
   * Current types of the Pokemon.
   *
   * * Could change in certain instances, such as if the Pokemon has the *Protean* ability or
   *   the Pokemon transformed into another Pokemon.
   *
   * @since 0.1.0
   */
  types?: Showdown.TypeName[];

  /**
   * Ability of the Pokemon.
   *
   * @since 0.1.0
   */
  ability?: AbilityName;

  /**
   * Ability of the Pokemon, but it's filthy af.
   *
   * * Stank.
   * * In all seriousness, this holds the user-edited ability, if any.
   *
   * @since 0.1.0
   */
  dirtyAbility?: AbilityName;

  /**
   * Base ability of the Pokemon.
   *
   * @since 0.1.0
   */
  baseAbility?: AbilityName;

  /**
   * Whether the current `ability`/`dirtyAbility` is toggleable.
   *
   * * & the dev award for the best variable names goes to...
   * * Used for showing the ability toggle button in `PokeInfo`.
   * * Should be determined by whether the ability is in the list of `PokemonToggleAbilities`.
   *   - Special handling is required for the *Multiscale* ability,
   *     in which this value should be `false` if the Pokemon's HP is not 100%.
   *
   * @see `PokemonToggleAbilities` in `src/consts/abilities.ts`.
   * @default false
   * @since 0.1.3
   */
  abilityToggleable?: boolean;

  /**
   * Some abilities are conditionally toggled, such as *Flash Fire*.
   *
   * * While we don't have to worry about those conditions,
   *   we need to keep track of whether the ability is active.
   * * Allows toggling by the user, but will sync with the battle state as the turn ends.
   * * Internally, this value depends on `abilityToggleable`.
   *   - See `detectToggledAbility()` for implementation details.
   * * If the ability is not in `PokemonToggleAbilities` in `consts`,
   *   this value will always be `true`, despite the default value being `false`.
   *
   * @see `PokemonToggleAbilities` in `src/consts/abilities.ts`.
   * @default false
   * @since 0.1.2
   */
  abilityToggled?: boolean;

  /**
   * Possible abilities of the Pokemon.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  abilities?: AbilityName[];

  /**
   * Possible abilities of the transformed Pokemon.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.0.2
   */
  transformedAbilities?: AbilityName[];

  /**
   * Alternative abilities (i.e., ability pool) from the currently applied `preset`.
   *
   * @since 0.1.0
   */
  altAbilities?: CalcdexPokemonAlt<AbilityName>[];

  /**
   * Nature of the Pokemon.
   *
   * @since 0.1.0
   */
  nature?: Showdown.PokemonNature;

  /**
   * Item being held by the Pokemon.
   *
   * * Unlike `dirtyItem`, any falsy value (i.e., `''`, `null`, or `undefined`) is considered to be *no item*.
   * * This (and `prevItem`) is redefined with the `ItemName` type to make `@pkmn/*` happy.
   *
   * @since 0.1.0
   */
  item?: ItemName;

  /**
   * Alternative items from the currently applied `preset`.
   *
   * @since 0.1.0
   */
  altItems?: CalcdexPokemonAlt<ItemName>[];

  /**
   * Keeps track of the user-modified item as to not modify the actual `item` (or lack thereof) synced from the `battle` state.
   *
   * * Since it's possible for a Pokemon to have no item, an empty string (i.e., `''`) will indicate that the Pokemon intentionally has no item.
   *   - You will need to cast the empty string to type `ItemName` (e.g., `<ItemName> ''`) since it doesn't exist on that type.
   *   - Currently not unioning an empty string with `ItemName` since TypeScript will freak the fucc out.
   * * Any other falsy value (i.e., `null` or `undefined`) will fallback to the Pokemon's `item` (or lack thereof, if it got *Knocked Off*, for instance).
   *   - Under-the-hood, the *Nullish Coalescing Operator* (i.e., `??`) is being used, which falls back to the right-hand value if the left-hand value is `null` or `undefined`.
   *
   * @default null
   * @since 0.1.0
   */
  dirtyItem?: ItemName;

  /**
   * Previous item that was held by the Pokemon.
   *
   * * Typically used to keep track of knocked-off or consumed items.
   *
   * @since 0.1.0
   */
  prevItem?: ItemName;

  /**
   * IVs (Individual Values) of the Pokemon.
   *
   * * Legacy stats (DVs [Determinant Values]) should be stored here.
   *   - Convert the DV into an IV before storing via `convertLegacyDvToIv()`.
   *   - Since SPA/SPD don't exist, store SPC in both SPA and SPD, making sure SPD equals SPA.
   *
   * @since 0.1.0
   */
  ivs?: Showdown.StatsTable;

  /**
   * EVs (Effort Values) of the Pokemon.
   *
   * * Should not be used if the gen uses legacy stats.
   *
   * @since 0.1.0
   */
  evs?: Showdown.StatsTable;

  /**
   * Whether to show the EV/IV rows in the `PokeStats` table.
   *
   * * If `false`, an edit button should be shown to allow the user to set this value to `true`.
   *
   * @default true
   * @since 1.0.3
   */
  showGenetics?: boolean;

  /**
   * Whether the Pokemon is using Z moves.
   *
   * @since 1.0.1
   */
  useZ?: boolean;

  /**
   * Whether the Pokemon is using D-max/G-max moves.
   *
   * @since 1.0.1
   */
  useMax?: boolean;

  /**
   * Moves currently assigned to the Pokemon.
   *
   * * Typically contains moves set via user input or Smogon sets.
   * * Should not be synced with the current `app.curRoom.battle` state.
   *   - Unless the originating Pokemon object is a `Showdown.ServerPokemon` or a Pokemon that transformed,
   *     in which the exact moveset would be made available to the client.
   *
   * @since 0.1.0
   */
  moves?: MoveName[];

  /**
   * Moves provided by the corresponding `ServerPokemon`.
   *
   * * Should only be set on initialization of the `CalcdexPokemon`.
   *   - Make sure the `ServerPokemon` isn't already transformed (as a result of a page refresh, for instance).
   *   - If that's the case, this value should not be set.
   * * Transformed moves revealed in the `ServerPokemon` should be set under `transformedMoves`.
   *
   * @since 0.1.3
   */
  serverMoves?: MoveName[];

  /**
   * Transformed moves provided by the corresponding `ServerPokemon`.
   *
   * @since 0.1.3
   */
  transformedMoves?: MoveName[];

  /**
   * Alternative moves from the currently applied `preset`.
   *
   * * Should be rendered within the moves dropdown, similar to the moves in the properties of `moveState`.
   * * For instance, there may be more than 4 moves from a random preset.
   *   - The first 4 moves are set to `moves`.
   *   - All possible moves from the preset (including the 4 that were set to `moves`) are set to this property.
   *
   * @since 0.1.0
   */
  altMoves?: CalcdexPokemonAlt<MoveName>[];

  /**
   * Last move used by the Pokemon.
   *
   * @since 1.0.3
   */
  lastMove?: MoveName;

  /**
   * Moves and their PP used so far by the Pokemon.
   *
   * * Can exceed the defined max number of moves due to the inclusion of Z and/or Max moves.
   * * In order to derive the move's remaining PP, you must subtract the `ppUsed` from the move's
   *   max PP, obtained via `dex.moves.get()`, under the `pp` property of the returned `Showdown.Move` class.
   *
   * @since 0.1.0
   */
  moveTrack?: [moveName: MoveName, ppUsed: number][];

  /**
   * Moves revealed by the Pokemon to the opponent/spectators.
   *
   * * Does not include Z and Max moves.
   * * Though derived from `moveTrack`, does not include the `ppUsed`, only the `moveName`.
   *
   * @since 1.0.3
   */
  revealedMoves?: MoveName[];

  /**
   * Categorized moves of the Pokemon.
   *
   * @deprecated As of v1.0.3, this is no longer being used.
   *   For `moveState.revealed`, use the `revealedMoves` property.
   *   `moveState.learnset` and `moveState.other` are no longer used in favor of on-demand population
   *   via `getPokemonLearnset()` and `BattleMovedex`, respectively, in `buildMoveOptions()`.
   * @since 0.1.0
   */
  moveState?: CalcdexMoveState;

  /**
   * Stage boosts of the Pokemon.
   *
   * * Note that the client can report a `spc` boost if in gen 1.
   *   - If that's the case, set `spc` to `spa` and remove the `spc` property.
   *   - For standardization, `boosts` of a `CalcdexPokemon` should not store `spc`.
   *
   * @see `Showdown.Pokemon['boosts']` in `types/pokemon.d.ts`
   * @since 1.0.2
   */
  boosts?: Omit<Showdown.StatsTable, 'hp'>;

  /**
   * Keeps track of user-modified boosts as to not modify the actual boosts from the `battle` state.
   *
   * * Values for each stat (except for HP) are stored as boost **stages**, not as boost multipliers.
   *   - In other words, values should range `[-6, 6]`, both inclusive.
   *
   * @default
   * ```ts
   * {}
   * ```
   * @since 0.1.0
   */
  dirtyBoosts?: Omit<Showdown.StatsTable, 'hp'>;

  /**
   * Base stats of the Pokemon based on its species.
   *
   * @default
   * ```ts
   * { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
   * ```
   * @since 0.1.0
   */
  baseStats?: Showdown.StatsTable;

  /**
   * Base stats of the `transformedForme`.
   *
   * * Unlike `baseStats`, this doesn't include `hp` since *Transform* does not copy the base HP stat.
   * * Use the truthiness of `transformedForme` (i.e., `!!transformedForme`) to determine whether
   *   you should read from this value.
   *
   * @since 0.1.3
   */
  transformedBaseStats?: Omit<Showdown.StatsTable, 'hp'>;

  /**
   * Server-reported stats of the Pokemon.
   *
   * * Only provided if the Pokemon belongs to the player.
   *   - Spectators won't receive this information (they only receive client `Showdown.Pokemon` objects).
   * * HP value is derived from the `maxhp` of the `Showdown.ServerPokemon` object.
   * * EVs/IVs/nature are factored in, but not items, abilities, or field conditions.
   *   - Server doesn't report the actual EVs/IVs/nature, so we get to figure them out ourselves!
   *
   * @default
   * ```ts
   * {}
   * ```
   * @since 0.1.3
   */
  serverStats?: Showdown.StatsTable;

  /**
   * Calculated stats of the Pokemon after its EV/IV/nature spread is applied.
   *
   * * This does not factor in items, abilities, or field conditions.
   *   - Final stats are not stored here since it requires additional information
   *     from field conditions and potentially other ally and opponent Pokemon.
   *   - See `calcPokemonFinalStats()` for more information.
   * * As of v0.1.3, value is set in `syncPokemon()` when `serverPokemon` is provided and
   *   in `applyPreset()` of `PokeInfo` when a `preset` is applied.
   *   - Additionally, this has been renamed from `calculatedStats` (pre-v1.0.3) to
   *     `spreadStats` to avoid confusion between this and existing stat properties.
   *   - For instance, `guessServerSpread()` internally uses a local `calculatedStats` object
   *     that's unrelated to this one, adding to the confusion.
   * * Since the user is free to change the EVs/IVs/nature, this value should not be synced with
   *   the provided `stats` in the corresponding `ServerPokemon`, if applicable.
   *   - Server-reported `stats` should be synced with the `serverStats` instead.
   *
   * @default
   * ```ts
   * { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
   * ```
   * @since 0.1.0
   */
  spreadStats?: Showdown.StatsTable;

  /**
   * Whether to calculate move damages as critical hits.
   *
   * @default false
   * @since 0.1.0
   */
  criticalHit?: boolean;

  /**
   * Remaining number of turns the Pokemon is poisoned for.
   *
   * * This property is only used by `calculate()` in `@smogon/calc`.
   * * Value of `0` means the Pokemon is not poisoned.
   *
   * @default 0
   * @since 0.1.0
   */
  toxicCounter?: number;

  /**
   * Preset that's currently being applied to the Pokemon.
   *
   * * Could use the preset's `name`, but you may run into some issues with uniqueness.
   *   - See the `name` property in `CalcdexPokemonPreset` for more information.
   * * Recommended you use the preset's `calcdexId` as this property's value instead.
   *
   * @todo Rename this to `presetId` to avoid confusion about this property's type.
   * @since 0.1.0
   */
  preset?: string;

  /**
   * Available presets (i.e., sets) for the Pokemon.
   *
   * @todo change this to `string[]` (of calcdexId's) for better memory management
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  presets?: CalcdexPokemonPreset[];

  /**
   * Whether the preset should automatically update based on revealed moves (i.e., `moveState.revealed`).
   *
   * @default true
   * @since 0.1.0
   */
  autoPreset?: boolean;
}

/**
 * @deprecated As of v1.0.3, this is no longer being used.
 *   See deprecation information in `CalcdexPokemon['moveState']`.
 */
export interface CalcdexMoveState {
  /**
   * Should only consist of moves that were revealed during the battle.
   *
   * * These moves should have the highest render priority
   *   (i.e., should be at the top of the list).
   * * This is usually accessible within the client `Showdown.Pokemon` object,
   *   under the `moveTrack` property.
   *
   * @default
   * ```ts
   * []
   * ```
   * @deprecated As of v1.0.3, this is no longer being used.
   *   Use `CalcdexPokemon['revealedMoves']` instead.
   * @since 0.1.0
   */
  revealed: (MoveName | string)[];

  /**
   * Should only consist of moves that the Pokemon can legally learn.
   *
   * * These moves should be rendered after those in `revealed`.
   * * Moves that exist in `revealed` should be filtered out.
   *
   * @default
   * ```ts
   * []
   * ```
   * @deprecated As of v1.0.3, this is no longer being used.
   *   Populated on-demand via `getPokemonLearnset()` in `buildMoveOptions()`.
   * @since 0.1.0
   */
  learnset: (MoveName | string)[];

  /**
   * Optional moves, including potentially illegal ones for formats like `gen8anythinggoes` (I think lmao).
   *
   * * These moves, if specified, should be rendered last.
   * * Moves that exist in `revealed` and `learnsets` should be filtered out.
   *
   * @default
   * ```ts
   * []
   * ```
   * @deprecated As of v1.0.1, this is no longer being used.
   *   Populated on-demand via `BattleMovedex` in `buildMoveOptions()`.
   * @since 0.1.0
   */
  other?: (MoveName | string)[];
}

/**
 * Utility type for alternative abilities/items/moves, including those with usage percentages, if any.
 *
 * * You can specify `AbilityName`, `ItemName`, or `MoveName` for `T`.
 *   - Import these types from `@smogon/calc/dist/data/interface`.
 * * Pro-tip: Use `detectUsageAlt()` to distinguish between `T`s and `CalcdexPokemonUsageAlt<T>`s.
 *
 * @example
 * ```ts
 * type AltMove = CalcdexPokemonAlt<MoveName>;
 * // -> MoveName | [name: MoveName, percent: number];
 * ```
 * @since 1.0.3
 */
export type CalcdexPokemonAlt<
  T extends string,
> = T | CalcdexPokemonUsageAlt<T>;

/**
 * Utility type for alternative abilities/items/moves with usage percentages.
 *
 * * You can specify `AbilityName`, `ItemName`, or `MoveName` for `T`.
 *   - Import these types from `@smogon/calc/dist/data/interface`.
 *
 * @example
 * ```ts
 * type UsageAltMove = CalcdexPokemonUsageAlt<MoveName>;
 * // -> [name: MoveName, percent: number];
 * ```
 * @since 1.0.3
 */
export type CalcdexPokemonUsageAlt<
  T extends string,
> = [
  name: T,
  percent: number,
];

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

  gen?: GenerationNum;
  format?: string;
  speciesForme?: string;
  level?: number;
  gender?: Showdown.GenderName;
  shiny?: boolean;
  ability?: AbilityName;
  altAbilities?: CalcdexPokemonAlt<AbilityName>[];
  item?: ItemName;
  altItems?: CalcdexPokemonAlt<ItemName>[];
  moves?: MoveName[];
  altMoves?: CalcdexPokemonAlt<MoveName>[];
  nature?: Showdown.PokemonNature;
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
  happiness?: number;
  pokeball?: string;
  hpType?: string;
  gigantamax?: boolean;
}

/* eslint-disable @typescript-eslint/indent */

/**
 * Lean version of the `Showdown.Side` object used by the official client.
 *
 * * Basically `Showdown.Side` without the class functions like `addSideCondition()`.
 *
 * @since 0.1.0
 */
export type CalcdexLeanSide = Partial<Omit<NonFunctionProperties<Showdown.Side>,
  | 'active'
  | 'ally'
  | 'battle'
  | 'foe'
  | 'lastPokemon'
  | 'missedPokemon'
  | 'pokemon'
  | 'wisher'
  | 'x'
  | 'y'
  | 'z'
>>;

/* eslint-enable @typescript-eslint/indent */

export interface CalcdexPlayer extends CalcdexLeanSide {
  /**
   * Nonce of the player, but not sure if this is actually being used anymore.
   *
   * @deprecated As of v0.1.3, probably not being used anymore.
   * @since 0.1.0
   */
  calcdexNonce?: string;

  /**
   * Index of the `CalcdexPokemon` that is currently active on the field.
   *
   * @default -1
   * @since 0.1.0
   */
  activeIndex?: number;

  /**
   * Index of the `CalcdexPokemon` that the user is currently viewing.
   *
   * @default 0
   * @since 0.1.0
   */
  selectionIndex?: number;

  /**
   * Whether `selectionIndex` should automatically update whenever `activeIndex` updates.
   *
   * @default true
   * @since 0.1.2
   */
  autoSelect?: boolean;

  /**
   * Keeps track of the ordering of the Pokemon.
   *
   * * Each element should be some unique identifier for the Pokemon that's hopefully somewhat consistent.
   *   - Wouldn't recommend using `searchid` as it includes the `speciesForme`, subject to change.
   *   - For instance, `searchid` may read `'p1: Zygarde|Zygarde'`, but later read `'p1: Zygarde|Zygarde-Complete'`.
   *   - `ident` seems to be the most viable property here.
   * * Typically should only be used for ordering `myPokemon` on initialization.
   *   - Array ordering of `myPokemon` switches to place the last-switched in Pokemon first.
   *   - Since `calcdexId` internally uses the `slot` value, this re-ordering mechanic produces inconsistent IDs.
   *   - In randoms, assuming `myPokemon` belongs to `'p1'`, `p1.pokemon` will be empty until Pokemon are revealed,
   *     while `myPokemon` remains populated, but with shifting indices.
   * * Not necessary to use this for opponent and spectating players,
   *   since the ordering of `p1.pokemon` and `p2.pokemon` remains consistent.
   *   - Even in randoms, the server sends the client each Pokemon as they're revealed,
   *     and maintains that order in the battle state (again, under `p1.pokemon` and `p2.pokemon`).
   *
   * @since 0.1.3
   */
  pokemonOrder?: string[];

  /**
   * Player's current Pokemon, all converted into our custom `CalcdexPokemon` objects.
   *
   * * Does not need to be populated with the maximum number of Pokemon,
   *   but should not exceed that amount.
   *   - Maximum can be configured via the `CALCDEX_PLAYER_MAX_POKEMON` environment variable.
   *
   * @since 0.1.0
   */
  pokemon?: CalcdexPokemon[];
}

/**
 * Think someone at `@smogon/calc` forgot to include these additional field conditions
 * in the `State.Field` (but it exists in the `Field` class... huh).
 *
 * * For whatever reason, `isGravity` exists on both `State.Field` and `Field`.
 * * Checking the source code for the `Field` class (see link below),
 *   the constructor accepts these missing properties.
 *
 * @see https://github.com/smogon/damage-calc/blob/master/calc/src/field.ts#L21-L26
 * @since 0.1.3
 */
export interface CalcdexBattleField extends SmogonState.Field {
  isMagicRoom?: boolean;
  isWonderRoom?: boolean;
  isAuraBreak?: boolean;
  isFairyAura?: boolean;
  isDarkAura?: boolean;
  attackerSide: CalcdexPlayerSide;
  defenderSide: CalcdexPlayerSide;
}

/**
 * As is the case with `CalcdexBattleField`, this adds the missing properties that exist
 * in `Side`, but not `State.Side`.
 *
 * * Additional properties that will be unused by the `Side` constructor are included
 *   as they may be used in Pokemon stat calculations.
 *
 * @see https://github.com/smogon/damage-calc/blob/master/calc/src/field.ts#L84-L102
 * @since 0.1.3
 */
export interface CalcdexPlayerSide extends SmogonState.Side {
  isProtected?: boolean;
  isSeeded?: boolean;
  isFriendGuard?: boolean;
  isBattery?: boolean;
  isPowerSpot?: boolean;

  /**
   * Not used by the calc, but recorded for Pokemon stat calculations.
   *
   * @since 0.1.3
   */
  isFirePledge?: boolean;

  /**
   * Not used by the calc, but recorded for Pokemon stat calculations.
   *
   * @since 0.1.3
   */
  isGrassPledge?: boolean;

  /**
   * Not used by the calc, but recorded for Pokemon stat calculations.
   *
   * @since 0.1.3
   */
  isWaterPledge?: boolean;
}

/**
 * Battle rules (clauses).
 *
 * * Derived from the `stepQueue` in the Showdown `battle` state.
 * * Counter-intuitively, if the value for a given rule is `true`, typically indicates some mechanic is disabled.
 * * Most of these are probably unused, but they're set just in case I decide to use them later.
 *
 * @todo Update this to extract the applied battle rules from the `battle.rules` object (instead of `battle.stepQueue`).
 * @since 0.1.3
 */
export interface CalcdexBattleRules {
  /**
   * Whether only one *Baton Pass*-er is allowed.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|One Boost Passer Clause: Limit one Baton Passer that has a way to boost its stats'`
   *
   * @since 1.0.1
   */
  boostPasser?: boolean;

  /**
   * Whether dynamaxing is banned.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Dynamax Clause: You cannot dynamax'`
   * * Obviously only applies if the current gen is 8.
   *
   * @since 0.1.3
   */
  dynamax?: boolean;

  /**
   * Whether evasion items are banned.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Evasion Items Clause: Evasion items are banned'`
   *
   * @since 0.1.3
   */
  evasionItems?: boolean;

  /**
   * Whether evasion moves are banned.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Evasion Moves Clause: Evasion moves are banned'`
   *
   * @since 0.1.3
   */
  evasionMoves?: boolean;

  /**
   * Whether forcing endless battles are banned.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Endless Battle Clause: Forcing endless battles is banned'`
   *
   * @since 0.1.3
   */
  endlessBattle?: boolean;

  /**
   * Whether only one foe can be frozen.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Freeze Clause Mod: Limit one foe frozen'`
   *
   * @since 1.0.1
   */
  freeze?: boolean;

  /**
   * Whether HP is shown in percentages.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|HP Percentage Mod: HP is shown in percentages'`
   * * Only applies to the opponent's Pokemon as we can read the actual HP values
   *   from the player's Pokemon via the corresponding `Showdown.ServerPokemon` objects.
   *
   * @since 0.1.3
   */
  hpPercentage?: boolean;

  /**
   * Whether Rayquaza cannot be mega-evolved.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Mega Rayquaza Clause: You cannot mega evolve Rayquaza'`
   * * Obviously only applies if the current gen is 6 or 7, or we're in some weird format like Gen 8 National Dex.
   *
   * @since 0.1.3
   */
  megaRayquaza?: boolean;

  /**
   * Whether OHKO (one-hit-KO) moves are banned.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|OHKO Clause: OHKO moves are banned'`
   *
   * @since 0.1.3
   */
  ohko?: boolean;

  /**
   * Whether Pokemon must share the same type.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Same Type Clause: Pokémon in a team must share a type'`
   * * Typically only present in *monotype* formats.
   *
   * @since 1.0.1
   */
  sameType?: boolean;

  /**
   * Whether only one foe can be put to sleep.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Sleep Clause Mod: Limit one foe put to sleep'`
   *
   * @since 0.1.3
   */
  sleep?: boolean;

  /**
   * Whether players are limited to one of each Pokemon.
   *
   * * Derived from the existence of the following rule in the `stepQueue`:
   *   - `'|rule|Species Clause: Limit one of each Pokémon'`
   *
   * @since 0.1.3
   */
  species?: boolean;
}

/**
 * Key of a given player.
 *
 * @warning Note that there isn't any support for `'p3'` and `'p4'` players at the moment.
 * @since 0.1.0
 */
export type CalcdexPlayerKey =
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4';

export type CalcdexPlayerState = Partial<Record<CalcdexPlayerKey, CalcdexPlayer>>;

/**
 * Rendering mode of the Calcdex.
 *
 * @since 1.0.3
 */
export type CalcdexRenderMode =
  | 'panel'
  | 'overlay';

/**
 * Primary state for a given single instance of the Calcdex.
 *
 * @since 0.1.0
 */
export interface CalcdexBattleState extends CalcdexPlayerState {
  /**
   * Battle ID.
   *
   * * Derived from `id` of the Showdown `battle` state.
   *
   * @example 'battle-gen8ubers-1636924535-utpp6tn0eya3q8q05kakyw3k4s97im9pw'
   * @since 0.1.0
   */
  battleId: string;

  /**
   * Last synced `nonce` of the Showdown `battle` state.
   *
   * @since 0.1.3
   */
  battleNonce?: string;

  /**
   * Generation number.
   *
   * * Derived from `gen` of the Showdown `battle` state.
   *
   * @since 0.1.0
   */
  gen: GenerationNum;

  /**
   * Battle format.
   *
   * * Derived from splitting the `id` of the Showdown `battle` state.
   * * Note that this includes the `'gen#'` portion of the format.
   *
   * @example 'gen8ubers'
   * @since 0.1.0
   */
  format: string;

  /**
   * Rules (clauses) applied to the battle.
   *
   * @since 0.1.3
   */
  rules?: CalcdexBattleRules;

  /**
   * Whether the battle is currently active (i.e., not ended).
   *
   * @since 1.0.3
   */
  active?: boolean;

  /**
   * Render mode of the Calcdex, determined from the settings during initialization.
   *
   * @since 1.0.3
   */
  renderMode?: CalcdexRenderMode;

  /**
   * Side key/ID of the player.
   *
   * * Does not necessarily mean the logged-in user ("auth") is a player.
   * * Check `authPlayerKey` instead to see if the logged-in user is also a player.
   *
   * @default null
   * @since 1.0.2
   */
  playerKey: CalcdexPlayerKey;

  /**
   * Side key/ID of the logged-in user who also happens to be a player.
   *
   * * Will be `null` if the logged-in user ("auth") is not a player.
   * * Primarily useful for changing parts of the UI if the auth user is a player.
   *   - For instance, in `FieldCalc`, the arrows in the screens header will change to "Yours" and "Theirs",
   *     depending on this value.
   *
   * @default null
   * @since 1.0.2
   */
  authPlayerKey?: CalcdexPlayerKey;

  /**
   * Side key/ID of the opponent.
   *
   * * Typically the opposite of the `playerKey`.
   *   - For example, if the `playerKey` is `'p1'`, then you can expect this value to be `'p2'`.
   * * Note that the opposite wouldn't be the case if you were to support more than just 2 players.
   *   - Technically, the client does support up to 4 players (there exists a `'p3'` and `'p4'`).
   *
   * @default null
   * @since 1.0.2
   */
  opponentKey: CalcdexPlayerKey;

  /**
   * Tracked field conditions.
   *
   * @since 0.1.0
   */
  field: CalcdexBattleField;
}

/**
 * Redux action payload for updating a single `CalcdexBattleState` based on the required `battleId`.
 *
 * * Specifying a string literal for `TRequired` will also make those properties required, in addition to `battleId`.
 *   - For example, `CalcdexSliceStateAction<'field'>` will make `field` required.
 *
 * @since 0.1.3
 */
export type CalcdexSliceStateAction<
  TRequired extends keyof CalcdexBattleState = null,
> = PayloadAction<Modify<DeepPartial<CalcdexBattleState>, {
  // idk why CalcdexBattleField isn't partialed from DeepPartial<CalcdexBattleState>
  [P in TRequired]: P extends 'field' ? DeepPartial<CalcdexBattleField> : DeepPartial<CalcdexBattleState>[P];
}>>;

export interface CalcdexSlicePokemonAction {
  battleId: string;
  playerKey: CalcdexPlayerKey;
  pokemon: DeepPartial<CalcdexPokemon>;
}

/**
 * Key should be the `battleId`, but doesn't have to be.
 *
 * * For instance, you may have a constant key for initializing a Calcdex to be used in the teambuilder.
 *
 * @since 0.1.3
 */
export type CalcdexSliceState = Record<string, CalcdexBattleState>;

/**
 * Reducer function definitions.
 *
 * @since 1.0.2
 */
export interface CalcdexSliceReducers extends SliceCaseReducers<CalcdexSliceState> {
  /**
   * Initializes an empty Calcdex state.
   *
   * @since 0.1.3
   */
  init: (state: Draft<CalcdexSliceState>, action: CalcdexSliceStateAction) => void;

  /**
   * Updates an existing `CalcdexBattleState`.
   *
   * @since 0.1.3
   */
  update: (state: Draft<CalcdexSliceState>, action: CalcdexSliceStateAction) => void;

  /**
   * Updates the `field` of a matching `CalcdexBattleState` from the provided `battleId`.
   *
   * @since 0.1.3
   */
  updateField: (state: Draft<CalcdexSliceState>, action: CalcdexSliceStateAction<'field'>) => void;

  /**
   * Updates a `CalcdexPlayer` of a matching `CalcdexBattleState` from the provided `battleId`.
   *
   * * You can technically update both players in a single `dispatch()` by providing `p1` and `p2`.
   *
   * @since 0.1.3
   */
  updatePlayer: (state: Draft<CalcdexSliceState>, action: CalcdexSliceStateAction) => void;

  /**
   * Updates a `CalcdexPokemon` of an existing `CalcdexPlayer` of a matching `CalcdexBattleState`
   * from the provided `battleId`.
   *
   * @since 0.1.3
   */
  updatePokemon: (state: Draft<CalcdexSliceState>, action: PayloadAction<CalcdexSlicePokemonAction>) => void;

  /**
   * Destroys the entire `CalcdexBattleState` by the passed-in `battleId` represented as `action.payload`.
   *
   * @since 1.0.3
   */
  destroy: (state: Draft<CalcdexSliceState>, action: PayloadAction<string>) => void;
}

const l = logger('@showdex/redux/store/calcdexSlice');

export const calcdexSlice = createSlice<CalcdexSliceState, CalcdexSliceReducers, string>({
  name: 'calcdex',

  initialState: {},

  reducers: {
    init: (state, action) => {
      l.debug(
        'RECV', action.type, 'for', action.payload?.battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      const {
        battleId,
        gen = env.int<GenerationNum>('calcdex-default-gen'),
        format = null,
        rules = {},
        renderMode,
        playerKey = null,
        authPlayerKey = null,
        opponentKey = null,
        p1,
        p2,
        field,
        ...payload
      } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (battleId in state) {
        if (__DEV__) {
          l.warn(
            'CalcdexBattleState for battleId', battleId, 'already exists.',
            'This dispatch will be ignored (no-op).',
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      state[battleId] = {
        ...payload,

        battleId,
        battleNonce: null, // make sure we don't set this for the syncBattle() action

        gen,
        format,
        rules,

        renderMode,

        playerKey,
        authPlayerKey,
        opponentKey,

        p1: {
          sideid: 'p1',
          name: null,
          rating: null,
          activeIndex: -1,
          selectionIndex: 0,
          autoSelect: true,
          pokemonOrder: [],
          ...p1,
          pokemon: [],
        },

        p2: {
          sideid: 'p2',
          name: null,
          rating: null,
          activeIndex: -1,
          selectionIndex: 0,
          autoSelect: true,
          pokemonOrder: [],
          ...p2,
          pokemon: [],
        },

        // currently unsupported
        p3: null,
        p4: null,

        field: field || sanitizeField(),
      };

      l.debug(
        'DONE', action.type, 'for', battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    update: (state, action) => {
      l.debug(
        'RECV', action.type, 'for', action.payload?.battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      const {
        battleId,
        battleNonce,
        gen,
        format,
        active,
      } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (!(battleId in state)) {
        l.error('Could not find a CalcdexBattleState with battleId', battleId);

        return;
      }

      // note: this is a pointer/reference to the object in `state`
      const currentState = state[battleId];

      // note: `state` is actually a Proxy object via the WritableDraft from Immutable,
      // a dependency of RTK. spreading will only show the values of the current object depth;
      // all inner depths will remain as Proxy objects! (you cannot read the value of a Proxy.)
      state[battleId] = {
        ...currentState,

        battleId: battleId || currentState.battleId,
        battleNonce: battleNonce || currentState.battleNonce,
        gen: typeof gen === 'number' && gen > 0 ? gen : currentState.gen,
        format: format || currentState.format,
        active: typeof active === 'boolean' ? active : currentState.active,
      };

      l.debug(
        'DONE', action.type, 'for', battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    updateField: (state, action) => {
      l.debug(
        'RECV', action.type, 'for', action.payload?.battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      const {
        battleId,
        field,
      } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (!(battleId in state)) {
        l.error('Could not find a CalcdexBattleState with battleId', battleId);

        return;
      }

      // using battleField here as both a pointer and popular reference
      const battleField = state[battleId].field;

      // only spreading this hard cause of what I chose to send as the payload,
      // which is a DeepPartial<CalcdexBattleField>, so even the objects inside are partials!
      // ... need to get some of that expand() util tbh lmao
      state[battleId].field = {
        ...battleField,
        ...field,

        attackerSide: {
          ...battleField.attackerSide,
          ...field?.attackerSide,
        },

        defenderSide: {
          ...battleField.defenderSide,
          ...field?.defenderSide,
        },
      };

      l.debug(
        'DONE', action.type, 'for', battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    updatePlayer: (state, action) => {
      l.debug(
        'RECV', action.type, 'for', action.payload?.battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      const {
        battleId,
        p1,
        p2,
      } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (!(battleId in state)) {
        l.error('Could not find a CalcdexBattleState with battleId', battleId);

        return;
      }

      if (!Object.keys(p1 || {}).length && !Object.keys(p2 || {}).length) {
        l.error('Found no player to update!');
      }

      if (p1) {
        state[battleId].p1 = {
          ...state[battleId].p1,
          ...p1,
        };
      }

      if (p2) {
        state[battleId].p2 = {
          ...state[battleId].p2,
          ...p2,
        };
      }

      l.debug(
        'DONE', action.type, 'for', battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    updatePokemon: (state, action) => {
      l.debug(
        'RECV', action.type, 'for', action.payload?.battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      const {
        battleId,
        playerKey,
        pokemon,
      } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (!(battleId in state)) {
        l.error('Could not find a CalcdexBattleState with battleId', battleId);

        return;
      }

      const battleState = state[battleId];

      if (!(playerKey in battleState)) {
        l.error(
          'Could not find player', playerKey, 'in battleId', battleId,
          '\n', 'pokemon', pokemon,
          '\n', 'battleState', __DEV__ && current(state)[battleId],
        );

        return;
      }

      const playerState = battleState[playerKey];

      const pokemonId = pokemon?.calcdexId || calcPokemonCalcdexId(pokemon);
      const pokemonStateIndex = playerState.pokemon.findIndex((p) => p.calcdexId === pokemonId);
      const pokemonState = pokemonStateIndex > -1 ? playerState.pokemon[pokemonStateIndex] : null;

      if (!pokemonState) {
        if (__DEV__) {
          const currentState = __DEV__ ? current(state) : null;

          l.warn(
            'Could not find Pokemon', pokemonId, 'of player', playerKey, 'in battleId', battleId,
            '\n', 'pokemon', pokemon,
            '\n', 'playerState', __DEV__ && currentState?.[battleId]?.[playerKey],
            '\n', 'battleState', __DEV__ && currentState?.[battleId],
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      playerState.pokemon[pokemonStateIndex] = {
        ...pokemonState,
        ...pokemon,
      };

      l.debug(
        'DONE', action.type, 'for', battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    destroy: (state, action) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      if (!action.payload || !(action.payload in state)) {
        if (__DEV__) {
          l.warn(
            'Attempted to destroy a Calcdex that does not exist in state.',
            '\n', 'battleId', action.payload,
            '\n', 'state', __DEV__ && current(state),
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      delete state[action.payload];

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },
  },

  extraReducers: (build) => void build
    .addCase(syncBattle.fulfilled, (state, action) => {
      const { battleId } = action.payload;

      if (battleId) {
        state[battleId] = action.payload;
      }

      l.debug(
        'DONE', SyncBattleActionType, 'for', battleId || '(missing battleId)',
        '\n', 'action.payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    }),
});

export const useCalcdexState = () => useSelector(
  (state) => state?.calcdex,
);

export const useCalcdexBattleState = (battleId: string) => useSelector(
  (state) => state?.calcdex?.[battleId],
);
