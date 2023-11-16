import {
  type Draft,
  type PayloadAction,
  type SliceCaseReducers,
  createSlice,
  current,
} from '@reduxjs/toolkit';
import { type GameType, type GenerationNum } from '@smogon/calc';
import { AllPlayerKeys } from '@showdex/consts/battle';
import {
  type CalcdexBattleField,
  type CalcdexBattleRules,
  type CalcdexPlayer,
  type CalcdexPlayerKey,
  type CalcdexPokemon,
  type CalcdexPokemonPreset,
} from '@showdex/interfaces/calc';
import { syncBattle, SyncBattleActionType } from '@showdex/redux/actions';
import { countActivePlayers, sanitizeField } from '@showdex/utils/battle';
import { calcPokemonCalcdexId } from '@showdex/utils/calc';
import { env } from '@showdex/utils/core';
import { logger, runtimer } from '@showdex/utils/debug';
import { detectLegacyGen, parseBattleFormat } from '@showdex/utils/dex';
import { useSelector } from './hooks';

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
   * @example 8
   * @since 0.1.0
   */
  gen: GenerationNum;

  /**
   * Battle format.
   *
   * * Derived from splitting the `id` of the Showdown `battle` state.
   * * Note that this includes the `'gen#'` portion of the format.
   *
   * @example 'gen9vgc2023'
   * @since 0.1.0
   */
  format: string;

  /**
   * Battle sub-formats.
   *
   * @example
   * ```ts
   * [
   *   'regulatione',
   *   'bo3',
   * ]
   * ```
   * @since 1.1.7
   */
  subFormats?: string[];

  /**
   * Game type, whether `'Singles'` or `'Doubles'`.
   *
   * @default 'Singles'
   * @since 1.1.7
   */
  gameType: GameType;

  /**
   * Whether the gen uses legacy battle mechanics.
   *
   * * Determined via `detectLegacyGen()`.
   *
   * @since 1.1.1
   */
  legacy: boolean;

  /**
   * Rules (clauses) applied to the battle.
   *
   * @since 0.1.3
   */
  rules?: CalcdexBattleRules;

  /**
   * Current turn number, primarily recorded for debugging purposes.
   *
   * @default 0
   * @since 1.0.4
   */
  turn?: number;

  /**
   * Whether the battle is currently active (i.e., not ended).
   *
   * @default false
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
   * Whether the overlay is open/visible.
   *
   * * Has no effect if `renderMode` is not `'overlay'`.
   *
   * @since 1.1.3
   */
  overlayVisible?: boolean;

  /**
   * Number of active players in the battle.
   *
   * @default 0
   * @since 1.1.3
   */
  playerCount: number;

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
   * Whether to switch the players in the Calcdex.
   *
   * * Populated directly from `sidesSwitched` of the `battle`.
   * * Does not change the population behavior of `playerKey` and `opponentKey`, just how they're rendered.
   *   - Specifically, this dictates the `topKey` and `bottomKey` in the Calcdex.
   *
   * @default false
   * @since 1.1.3
   */
  switchPlayers?: boolean;

  /**
   * Tracked field conditions.
   *
   * @since 0.1.0
   */
  field: CalcdexBattleField;

  /**
   * Hash of all the relevant `stepQueue`s used to derive `sheets`.
   *
   * * Primarily used to determine if we should repopulate the `sheets`.
   *   - Could happen if another player suddenly reveals their team mid-battle.
   *   - For this reason, we don't optimize the population of `sheets` to once per battle.
   * * Hash is generated by `calcCalcdexId()` by joining all relevant `stepQueue`s into a `string`, deliminated by a
   *   semi-colon (i.e., `;`), in `syncBattle()`.
   *   - In other words, this hash is a namespaced UUID.
   *
   * @default null
   * @since 1.1.3
   */
  sheetsNonce: string;

  /**
   * Converted presets derived from team sheets posted in the battle.
   *
   * * These are unique to each battle and are populated from the relevant `stepQueue`s in `syncBattle()`.
   * * Will only be populated if the `autoImportTeamSheet` Calcdex setting is enabled, team sheets are available, and
   *   the generated `sheetsNonce` doesn't match the previously stored value, if any.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.3
   */
  sheets: CalcdexPokemonPreset[];
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
> = PayloadAction<Modify<{ scope?: string; } & DeepPartial<CalcdexBattleState>, {
  // idk why CalcdexBattleField isn't partialed from DeepPartial<CalcdexBattleState>
  [P in TRequired]: P extends 'field' ? DeepPartial<CalcdexBattleField> : DeepPartial<CalcdexBattleState>[P];
}>>;

/**
 * Payload required for mutating a `playerKey`'s `pokemon` in the `battleId`.
 *
 * @since 0.1.3
 */
export interface CalcdexSlicePokemonAction {
  /**
   * Optional name of the thing that dispatched this action.
   *
   * * Used for debugging purposes only.
   *
   * @since 1.1.3
   */
  scope?: string;

  battleId: string;
  playerKey: CalcdexPlayerKey;
  pokemon: Partial<CalcdexPokemon>;
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

const defaultMaxPokemon = env.int('calcdex-player-max-pokemon');
const l = logger('@showdex/redux/store/calcdexSlice');

export const calcdexSlice = createSlice<CalcdexSliceState, CalcdexSliceReducers, string>({
  name: 'calcdex',

  initialState: {},

  reducers: {
    init: (state, action) => {
      const endTimer = runtimer(`calcdexSlice.init() via ${action.payload?.scope || '(anon)'}`, l);

      // l.debug(
      //   'RECV', action.type, 'from', action.payload?.scope || '(anon)',
      //   '\n', 'battleId', action.payload?.battleId || '???',
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      const {
        scope, // used for debugging; not used here, but destructuring it from `...payload`
        battleId,
        gen: genFromPayload = env.int<GenerationNum>('calcdex-default-gen'),
        format: formatFromPayload = null,
        gameType = 'Singles',
        rules = {},
        turn = 0,
        active = false,
        renderMode,
        overlayVisible = false,
        playerKey = null,
        authPlayerKey = null,
        opponentKey = null,
        switchPlayers = false,
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

      const {
        gen: genFromFormat,
        base,
        suffixes,
      } = parseBattleFormat(formatFromPayload);

      const gen = genFromFormat || genFromPayload;

      state[battleId] = {
        ...payload,

        battleId,
        // battleNonce: null, // make sure we don't set this for the syncBattle() action

        gen,
        format: `gen${gen}${base}`,
        subFormats: suffixes?.map((s) => s?.[0]).filter(Boolean) || [],
        gameType,
        legacy: detectLegacyGen(gen),
        rules,
        turn,
        active,

        renderMode,
        overlayVisible: renderMode === 'overlay' && overlayVisible,

        playerCount: 0,
        playerKey,
        authPlayerKey,
        opponentKey,
        switchPlayers,

        ...AllPlayerKeys.reduce<Record<CalcdexPlayerKey, CalcdexPlayer>>((prev, currentPlayerKey) => {
          prev[currentPlayerKey] = {
            // all of these can technically be overridden in payload[currentPlayerKey]
            sideid: currentPlayerKey,
            active: currentPlayerKey in payload,
            name: null,
            rating: null,
            activeIndices: [],
            selectionIndex: 0,
            autoSelect: true,
            maxPokemon: defaultMaxPokemon,
            usedMax: false,
            usedTera: false,

            // since this requires the battle object (typically only available in the CalcdexProvider scope),
            // we won't initialize it here; however, initial values can still be provided through payload[currentPlayerKey]
            side: null,

            // spread any overrides provided from the payload
            ...payload[currentPlayerKey],

            // these cannot be overridden on init
            pokemonOrder: [],
            pokemon: [],
          };

          return prev;
        }, {
          p1: null,
          p2: null,
          p3: null,
          p4: null,
        }),

        field: field as CalcdexBattleField || sanitizeField(),

        sheetsNonce: null,
        sheets: [],
      };

      // state[battleId].playerCount = AllPlayerKeys.filter((k) => state[battleId][k].active).length;
      state[battleId].playerCount = countActivePlayers(state[battleId]);

      endTimer();

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'battleId', battleId || '???',
        '\n', 'payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    update: (state, action) => {
      const endTimer = runtimer(`calcdexSlice.update() via ${action.payload?.scope || '(anon)'}`, l);

      // l.debug(
      //   'RECV', action.type, 'from', action.payload?.scope || '(anon)',
      //   '\n', 'battleId', action.payload?.battleId || '???',
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      const {
        battleId,
        battleNonce,
        gen,
        format,
        active,
        overlayVisible,
        playerKey,
        opponentKey,
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
        // active: typeof active === 'boolean' ? active : currentState.active,
        overlayVisible: currentState.renderMode === 'overlay' && overlayVisible,
        playerKey: playerKey || currentState.playerKey,
        opponentKey: opponentKey || currentState.opponentKey,
      };

      // for the active state, only update if previously true and the new value is false
      // as we don't want the HellodexBattleRecord to record replays or battle re-inits
      if (currentState.active && typeof active === 'boolean' && !active) {
        state[battleId].active = active;
      }

      endTimer();

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'battleId', battleId || '???',
        '\n', 'payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    updateField: (state, action) => {
      const endTimer = runtimer(`calcdexSlice.updateField() via ${action.payload?.scope || '(anon)'}`, l);

      // l.debug(
      //   'RECV', action.type, 'from', action.payload?.scope || '(anon)',
      //   '\n', 'battleId', action.payload?.battleId || '???',
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

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

        // update (2023/01/22): attackerSide and defenderSide are now only dynamically populated
        // within createSmogonField(); these properties are now being stored in each CalcdexPlayer
        // under the `side` property (i.e., don't store the CalcdexPlayerSide's in the CalcdexBattleField!)
        // attackerSide: {
        //   ...battleField.attackerSide,
        //   ...field?.attackerSide,
        // },

        // defenderSide: {
        //   ...battleField.defenderSide,
        //   ...field?.defenderSide,
        // },
      };

      endTimer();

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'battleId', battleId || '???',
        '\n', 'payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    updatePlayer: (state, action) => {
      const endTimer = runtimer(`calcdexSlice.updatePlayer() via ${action.payload?.scope || '(anon)'}`, l);

      // l.debug(
      //   'RECV', action.type, 'from', action.payload?.scope || '(anon)',
      //   '\n', 'battleId', action.payload?.battleId || '???',
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      const { battleId } = action.payload;

      if (!battleId) {
        l.error('Attempted to initialize a CalcdexBattleState with a falsy battleId.');

        return;
      }

      if (!(battleId in state)) {
        l.error('Could not find a CalcdexBattleState with battleId', battleId);

        return;
      }

      if (AllPlayerKeys.every((k) => !Object.keys(action.payload[k] || {}).length)) {
        l.error('Found no players to update!');
      }

      AllPlayerKeys.forEach((playerKey) => {
        const payload = action.payload[playerKey];

        if (!Object.keys(payload || {}).length) {
          return;
        }

        state[battleId][playerKey] = {
          ...state[battleId][playerKey],
          ...payload,

          side: {
            ...state[battleId][playerKey].side,
            ...payload?.side,
          },
        };
      });

      endTimer();

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'battleId', battleId || '???',
        '\n', 'payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    updatePokemon: (state, action) => {
      const endTimer = runtimer(`calcdexSlice.updatePokemon() via ${action.payload?.scope || '(anon)'}`, l);

      // l.debug(
      //   'RECV', action.type, 'from', action.payload?.scope || '(anon)',
      //   '\n', 'battleId', action.payload?.battleId || '???',
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

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
          'Could not find player', playerKey, 'in state for', battleId,
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
            'Could not find Pokemon', pokemonId, 'of player', playerKey, 'in state for', battleId,
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
      } as CalcdexPokemon;

      endTimer();

      l.debug(
        'DONE', action.type, 'from', action.payload?.scope || '(anon)',
        '\n', 'battleId', battleId || '???',
        '\n', 'payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    },

    destroy: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'battleId (payload)', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

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
        '\n', 'battleId (payload)', action.payload,
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
        'DONE', SyncBattleActionType, 'from', '@showdex/redux/actions/syncBattle',
        '\n', 'battleId', battleId || '???',
        '\n', 'payload', action.payload,
        '\n', 'battleState', __DEV__ && current(state)[battleId],
      );
    }),
});

export const useCalcdexState = () => useSelector(
  (state) => state?.calcdex,
);

export const useCalcdexBattleState = (
  battleId: string,
) => useSelector(
  (state) => (state?.calcdex?.[battleId] ?? {}) as CalcdexBattleState,
);
