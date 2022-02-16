import * as React from 'react';
import { logger } from '@showdex/utils/debug';
import type {
  AbilityName,
  GenerationNum,
  ItemName,
  MoveName,
  // PokemonSet,
} from '@pkmn/data';
// import type { DeepPartial } from '@pkmn/smogon';
import type { State as SmogonState } from '@smogon/calc';
import type {
  // ThunkyReducerAction,
  // ThunkyReducerActionator,
  ThunkyReducerDispatch,
} from '@showdex/utils/hooks';
import { calcPokemonCalcdexId } from './calcCalcdexId';
import { calcPokemonCalcdexNonce } from './calcCalcdexNonce';
import { detectPokemonIdent } from './detectPokemonIdent';
import { sanitizeField } from './sanitizeField';
import { sanitizePlayerSide } from './sanitizePlayerSide';
import { sanitizePokemon } from './sanitizePokemon';
import { syncPokemon } from './syncPokemon';

export interface CalcdexMoveState {
  /**
   * Should only consist of moves that were revealed during the battle.
   *
   * * These moves should have the highest render priority
   *   (i.e., should be at the top of the list).
   * * This is usually accessible within the client `Showdown.Pokemon` object,
   *   under the `moveTrack` property.
   *
   * @default []
   * @since 0.1.0
   */
  revealed: (MoveName | string)[];

  /**
   * Should only consist of moves that the Pokemon can legally learn.
   *
   * * These moves should be rendered after those in `revealed`.
   * * Moves that exist in `revealed` should be filtered out.
   *
   * @default []
   * @since 0.1.0
   */
  learnset: (MoveName | string)[];

  /**
   * Optional moves, including potentially illegal ones for formats like `gen8anythinggoes` (I think lmao).
   *
   * * These moves, if specified, should be rendered last.
   * * Moves that exist in `revealed` and `learnsets` should be filtered out.
   *
   * @default []
   * @since 0.1.0
   */
  other: (MoveName | string)[];
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

  format?: string;
  species?: string;
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
   * @since 0.1.0
   */
  calcdexId?: string;

  /**
   * Internal checksum of the Pokemon's mutable properties used by the extension.
   *
   * @since 0.1.0
   */
  calcdexNonce?: string;

  /**
   * Whether the Pokemon object originates from the client or server.
   *
   * * If the type if `Showdown.Pokemon`, then the Pokemon is *probably* from the client.
   * * If the type is `Showdown.ServerPokemon`, then the Pokemon is from the server (duh).
   * * Used to determine which fields to overwrite when syncing.
   *
   * @default false
   * @since 0.1.0
   */
  serverSourced?: boolean;

  /**
   * Current types of the Pokemon.
   *
   * * Could change depending on the Pokemon's ability, like *Protean*.
   * * Should be set via `tooltips.getPokemonTypes()`.
   *
   * @since 0.1.0
   */
  types?: readonly Showdown.TypeName[];

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
   * Possible abilities of the Pokemon.
   *
   * @default []
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
   * @default []
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
   * @default {}
   * @since 0.1.0
   */
  dirtyBoosts?: Record<Showdown.StatNameNoHp, number>;

  /**
   * Base stats of the Pokemon based on its species.
   *
   * @default { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
   * @since 0.1.0
   */
  baseStats?: Partial<Showdown.StatsTable>;

  /**
   * Calculated stats of the Pokemon based on its current properties.
   *
   * @default { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
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
   * @default []
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
  calcdexNonce?: string;
  activeIndex?: number;
  selectionIndex?: number;
  pokemon?: CalcdexPokemon[];
}

export type CalcdexPlayerSide = SmogonState.Side;
export type CalcdexBattleField = SmogonState.Field;

export type CalcdexPlayerKey =
  | 'p1'
  | 'p2';
  // | 'p3'
  // | 'p4';

export type CalcdexPlayerState = Record<CalcdexPlayerKey, CalcdexPlayer>;

export interface CalcdexReducerState extends CalcdexPlayerState {
  battleId: string;
  gen: GenerationNum;
  format: string;
  field: CalcdexBattleField;
}

export type CalcdexReducerActionType =
  | '@/:init'
  | '@/:put'
  | '@field/:put'
  // | '@field/:sync'
  | '@p1/:init'
  | '@p1/:put'
  | '@p1/activeIndex:put'
  | '@p1/selectionIndex:put'
  | '@p1/pokemon:post'
  | '@p1/pokemon:put'
  | '@p1/pokemon:delete'
  | '@p1/pokemon:sync'
  | '@p1/side:put'
  | '@p2/:init'
  | '@p2/:put'
  | '@p2/activeIndex:put'
  | '@p2/selectionIndex:put'
  | '@p2/pokemon:post'
  | '@p2/pokemon:put'
  | '@p2/pokemon:delete'
  | '@p2/pokemon:sync'
  | '@p2/side:put';

export interface CalcdexReducerAction {
  type: CalcdexReducerActionType;
  payload?: unknown;
}

export type CalcdexReducerInstance = React.Reducer<CalcdexReducerState, CalcdexReducerAction>;
export type CalcdexReducerDispatch = ThunkyReducerDispatch<CalcdexReducerInstance>;

export const CalcdexInitialState: CalcdexReducerState = {
  battleId: null,
  gen: 8,
  format: null,
  field: sanitizeField(null),

  p1: {
    sideid: 'p1',
    activeIndex: -1,
    selectionIndex: 0,
    pokemon: [],
    // side: sanitizePlayerSide(null),
  },

  p2: {
    sideid: 'p2',
    activeIndex: -1,
    selectionIndex: 0,
    pokemon: [],
    // side: sanitizePlayerSide(null),
  },
};

const l = logger('Calcdex/CalcdexReducer');

const getPlayerKeyFromActionType = (
  type: CalcdexReducerActionType,
): keyof CalcdexReducerState => (type?.startsWith?.('@p2') ? 'p2' : 'p1');

export const CalcdexReducer: CalcdexReducerInstance = (
  state,
  action,
) => {
  l.debug(
    'dispatched', action?.type || '(falsy value)',
    '\n', 'payload', action?.payload,
  );

  switch (action?.type) {
    case '@/:init': {
      const {
        battleId,
        gen,
        format,
      } = <Partial<CalcdexReducerState>> (action.payload || {});

      l.debug(
        action.type,
        '\n', 'initializing CalcdexReducer state',
        '\n', 'battleId', battleId || CalcdexInitialState.battleId,
        '\n', 'gen', gen || CalcdexInitialState.gen,
        '\n', 'format', format || CalcdexInitialState.format,
      );

      // seems that the dereferenced pointers to each player's `pokemon` array is directly modified,
      // which means that the same `pokemon` arrays in `CalcdexInitialState` are modified as well.
      // setting each player's `pokemon` to a new array is a gross workaround, but w/e.

      return {
        ...CalcdexInitialState,
        battleId: battleId || CalcdexInitialState.battleId,
        gen: gen || CalcdexInitialState.gen,
        format: format || CalcdexInitialState.format,
        p1: {
          ...CalcdexInitialState.p1,
          pokemon: [],
        },
        p2: {
          ...CalcdexInitialState.p2,
          pokemon: [],
        },
      };
    }

    case '@/:put': {
      const {
        battleId,
        gen,
        format,
      } = <Partial<CalcdexReducerState>> (action.payload || {});

      l.debug(
        action.type,
        '\n', 'updating battle properties',
        '\n', 'battleId', battleId,
        '\n', 'gen', gen, 'format', format,
      );

      // since this is a `put` action, don't allow values to be falsy
      return {
        ...state,
        battleId: battleId || state.battleId,
        gen: gen && typeof gen === 'number' && gen > 0 ? gen : state.gen,
        format: format || state.format,
      };
    }

    case '@field/:put': {
      const field = <CalcdexBattleField> (action.payload || {});

      if (!Object.keys(field).length) {
        l.warn(
          action.type,
          '\n', 'received an empty field payload',
          '\n', 'field', field,
        );

        return state;
      }

      const updatedField: CalcdexBattleField = {
        ...state.field,
        ...field,
      };

      return {
        ...state,
        field: updatedField,
      };
    }

    // case '@field/:sync': {
    //   const battle = <Showdown.Battle> (action.payload || {});
    //
    //   if (!battle?.gameType) {
    //     l.warn(
    //       action.type,
    //       '\n', 'received an invalid battle object', battle,
    //       '\n', 'battle', battle,
    //     );
    //
    //     return state;
    //   }
    //
    //   const { activeIndex: attackerIndex } = state.p1;
    //   const { activeIndex: defenderIndex } = state.p2;
    //
    //   const updatedField = sanitizeField(battle, attackerIndex, defenderIndex);
    //
    //   l.debug(
    //     action.type,
    //     '\n', 'updating field to', updatedField,
    //   );
    //
    //   return {
    //     ...state,
    //     field: updatedField,
    //   };
    // }

    case '@p1/:init':
    case '@p2/:init': {
      const playerKey = getPlayerKeyFromActionType(action.type);

      return {
        ...state,
        [playerKey]: CalcdexInitialState[playerKey],
      };
    }

    case '@p1/:put':
    case '@p2/:put': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const player = <CalcdexPlayer> (action.payload || {});

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          ...player,
        },
      };
    }

    case '@p1/activeIndex:put':
    case '@p2/activeIndex:put': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const activeIndex = <number> action.payload;

      l.debug(
        action.type,
        '\n', 'setting activeIndex of player', playerKey, 'to', activeIndex,
      );

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          activeIndex: typeof activeIndex === 'number' && activeIndex > -1 ? activeIndex : (<CalcdexPlayer> state[playerKey]).activeIndex,
        },
      };
    }

    case '@p1/selectionIndex:put':
    case '@p2/selectionIndex:put': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const selectionIndex = <number> action.payload;

      l.debug(
        action.type,
        '\n', 'setting selectionIndex of player', playerKey, 'to', selectionIndex,
      );

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          selectionIndex: typeof selectionIndex === 'number' && selectionIndex > -1 ? selectionIndex : (<CalcdexPlayer> state[playerKey]).selectionIndex,
        },
      };
    }

    case '@p1/pokemon:post':
    case '@p2/pokemon:post': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const pokemon = <Partial<Showdown.Pokemon & CalcdexPokemon>> (action.payload || {});
      const ident = detectPokemonIdent(pokemon);

      if (!ident) {
        l.warn(
          action.type,
          '\n', 'received pokemon with invalid ident', ident,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      const { pokemon: updatedPokemon } = <CalcdexPlayer> state[playerKey];

      if (!Array.isArray(updatedPokemon)) {
        l.warn(
          action.type,
          '\n', 'found an invalid pokemon array for the player', playerKey,
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
        );

        // alternatively, we could just construct an empty array and let the logic continue
        return state;
      }

      if (updatedPokemon.length >= 6) {
        l.warn(
          action.type,
          '\n', 'player', playerKey, 'cannot have more than 6 pokemon',
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      // `sanitizePokemon()` will assign a calcdexId and recalculate the calcdexNonce
      // (we call this here before the `index` check to ensure a reliable non-falsy `calcdexId`)
      const newPokemon = sanitizePokemon(pokemon);

      if (!newPokemon?.calcdexId) {
        l.warn(
          action.type,
          '\n', 'found a falsy calcdexId for the Pokemon', ident, 'despite sanitizing it',
          '\n', 'sanitizePokemon(', pokemon, ')', newPokemon,
        );

        return state;
      }

      const index = updatedPokemon
        .findIndex((p) => (!!p?.calcdexId && p.calcdexId === newPokemon.calcdexId) || detectPokemonIdent(p) === ident);

      if (index > -1) {
        l.warn(
          action.type,
          '\n', 'found a duplicate pokemon', ident, 'for the player', playerKey,
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      updatedPokemon.push(newPokemon);

      l.debug(
        action.type,
        '\n', 'adding pokemon', ident, 'for the player', playerKey,
        '\n', 'newPokemon', newPokemon,
        '\n', `state.${playerKey}.pokemon`, updatedPokemon,
      );

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          pokemon: updatedPokemon,
        },
      };
    }

    case '@p1/pokemon:put':
    case '@p1/pokemon:sync':
    case '@p2/pokemon:put':
    case '@p2/pokemon:sync': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const pokemon = <Partial<Showdown.Pokemon & CalcdexPokemon>> (action.payload || {});
      const ident = detectPokemonIdent(pokemon);

      l.debug(
        action.type,
        '\n', 'playerKey', playerKey,
        '\n', 'pokemon', pokemon,
        '\n', 'ident', ident,
      );

      if (!ident) {
        l.warn(
          action.type,
          '\n', 'received pokemon with invalid ident', ident,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      const { pokemon: updatedPokemon } = <CalcdexPlayer> state[playerKey];
      // const updatedPokemon = [...((<CalcdexPlayer> state[playerKey]).pokemon || [])];

      if (!Array.isArray(updatedPokemon)) {
        l.warn(
          action.type,
          '\n', 'found an invalid pokemon array for the player', playerKey,
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      const index = updatedPokemon
        .findIndex((p) => (!!p?.calcdexId && p.calcdexId === pokemon?.calcdexId) || detectPokemonIdent(p) === ident);

      if (index < 0) {
        l.warn(
          action.type,
          '\n', 'found no pokemon', ident, 'for the player', playerKey,
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
          '\n', 'index', index,
        );

        return state;
      }

      // const [syncedPokemon, didChange] = syncPokemonStats(updatedPokemon[index], pokemon);

      // if (!didChange) {
      //   l.debug(
      //     action.type,
      //     '\n', 'pokemon', ident, 'for the player', playerKey, 'did not change',
      //     '\n', 'syncedPokemon', syncedPokemon,
      //     '\n', `state.${playerKey}.pokemon`, updatedPokemon,
      //   );
      //
      //   return state;
      // }

      // `syncPokemon()` will assign a calcdexId and recalculate the calcdexNonce
      const shouldSync = action.type.endsWith(':sync');

      const syncedPokemon = shouldSync ? syncPokemon(updatedPokemon[index], pokemon) : <CalcdexPokemon> {
        ...updatedPokemon[index],
        ...pokemon,
        // calculatedStats: {
        //   ...updatedPokemon[index].calculatedStats,
        //   ...pokemon.calculatedStats,
        // },
        dirtyBoosts: {
          ...updatedPokemon[index].dirtyBoosts,
          ...pokemon?.dirtyBoosts,
        },
      };

      // const syncedPokemon = shouldSync ?
      //   syncPokemon(updatedPokemon[index], pokemon) :
      //   $.extend(true, {}, updatedPokemon[index], pokemon);

      if (!shouldSync) {
        // yeah, using $.extend() seems to not update `dirtyBoosts` if its values are `undefined`
        // (e.g., `{ atk: undefined }` will be ignored if something like `{ atk: 2 }` was stored)
        // syncedPokemon.dirtyBoosts = pokemon.dirtyBoosts;

        if (!syncedPokemon.calcdexId) {
          syncedPokemon.calcdexId = calcPokemonCalcdexId(syncedPokemon);
        }

        syncedPokemon.calcdexNonce = calcPokemonCalcdexNonce(syncedPokemon);
      }

      l.debug(
        action.type,
        '\n', 'comparing current Pokemon', ident, 'calcdexNonce', updatedPokemon[index].calcdexNonce,
        '\n', 'updatedPokemon[', index, ']', updatedPokemon[index],
        '\n', 'with the Pokemon\'s recalculated calcdexNonce', syncedPokemon.calcdexNonce,
        '\n', 'syncedPokemon', syncedPokemon,
      );

      if (syncedPokemon?.calcdexNonce === updatedPokemon[index].calcdexNonce) {
        l.debug(
          action.type,
          '\n', 'no updates will be made for the Pokemon', ident,
          '\n', 'since its calcdexNonce did not change, even after recalculation',
          '\n', 'current calcdexNonce', updatedPokemon[index].calcdexNonce, updatedPokemon[index],
          '\n', 'recalculated calcdexNonce', syncedPokemon.calcdexNonce, syncedPokemon,
        );

        return state;
      }

      updatedPokemon[index] = syncedPokemon;

      l.debug(
        action.type,
        '\n', 'updating Pokemon', ident, 'for the player', playerKey,
        '\n', 'current calcdexNonce', updatedPokemon[index].calcdexNonce, updatedPokemon[index],
        '\n', 'recalculated calcdexNonce', syncedPokemon.calcdexNonce, syncedPokemon,
        '\n', `state.${playerKey}.pokemon[`, index, ']', updatedPokemon[index],
        '\n', `state.${playerKey}.pokemon`, updatedPokemon,
      );

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          pokemon: updatedPokemon,
        },
      };
    }

    case '@p1/pokemon:delete':
    case '@p2/pokemon:delete': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const pokemon = <Partial<CalcdexPokemon>> action.payload;
      const ident = detectPokemonIdent(pokemon);

      if (!ident) {
        l.warn(
          action.type,
          '\n', 'received pokemon with invalid ident', ident,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      const { pokemon: updatedPokemon } = <CalcdexPlayer> state[playerKey];

      if (!Array.isArray(updatedPokemon)) {
        l.warn(
          action.type,
          '\n', 'found an invalid pokemon array for the player', playerKey,
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
        );

        return state;
      }

      const index = updatedPokemon.findIndex((p) => p?.ident === ident);

      if (index < 0) {
        l.warn(
          action.type,
          '\n', 'found no pokemon', ident, 'for the player', playerKey,
          '\n', `state.${playerKey}.pokemon`, updatedPokemon,
          '\n', 'pokemon', pokemon,
          '\n', 'index', index,
        );

        return state;
      }

      const deletedPokemon = updatedPokemon.splice(index, 1);

      l.debug(
        action.type,
        '\n', 'deleting pokemon', ident, 'for the player', playerKey,
        '\n', `state.${playerKey}.pokemon[index`, index, ']', deletedPokemon,
        '\n', `state.${playerKey}.pokemon`, updatedPokemon,
      );

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          pokemon: updatedPokemon,
        },
      };
    }

    case '@p1/side:put':
    case '@p2/side:put': {
      const playerKey = getPlayerKeyFromActionType(action.type);
      const clientSide = <Showdown.Side> (action.payload || {});

      if (!clientSide?.sideid) {
        l.warn(
          action.type,
          '\n', 'received clientSide with an invalid sideid', clientSide?.sideid,
          '\n', 'clientSide', clientSide,
        );

        return state;
      }

      const { activeIndex, selectionIndex } = <CalcdexPlayer> state[playerKey];
      const updatedSide = sanitizePlayerSide(clientSide);

      updatedSide.isSwitching = activeIndex === selectionIndex ? 'out' : 'in';

      l.debug(
        action.type,
        '\n', 'updating side', clientSide?.sideid, 'for the player', playerKey,
        '\n', `state.${playerKey}.side`, updatedSide,
      );

      return {
        ...state,
        [playerKey]: {
          ...(<CalcdexPlayer> state[playerKey]),
          side: updatedSide,
        },
      };
    }

    default: {
      l.warn('unknown action type', action?.type || '(falsy value)', action);

      return state;
    }
  }
};
