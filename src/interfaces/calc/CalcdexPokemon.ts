import { type AbilityName, type ItemName, type MoveName } from '@smogon/calc';
import { type CalcdexAutoBoostMap } from './CalcdexAutoBoostMap';
import { type CalcdexLeanPokemon } from './CalcdexLeanPokemon';
import { type CalcdexMoveOverride } from './CalcdexMoveOverride';
import { type CalcdexPlayerKey } from './CalcdexPlayerKey';
import { type CalcdexPokemonAlt } from './CalcdexPokemonAlt';
import { type CalcdexPokemonPreset, type CalcdexPokemonPresetSource } from './CalcdexPokemonPreset';

/**
 * Where the `CalcdexPokemon` originally came from.
 *
 * @since 1.2.0
 */
export type CalcdexPokemonSource =
  | 'client'
  | 'server'
  | 'user';

export interface CalcdexPokemon extends CalcdexLeanPokemon {
  /**
   * Internal unqiue ID used by the extension.
   *
   * * As part of the new IDing mechanism introduced in v1.0.3, the corresponding `Showdown.Pokemon` &
   *   `Showdown.ServerPokemon` (if applicable) will also have the same `calcdexId` as this one.
   *   - See the notes for `calcdexId` in the `Showdown.Pokemon` interface.
   *
   * @default null
   * @since 0.1.0
   */
  calcdexId?: string;

  /**
   * Where the Pokemon object originates from.
   *
   * * Prior to v1.2.0, this was called `serverSourced`, where `true` maps to `'server'` & `false` to `'client'`.
   *   - In these cases (typical of `'battle'` mode Calcdexes), this value determines how certain values should be
   *     treated, such as whether the `hp` & `maxhp` are potentially percentages.
   * * `'user'`-sourced objects are typical of `'standalone'` mode Calcdexes (aka. Honkdexes introduced in v1.2.0),
   *   signifying that much of the data were supplied by the user.
   *
   * @default null
   * @since 0.1.0
   */
  source?: CalcdexPokemonSource;

  /**
   * Player key (or "side ID", as it's referred to in the client) that the Pokemon belongs to.
   *
   * @example 'p1'
   * @default null
   * @since 1.1.0
   */
  playerKey?: CalcdexPlayerKey;

  /**
   * Whether the Pokemon is actively out on the field.
   *
   * * Populated by `syncBattle()`.
   * * Particularly required for auto-toggling *Stakeout*.
   *
   * @default false
   * @since 1.1.7
   */
  active?: boolean;

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
   * * This should be prioritized over `speciesForme` in `createSmogonPokemon()` so that the calculations are based off
   *   of the transformed Pokemon.
   *
   * @default null
   * @since 0.1.3
   */
  transformedForme?: string;

  /**
   * Current types of the Pokemon.
   *
   * * Could change in certain instances, such as if the Pokemon has the *Protean* ability or the Pokemon transformed
   *   into another Pokemon.
   * * As of v1.2.0 when the Gen 9 DLC 2 mechanics were introduced, the Stellar type, though defined in `TypeName`,
   *   should not be present here or `dirtyTypes[]`.
   *   - Stellar type can only be achieved through Terastallization, hence this type should only be present in
   *     `teraType` & `dirtyTeraType`.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  types?: Showdown.TypeName[];

  /**
   * User-modified types of the Pokemon.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.6
   */
  dirtyTypes?: Showdown.TypeName[];

  /**
   * Terastallizing type that the Terastallizable Pokemon can Terastallizingly Terastallize into during Terastallization.
   *
   * * As of v1.2.0, this is now functionally being used as `revealedTeraType`, which is now deprecated.
   *   - Additionally, since the Gen 9 DLC 2 mechanics were implemented in the aforementioned version, any Pokemon can
   *     have the new Stellar type as their `teraType` & `dirtyTeraType`.
   *   - As mentioned in `types[]`, the Stellar type should not be present in `types[]` & `dirtyTypes[]`.
   * * Similar to all other dirty fields, this should only be populated if reported by the battle.
   *
   * @default null
   * @since 1.1.0
   */
  teraType?: Showdown.TypeName;

  /**
   * User-modified Tera type.
   *
   * @default null
   * @since 1.2.0
   */
  dirtyTeraType?: Showdown.TypeName;

  /**
   * Alternative Tera types from the currently applied `preset`.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.0
   */
  altTeraTypes?: CalcdexPokemonAlt<Showdown.TypeName>[];

  /**
   * Original level of the *Transform*-target Pokemon.
   *
   * * Apparently when the base stats are copied (i.e., `transformedBaseStats`), they're calculated at the level of
   *   the target Pokemon, not the Pokemon doing the *Transform*.
   *   - HP is still calculated at the level of the Pokemon doing the *Transform*, of course.
   *   - Nice.
   *
   * @default null
   * @since 1.1.7
   */
  transformedLevel?: number;

  /**
   * User-modified *Hit Point* (HP) value.
   *
   * * Should be `clamp()`'d between `0` & this Pokemon's `maxhp`.
   *   - If `maxhp` is `100` (so it seems like a %, i.e., 100 "%" `hp` of 100 "%" `maxhp`), then read the value
   *     of this Pokemon's `spreadStats.hp` to get an *estimate* of its actual `maxhp` (which depends on the preset!).
   * * At this point, I feel like this object is just gunna be a clone of all the `Showdown.Pokemon` properties,
   *   but with a `dirty` prepended to it.
   *   - hah
   *   - sounds about right
   *
   * @default null
   * @since 1.1.6
   */
  dirtyHp?: number;

  /**
   * Ability of the Pokemon.
   *
   * @default null
   * @since 0.1.0
   */
  ability?: AbilityName;

  /**
   * Ability of the Pokemon, but it's filthy af.
   *
   * * Stank.
   * * In all seriousness, this holds the user-edited ability, if any.
   *
   * @default null
   * @since 0.1.0
   */
  dirtyAbility?: AbilityName;

  /**
   * Base ability of the Pokemon.
   *
   * @default null
   * @since 0.1.0
   */
  baseAbility?: AbilityName;

  /**
   * Whether some conditional abilities are active, such as *Flash Fire*.
   *
   * * For toggleable abilities natively supported by `@smogon/calc`, such as the aforementioned *Flash Fire*, this will
   *    directly set the `abilityOn` option when constructing a new `SmogonPokemon` in `createSmogonPokemon()`.
   * * There are some "special" abilities like *Protean* & *Beads of Ruin* that require special handling.
   *   - These are known as "pseudo-toggleable" abilities.
   *   - In these instances, Showdex will report the Pokemon's ability as *Pressure*, which is essentially a no-op in
   *     regards to damages, when this value is `true`.
   * * This is initially populated by `detectToggledAbility()`, then synced by the battle via `syncPokemon()` &
   *   `syncBattle()`, or manually toggled by the user if visible in `PokeInfo` by `toggleableAbility()`.
   *
   * @default false
   * @todo rename this to `abilityActive`
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
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  altAbilities?: CalcdexPokemonAlt<AbilityName>[];

  /**
   * Nature of the Pokemon.
   *
   * @default null
   * @since 0.1.0
   */
  nature?: Showdown.PokemonNature;

  /**
   * Item being held by the Pokemon.
   *
   * * Unlike `dirtyItem`, any falsy value (i.e., `''`, `null`, or `undefined`) is considered to be *no item*.
   * * This (and `prevItem`) is redefined with the `ItemName` type to make `@pkmn/*` happy.
   *
   * @default null
   * @since 0.1.0
   */
  item?: ItemName;

  /**
   * Alternative items from the currently applied `preset`.
   *
   * @default
   * ```ts
   * []
   * ```
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
   * @default null
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
   * @default
   * ```ts
   * // gens 1-2 (legacy)
   * { hp: 30, atk: 30, def: 30, spa: 30, spd: 30, spe: 30 }
   *
   * // gens 3+
   * { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }
   * ```
   * @since 0.1.0
   */
  ivs?: Showdown.StatsTable;

  /**
   * EVs (Effort Values) of the Pokemon.
   *
   * * Should not be used if the gen uses legacy stats.
   *
   * @default
   * ```ts
   * // gens 1-2 (legacy)
   * { hp: 252, atk: 252, def: 252, spa: 252, spd: 252, spe: 252 }
   *
   * // gens 3+
   * { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
   * ```
   * @since 0.1.0
   */
  evs?: Showdown.StatsTable;

  /**
   * Whether to show the spreads dropdown in `PokeInfo`.
   *
   * * If `false`, the natures dropdown will be shown.
   * * This should only be set if there are any `CalcdexPokemonPresetSpread[]`'s available.
   * * Fun fact: Property name is extra long to better distinguish this from `showGenetics`.
   *
   * @default false
   * @since 1.1.8
   */
  showPresetSpreads?: boolean;

  /**
   * Whether to show the EV/IV rows in the `PokeStats` table.
   *
   * * If `false`, an edit button should be shown to allow the user to set this value to `true`.
   * * Applies to this specific Pokemon only.
   *
   * @default false
   * @since 1.0.3
   */
  showGenetics?: boolean;

  /**
   * Whether the Pokemon is using Z moves.
   *
   * @default false
   * @since 1.0.1
   */
  useZ?: boolean;

  /**
   * Whether the Pokemon is using D-max/G-max moves.
   *
   * @default false
   * @since 1.0.1
   */
  useMax?: boolean;

  /**
   * Whether the Pokemon has terastallized.
   *
   * * Can be determined from the client by verifying if the Pokemon's `teraType` in the battle state has a value
   *   and there exists a `typechange` in its `volatiles` object.
   *   - Both conditions must be satisfied as the lack of a `typechange` volatile with the presence of a `teraType`
   *     indicates that the terastallized Pokemon is not active.
   * * Note that this is a separate property to independently keep track of the Pokemon's `teraType` value, even when not terastallized.
   *   - (In case if you're thinking that we could achieve the same effect by only setting the `teraType` when terastallized, just like the client.)
   *   - This property would determine whether we specify the `teraType` property to the `calculate()` function of `@smogon/calc`.
   *   - Additionally, this property allows the user to independently toggle the Pokemon's terastallized state to run calcs.
   *
   * @since 1.1.0
   */
  terastallized?: boolean;

  /**
   * Moves currently assigned to the Pokemon.
   *
   * * Typically contains moves set via user input or Smogon sets.
   * * Should not be synced with the current `app.curRoom.battle` state.
   *   - Unless the originating Pokemon object is a `Showdown.ServerPokemon` or a Pokemon that transformed,
   *     in which the exact moveset would be made available to the client.
   *
   * @default
   * ```ts
   * []
   * ```
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
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.3
   */
  serverMoves?: MoveName[];

  /**
   * Transformed moves provided by the corresponding `ServerPokemon`.
   *
   * @default
   * ```ts
   * []
   * ```
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
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  altMoves?: CalcdexPokemonAlt<MoveName>[];

  /**
   * Last move used by the Pokemon.
   *
   * @default null
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
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  moveTrack?: [moveName: MoveName, ppUsed: number][];

  /**
   * Moves revealed by the Pokemon to the opponent/spectators.
   *
   * * Does not include Z and Max moves.
   * * Though derived from `moveTrack`, does not include the `ppUsed`, only the `moveName`.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.0.3
   */
  revealedMoves?: MoveName[];

  /**
   * Mapping of successfully hit moves while Terastallized to the Stellar type.
   *
   * * Introduced in the Gen 9 DLC 2 update, Stellar type Terastallizations use a unique STAB mechanic that only applies
   *   to the first move used of that type.
   *   - Stellar STAB will apply a 2x base power boost for moves matching the Pokemon's *original* types & 1.2x otherwise.
   *   - For instance, the Stellar STAB is applied to *Aqua Jet*, a Water type move, on its first use.
   *   - When *Hydro Pump*, another Water type move, is used, since *Aqua Jet* was the previously used Water type move,
   *     it does **not** get the Stellar STAB (or any Water type move for the remainder of the battle).
   * * Only exception is *Terapagos*, which will *always* get the Stellar STAB for every damaging move, regardless of
   *   what moves were used prior.
   *   - Technically speaking, this is for *Terapagos-Stellar*, which is the forme *Terapagos-Terastal* changes into
   *     when Terastallizing to Stellar.
   *   - (Also for completeness, *Terapagos* will immediately change into *Terapagos-Terastal* once it's active on the
   *     field due to its *Tera Shift* ability.)
   * * This is primarily used to populate the `isStellarFirstUse` property in `createSmogonMove()`.
   *   - Could technically store boolean values instead, but just in case, we'll store the `MoveName`.
   *   - In any case, you only need to check the truthiness of the type's value for the aforementioned property.
   * * Should be populated during battle syncs by reading the `stepQueue[]`.
   *   - Moves that successfully hit will begin with `|move|`, followed by, but not necessarily right after, `|-damage|`.
   *   - Otherwise, moves that failed to hit may have `|-fail|`, `|-miss|`, `|-immune|`, etc., but no `|-damage|` step.
   *
   * @example
   * ```ts
   * {
   *   Ground: 'Earthquake',
   *   Stellar: 'Tera Blast',
   * }
   * ```
   * @default
   * ```ts
   * {}
   * ```
   * @since 1.2.0
   */
  stellarMoveMap?: Partial<Record<Showdown.TypeName, MoveName>>;

  /**
   * Whether to show editing controls for overriding moves.
   *
   * * Applies to this specific Pokemon only.
   *
   * @default false
   * @since 1.0.6
   */
  showMoveOverrides?: boolean;

  /**
   * Overridden move properties by the user for the Pokemon.
   *
   * * Key refers to the move name with its value referring to the overridden properties.
   * * Any overrides here pertain to the current Pokemon only.
   *
   * @default
   * ```ts
   * {}
   * ```
   * @since 1.0.6
   */
  moveOverrides?: Record<MoveName, CalcdexMoveOverride>;

  /**
   * Client-reported boosted stat of the Pokemon.
   *
   * * Typically used for *Protosynthesis* & *Quark Drive* abilities, where the highest
   *   stat after boosts is considered.
   *   - Does not need to be unnecessarily populated if not useful in the context of the battle!
   * * In order to avoid any discrepancies with the server, this will be populated by the client
   *   when it reports the Pokemon's `volatiles` during a sync (in `syncPokemon()`, specifically).
   *   - `volatiles` object will include keys such as `'protosynthesisatk'` & `'quarkdrivespa'`
   *     if reported by the client.
   *   - From the client, this value will be provided to the `Smogon.Pokemon` constructor in
   *     `createSmogonPokemon()` in over to circumvent its default *Auto-Select* behavior.
   *   - This will also override the default value of the `highestBoostedStat` in
   *     `calcPokemonFinalStats()`, if specified.
   *
   * @default null
   * @since 1.1.6
   */
  boostedStat?: Showdown.StatNameNoHp;

  /**
   * User-reported boosted stat of the Pokemon.
   *
   * @default null
   * @since 1.2.0
   */
  dirtyBoostedStat?: Showdown.StatNameNoHp;

  /**
   * Stage boosts of the Pokemon.
   *
   * * Note that the client can report a `spc` boost if in gen 1.
   *   - If that's the case, set `spc` to `spa` and remove the `spc` property.
   *   - For standardization, `boosts` of a `CalcdexPokemon` should not store `spc`.
   *
   * @default
   * ```ts
   * {
   *   hp: 0,
   *   atk: 0,
   *   def: 0,
   *   spa: 0,
   *   spd: 0,
   *   spe: 0,
   * }
   * ```
   * @see `Showdown.Pokemon['boosts']` in `types/pokemon.d.ts`
   * @since 1.0.2
   */
  boosts?: Showdown.StatsTableNoHp;

  /**
   * Keeps track of user-modified boosts as to not modify the actual boosts from the `battle` state.
   *
   * * Values for each stat (except for HP) are stored as boost **stages**, not as boost multipliers.
   *   - In other words, values should range `[-6, 6]`, both inclusive.
   *
   * @default
   * ```ts
   * {
   *   hp: null,
   *   atk: null,
   *   def: null,
   *   spa: null,
   *   spd: null,
   *   spe: null,
   * }
   * ```
   * @since 0.1.0
   */
  dirtyBoosts?: Showdown.StatsTableNoHp;

  /**
   * Currently applied stage boosts applied as a result of an ability's effect.
   *
   * * This includes stage boosts applied to both `boosts` & `dirtyBoosts`, depending on each effect's `turn` value.
   * * If the ability is not present in this mapping, it can be assumed the effect hasn't been applied yet.
   *   - Particularly for gen 9, an ability's effect can still remain, such as for *Intrepid Sword*, though not applied.
   * * Should be populated during battle syncs by reading the `stepQueue[]`.
   *
   * @example
   * ```ts
   * {
   *   Intimidate: {
   *     boosts: { atk: 1 },
   *     sourceKey: 'p2',
   *     sourcePid: 'ae65f089-25f8-4fdd-85dA-64efaa0c097f',
   *     reffect: 'Contrary',
   *     reffectDict: 'abilities',
   *     turn: 1,
   *     once: false,
   *     active: true,
   *   },
   * }
   * ```
   * @default
   * ```ts
   * {}
   * ```
   * @since 1.2.3
   */
  autoBoostMap?: CalcdexAutoBoostMap;

  /**
   * Base stats of the Pokemon based on its species.
   *
   * @default
   * ```ts
   * {
   *   hp: 0,
   *   atk: 0,
   *   def: 0,
   *   spa: 0,
   *   spd: 0,
   *   spe: 0,
   * }
   * ```
   * @since 0.1.0
   */
  baseStats?: Showdown.StatsTable;

  /**
   * Keeps track of user-modified base stats as to not modify the actual base stats.
   *
   * * This is spread over the `overrides.baseStats` in `createSmogonPokemon()`, leaving the original `baseStats` intact.
   *   - "Resetting" the stat to its original value is also made easy by setting its corresponding value here to `null`.
   * * Recalculating the base stats again to find out if `baseStats` has been modified sounded like a lot of work lol.
   *
   * @default
   * ```ts
   * { hp: null, atk: null, def: null, spa: null, spd: null, spe: null }
   * ```
   * @since 1.0.6
   */
  dirtyBaseStats?: Showdown.StatsTable;

  /**
   * Base stats of the `transformedForme`.
   *
   * * Unlike `baseStats`, this doesn't include `hp` since *Transform* does not copy the base HP stat.
   * * Use the truthiness of `transformedForme` (i.e., `!!transformedForme`) to determine whether
   *   you should read from this value.
   *
   * @since 0.1.3
   */
  transformedBaseStats?: Showdown.StatsTableNoHp;

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
   * User-modified non-volatile status condition.
   *
   * * In order to allow the user to *forcibly* specify **no** status (aka. "Healthy") when the Pokemon actually has one,
   *   this takes in the `'ok'` status, which is uniquely handled in `createSmogonPokemon()`.
   * * `null`, typical of other `dirty*` properties, is used to indicate that the user has not modified the status.
   *   - & would be the value when resetting the dirty status back to the original `status`.
   *
   * @default null
   * @since 1.1.6
   */
  dirtyStatus?: Showdown.PokemonStatus | 'ok';

  /**
   * Move last used consecutively.
   *
   * * This is the move that `chainCounter` refers to.
   * * Any move, regardless of it doing damage, can be stored here.
   *   - If the mechanic boosts BP based on consecutive usage, then Status moves would be unaffected, obviously!
   * * Showdown doesn't provide this info, so this information is derived by the Calcdex during battle syncs.
   *
   * @deprecated As of v1.1.3, this is currently unpopulated since the `stepQueue` parser isn't written yet.
   * @default null
   * @since 1.1.3
   */
  chainMove?: MoveName;

  /**
   * Number of times the `chainMove` was used.
   *
   * * Can be used for a variety of mechanics that depend on consecutive move usage.
   * * Counter will only increment **after** the `chainMove` was *successfully* used, so any effects that make
   *   use of consecutively-used moves will be applied on the following turn, as long as the `chainMove` is
   *   successfully used again.
   * * Follows mechanics used by the *Metronome* item (not the ability!):
   *   - Switching out, using another move, and using the move *unsuccessfully* will reset the counter to `0`.
   *   - Multi-strike moves (e.g., *Population Bomb*) will only increment the counter once.
   *   - Moves calling other moves (e.g., *Copycat*, *Metronome*, *Nature Power*) will increment the counter
   *     only if the called move matches `chainMove` (otherwise, will be reset to `0` with the called move).
   *   - Moves with a charging turn (e.g., *Fly*, *Geomancy*, *Phantom Force*) will increment the counter
   *     even on the charging turn as it will be considered to be successfully used.
   * * *Unsuccessful* move usage entails situations where the move failed to hit, such as:
   *   - Defending Pokemon protects (hitting the *Substitute* counts as a *successful* hit, however),
   *   - Defending Pokemon is immune to the move (e.g., *Earthquake* on a Flying type),
   *   - Attacking Pokemon misses the move (e.g., *High Jump Kick* with 90% accuracy),
   *   - Attacking Pokemon's status prevents usage of the move (e.g., Paralysis, Sleep).
   * * Showdown doesn't provide this info, so this information is derived by the Calcdex during battle syncs.
   *
   * @deprecated As of v1.1.3, this is currently unpopulated since the `stepQueue` parser isn't written yet.
   * @default 0
   * @since 1.1.3
   */
  chainCounter?: number;

  /**
   * Number of turns the Pokemon was asleep for.
   *
   * * Kept track by the client under the `statusData.sleepTurns` property in `Showdown.Pokemon`.
   * * As of v1.1.0, this exists since we're not copying `statusData` from the client battle state anymore.
   * * Not sure what this is being used for (if at all) atm.
   *
   * @default 0
   * @since 1.1.0
   */
  sleepCounter?: number;

  /**
   * Number of turns the Pokemon was *badly* poisoned for.
   *
   * * Kept track by the client under the `statusData.toxicTurns` property in `Showdown.Pokemon`.
   * * This property is only used by `calculate()` in `@smogon/calc`.
   * * Value of `0` means the Pokemon is not badly poisoned (and probably not regular poisoned).
   *
   * @default 0
   * @since 0.1.0
   */
  toxicCounter?: number;

  /**
   * Number of times the Pokemon was hit.
   *
   * * Kept track by the client under the `timesAttacked` property in `Showdown.Pokemon`.
   * * Note that this value should persist even if the Pokemon faints, especially since Pokemon can now
   *   be revived with *Revival Blessing*, a move introduced in Gen 9.
   * * Primarily used for calculating the base power of *Rage Fist*, a move introduced in Gen 9.
   *
   * @default 0
   * @since 1.1.0
   */
  hitCounter?: number;

  /**
   * Number of fainted Pokemon on the side that this Pokemon belongs to.
   *
   * * Kept track by the client under the `faintCounter` property in `Showdown.Side`.
   * * ~~Note that all Pokemon on a given side will have the same value for this property.~~
   *   - Redundantly done this way to keep the codebase a bit less messier.
   *   - Otherwise, I'd have to pass the `field` state to a bunch of functions.
   *   - (Although, it's kinda already like that... LOL)
   * * Update (2022/12/13): This value won't be synced once the Pokemon faints.
   *   - For example, when *Kingambit* faints with a prior `faintCounter` of `2`, the value won't be
   *     updated on subsequent faints from other Pokemon (i.e., will remain at `2`).
   *   - When refreshing the page on a completed battle, this value will be set to the reported
   *     `faintCounter` minus `1` (minimum `0`) to account for this Pokemon if it were still alive.
   * * Update (2023/07/25): Apparently this value should only be updated when the Pokemon is **not** active!
   *   - This applies more in Doubles formats, where allies can faint while the Pokemon is active.
   *   - This value shouldn't be updated during that time, only when switched out.
   * * Update (2023/10/07): Apparently the last apparent point wasn't *entirely* true.
   *   - Restriction only applies to *Supreme Overlord* & not other things like *Last Respects*.
   *   - In other words, we should be syncing this value always when not *Supreme Overlord*.
   *
   * @default 0
   * @since 1.1.0
   */
  faintCounter?: number;

  /**
   * Basically `faintCounter`, but user-specified.
   *
   * * Use this like any other dirty property like `dirtyAbility`, `dirtyItem`, etc.
   *   - i.e., Read this value first, then fallback to the non-dirty counterpart (i.e., `faintCounter`).
   * * Pretty much only used for *Supreme Overlord* (but don't assume just *Kingambit* cause Hackmons lmao).
   *
   * @default null
   * @since 1.1.6
   */
  dirtyFaintCounter?: number;

  /**
   * ID of the preset that's currently applied to the Pokemon.
   *
   * * ID refers to the `calcdexId` of the preset.
   * * Same functionality as the `preset` property that existed since day one (v0.1.0).
   *   - Renamed since `preset` doesn't store a `CalcdexPokemonPreset` anymore, but its `calcdexId`.
   *
   * @default null
   * @since 1.1.3
   */
  presetId?: string;

  /**
   * Source of the preset that's currently applied to the Pokemon.
   *
   * * Should be populated alongside any `presetId` popultations.
   * * Primarily used to alter `CalcdexPokemon` mutation behavior, such as whether to clear the `presetId` depending on
   *   the applied `presetSource`.
   * * Needs to be accessed at this level since applied presets can be from outside sources & not necessarily in `presets[]`.
   *
   * @default null
   * @since 1.2.0
   */
  presetSource?: CalcdexPokemonPresetSource;

  /**
   * Available presets (i.e., sets) for the Pokemon.
   *
   * * These are typically presets derived from the battle, not downloaded from an external repository.
   *   - You'll find presets sourced from the `'server'`, `'storage'`/`'storage-box'` (from the Teambuilder),
   *     `'import'` (imported PokePastes), and `'sheets'` (open team sheets or `!showteam`).
   * * As such, this is uniquely populated for each battle, if presets from any of the aforementioned sources
   *   are available.
   *
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
