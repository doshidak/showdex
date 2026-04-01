/**
 * @file `hellodexSlice.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.6
 */

import {
  type Draft,
  type PayloadAction,
  createSlice,
  current,
} from '@reduxjs/toolkit';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { useDispatch, useSelector } from './hooks';

/**
 * Battle win / loss record state.
 *
 * * Currently does not persist between sessions.
 *   - Will be reset back to 0 wins & 0 losses when Showdown is refreshed.
 * * Should only record battles that the logged-in user is a player in (i.e., not spectating).
 * * As of v1.3.0, battle IDs are recorded instead of incrementing a stored number to avoid duplicate records.
 *
 * @since 1.0.6
 */
export interface HellodexBattleRecord {
  /**
   * IDs of won battles in the current session.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.0.6
   */
  wins: string[];

  /**
   * IDs of lost battles in the current session.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.0.6
   */
  losses: string[];
}

/**
 * Primary state for the Hellodex.
 *
 * @since 1.0.6
 */
export interface HellodexSliceState {
  /**
   * Last recorded container size label.
   *
   * @default
   * ```ts
   * 'xs' as ElementSizeLabel
   * ```
   * @since 1.2.0
   */
  containerSize: ElementSizeLabel;

  /**
   * Win/loss record state.
   *
   * @since 1.0.6
   */
  battleRecord: HellodexBattleRecord;
}

/**
 * Reducer function definitions.
 *
 * @since 1.0.6
 */
export interface HellodexSliceReducers {
  /**
   * Updates any part of the `HellodexSliceState`.
   *
   * @since 1.2.0
   */
  update: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<DeepPartial<HellodexSliceState>>,
  ) => void;

  /**
   * Records the specified battle ID (under the `action.payload`) as a win.
   *
   * * No-op's if the battle ID already exists in the `battleRecord.wins[]` state.
   * * As of v1.3.0, the `HellodexBattleRecord` now records battle IDs instead of `number`'s.
   *
   * @since 1.0.6
   */
  recordWin: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<string>,
  ) => void;

  /**
   * Records the specified battle ID (under the `action.payload`) as a loss.
   *
   * * No-op's if the battle ID already exists in the `battleRecord.losses[]` state.
   * * As of v1.3.0, the `HellodexBattleRecord` now records battle IDs instead of `number`'s.
   *
   * @since 1.0.6
   */
  recordLoss: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<string>,
  ) => void;

  /**
   * Resets the record to 0 wins & 0 losses.
   *
   * * Internally, this empties both the `battleRecord.wins[]` & `battleRecord.losses[]` states.
   * * As of v1.3.0, the `HellodexBattleRecord` now records battle IDs instead of `number`'s.
   *
   * @since 1.0.6
   */
  resetRecord: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<null>,
  ) => void;
}

const l = logger('@showdex/redux/store/hellodexSlice');

export const hellodexSlice = createSlice({
  name: 'hellodex',

  initialState: {
    containerSize: 'xs',
    battleRecord: {
      wins: [],
      losses: [],
    },
  },

  reducers: {
    update: (state, action) => {
      const { payload } = action;

      if (!nonEmptyObject(payload)) {
        return;
      }

      if (payload?.containerSize) {
        state.containerSize = payload.containerSize;
      }

      if (nonEmptyObject(payload?.battleRecord)) {
        state.battleRecord = {
          ...state.battleRecord,
          ...payload.battleRecord,
        };
      }

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    recordWin: (state, action) => {
      /* l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      ); */

      if (!action.payload || state.battleRecord.wins.includes(action.payload)) {
        return;
      }

      state.battleRecord.wins = [
        ...(state.battleRecord.wins || []),
        action.payload,
      ];

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    recordLoss: (state, action) => {
      /* l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      ); */

      if (!action.payload || state.battleRecord.losses.includes(action.payload)) {
        return;
      }

      state.battleRecord.losses = [
        ...(state.battleRecord.losses || []),
        action.payload,
      ];

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    resetRecord: (state, action: PayloadAction<void>) => {
      /* l.debug(
        'RECV', action.type,
        '\n', 'state', __DEV__ && current(state),
      ); */

      state.battleRecord.wins = [];
      state.battleRecord.losses = [];

      l.debug(
        'DONE', action.type,
        '\n', 'state', __DEV__ && current(state),
      );
    },
  },
});

/**
 * Convenient hook to access the `HellodexSliceState`.
 *
 * @since 1.2.0
 */
export const useHellodexState = () => useSelector(
  (state) => state.hellodex,
);

/**
 * Convenient hook to access the current `HellodexBattleRecord`.
 *
 * @since 1.0.6
 */
export const useBattleRecord = () => useSelector(
  (state) => state.hellodex?.battleRecord,
);

/**
 * Convenient hook to increase the win count in the `HellodexBattleRecord`.
 *
 * * As of v1.3.0, the `HellodexBattleRecord` now records battle IDs instead of `number`'s.
 *
 * @since 1.0.6
 */
export const useBattleRecordWin = () => {
  const dispatch = useDispatch();

  return (battleId: string): void => void dispatch(
    hellodexSlice.actions.recordWin(battleId),
  );
};

/**
 * Convenient hook to increase the loss count in the `HellodexBattleRecord`.
 *
 * * As of v1.3.0, the `HellodexBattleRecord` now records battle IDs instead of `number`'s.
 *
 * @since 1.0.6
 */
export const useBattleRecordLoss = () => {
  const dispatch = useDispatch();

  return (battleId: string): void => void dispatch(
    hellodexSlice.actions.recordLoss(battleId),
  );
};

/**
 * Convenient hook to reset the `HellodexBattleRecord`.
 *
 * @since 1.0.6
 */
export const useBattleRecordReset = () => {
  const dispatch = useDispatch();

  return (): void => void dispatch(
    hellodexSlice.actions.resetRecord(),
  );
};
