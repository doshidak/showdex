import { createSlice } from '@reduxjs/toolkit';
import { syncBattle } from '@showdex/redux/actions';
import { sanitizeField } from '@showdex/utils/battle';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import type { PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';
import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
} from '@pkmn/data';
import type { State as SmogonState } from '@smogon/calc';
import { useSelector } from './hooks';

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
   * @since 0.1.0
   */
  other: (MoveName | string)[];
}

/* eslint-disable @typescript-eslint/indent */

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
   * * For more information about why this property exists,
   *   see the `name` property.
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
  altAbilities?: AbilityName[];
  item?: ItemName;
  altItems?: ItemName[];
  moves?: MoveName[];
  altMoves?: MoveName[];
  nature?: Showdown.PokemonNature;
  ivs?: Showdown.StatsTable;
  evs?: Showdown.StatsTable;
  happiness?: number;
  pokeball?: string;
  hpType?: string;
  gigantamax?: boolean;
}

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
   * * If the type if `Showdown.Pokemon`, then the Pokemon is *probably* from the client.
   * * If the type is `Showdown.ServerPokemon`, then the Pokemon is from the server (duh).
   * * ~~Used to determine which fields to overwrite when syncing.~~
   *   - (See deprecation notice below.)
   *
   * @default false
   * @deprecated As of v0.1.3, although assigned, don't think this is used anymore.
   * @since 0.1.0
   */
  serverSourced?: boolean;

  /**
   * Unsanitized version of `speciesForme`, primarily used for determining Z/Max/G-Max moves.
   *
   * @since 0.1.2
   */
  rawSpeciesForme?: string;

  /**
   * Current types of the Pokemon.
   *
   * * Could change depending on the Pokemon's ability, like *Protean*.
   * * Should be set via `tooltips.getPokemonTypes()`.
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
   * Some abilities are conditionally toggled, such as *Flash Fire*.
   *
   * * While we don't have to worry about those conditions,
   *   we need to keep track of whether the ability is active.
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
   * Alternative abilities from the currently applied `preset`.
   *
   * @since 0.1.0
   */
  altAbilities?: AbilityName[];

  /**
   * Nature of the Pokemon.
   *
   * @since 0.1.0
   */
  nature?: Showdown.PokemonNature;

  /**
   * Possible natures of the Pokemon.
   *
   * @deprecated Use `PokemonNatures` from `@showdex/consts` instead.
   * @default
   * ```ts
   * []
   * ```
   * @since 0.1.0
   */
  natures?: Showdown.PokemonNature[];

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
  altItems?: ItemName[];

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
   * Individual Values (IVs) of the Pokemon.
   *
   * @since 0.1.0
   */
  ivs?: Showdown.PokemonSet['ivs'];

  /**
   * Effort Values (EVs) of the Pokemon.
   *
   * @since 0.1.0
   */
  evs?: Showdown.PokemonSet['evs'];

  /**
   * Moves currently assigned to the Pokemon.
   *
   * * Typically contains moves set via user input or Smogon sets.
   * * Should not be synced with the current `app.curRoom.battle` state.
   *   - Unless the originating Pokemon object is a `Showdown.ServerPokemon`.
   *   - In that instance, `serverSourced` should be `true`.
   *
   * @since 0.1.0
   */
  moves?: MoveName[];

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
  altMoves?: MoveName[];

  /**
   * Whether the Pokemon is using Z/Max/G-Max moves.
   *
   * * Using the term *ultimate* (thanks Blizzard/Riot lmaoo) to cover the nomenclature for both Z (gen 7) and Max/G-Max (gen 8) moves.
   *
   * @since 0.1.2
   */
  useUltimateMoves?: boolean;

  /**
   * Moves revealed by the Pokemon to the opponent.
   *
   * @since 0.1.0
   */
  moveTrack?: [moveName: MoveName, ppUsed: number][];

  /**
   * Categorized moves of the Pokemon.
   *
   * @since 0.1.0
   */
  moveState?: CalcdexMoveState;

  /**
   * Keeps track of user-modified boosts as to not modify the actual boosts from the `battle` state.
   *
   * @default
   * ```ts
   * {}
   * ```
   * @since 0.1.0
   */
  dirtyBoosts?: Partial<Record<Showdown.StatNameNoHp, number>>;

  /**
   * Base stats of the Pokemon based on its species.
   *
   * @default
   * ```ts
   * { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
   * ```
   * @since 0.1.0
   */
  baseStats?: Partial<Showdown.StatsTable>;

  /**
   * Calculated stats of the Pokemon based on its current properties.
   *
   * @default
   * ```ts
   * { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
   * ```
   * @since 0.1.0
   */
  calculatedStats?: Partial<Showdown.StatsTable>;

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
   * @deprecated Probably not being used anymore.
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

export type CalcdexPlayerSide = SmogonState.Side;
export type CalcdexBattleField = SmogonState.Field;

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
 * Primary state for a given single instance of the Calcdex.
 *
 * @since 0.1.0
 */
export interface CalcdexBattleState extends CalcdexPlayerState {
  /**
   * Derived from `id` of the Showdown `battle` state.
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

  gen: GenerationNum;
  format: string;
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
  TRequired extends keyof CalcdexBattleState = never,
> = PayloadAction<Modify<DeepPartial<CalcdexBattleState>, Required<Pick<CalcdexBattleState, 'battleId' | TRequired>>>>;

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

const l = logger('@showdex/redux/store/calcdexSlice');

export const calcdexSlice = createSlice<CalcdexSliceState, SliceCaseReducers<CalcdexSliceState>, string>({
  name: 'calcdex',

  initialState: {},

  reducers: {
    /**
     * Initializes an empty Calcdex state.
     *
     * @since 0.1.3
     */
    init: (state, action: CalcdexSliceStateAction) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
      );

      const { battleId } = action.payload;

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
        ...action.payload,

        battleId,
        battleNonce: null, // make sure we don't set this for the syncBattle() action
        gen: action.payload.gen || <GenerationNum> env.int('calcdex-default-gen'),
        format: action.payload.format || null,
        field: action.payload.field || sanitizeField(null),

        p1: {
          sideid: 'p1',
          name: null,
          rating: null,
          activeIndex: -1,
          selectionIndex: 0,
          autoSelect: true,

          ...action.payload.p1,
          pokemonOrder: [],
          pokemon: [],
        },

        p2: {
          sideid: 'p2',
          name: null,
          rating: null,
          activeIndex: -1,
          selectionIndex: 0,
          autoSelect: true,

          ...action.payload.p2,
          pokemonOrder: [],
          pokemon: [],
        },
      };

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', `state[${battleId}]`, state[battleId],
      );
    },

    /**
     * Updates an existing `CalcdexBattleState`.
     *
     * @since 0.1.3
     */
    update: (state, action: CalcdexSliceStateAction) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
      );

      const {
        battleId,
        battleNonce,
        gen,
        format,
      } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (!(battleId in state)) {
        l.error('Could not find a CalcdexBattleState with battleId', battleId);

        return;
      }

      const currentState = state[battleId];

      state[battleId] = {
        ...currentState,

        battleId: battleId || currentState.battleId,
        battleNonce: battleNonce || currentState.battleNonce,
        gen: typeof gen === 'number' && gen > 0 ? gen : currentState.gen,
        format: format || currentState.format,
      };

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state.calcdex', state.calcdex,
      );
    },

    /**
     * Updates the `field` of a matching `CalcdexBattleState` from the provided `battleId`.
     *
     * @since 0.1.3
     */
    updateField: (state, action: CalcdexSliceStateAction<'field'>) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
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

      state[battleId] = {
        ...state[battleId],

        field: {
          ...state[battleId].field,
          ...field,
        },
      };

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state.calcdex', state.calcdex,
      );
    },

    /**
     * Updates a `CalcdexPlayer` of a matching `CalcdexBattleState` from the provided `battleId`.
     *
     * * You can technically update both players in a single `dispatch()` by providing `p1` and `p2`.
     *
     * @since 0.1.3
     */
    updatePlayer: (state, action: CalcdexSliceStateAction) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
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
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state.calcdex', state.calcdex,
      );
    },

    /**
     * Updates a `CalcdexPokemon` of an existing `CalcdexPlayer` of a matching `CalcdexBattleState` from the provided `battleId`.
     *
     * @since 0.1.3
     */
    updatePokemon: (state, action: PayloadAction<CalcdexSlicePokemonAction>) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
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
          '\n', 'battleState', battleState,
          '\n', 'pokemon', pokemon,
        );

        return;
      }

      const playerState = battleState[playerKey];

      const pokemonId = pokemon?.calcdexId || calcPokemonCalcdexId(pokemon);
      const pokemonStateIndex = playerState.pokemon.findIndex((p) => p.calcdexId === pokemonId);
      const pokemonState = pokemonStateIndex > -1 ? playerState.pokemon[pokemonStateIndex] : null;

      if (!pokemonState) {
        l.debug(
          'Could not find Pokemon', pokemonId, 'of player', playerKey, 'in battleId', battleId,
          '\n', 'battleState', battleState,
          '\n', 'playerState', playerState,
          '\n', 'pokemon', pokemon,
        );
      }

      playerState.pokemon[pokemonStateIndex] = {
        ...pokemonState,
        ...pokemon,
      };

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', state,
      );
    },
  },

  extraReducers: (build) => void build
    .addCase(syncBattle.fulfilled, (state, action) => {
      const { battleId } = action.payload;

      if (battleId) {
        state[battleId] = action.payload;
      }
    }),
});

export const useCalcdexState = () => useSelector(
  (state) => state?.calcdex,
);