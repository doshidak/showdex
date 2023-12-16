import {
  type Draft,
  type PayloadAction,
  type SliceCaseReducers,
  createSlice,
  current,
} from '@reduxjs/toolkit';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { type ElementSizeLabel } from '@showdex/utils/hooks';
import { useDispatch, useSelector } from './hooks';

/**
 * Win/loss record state.
 *
 * * Currently does not persist between sessions.
 *   - Will be reset back to 0 wins and 0 losses when Showdown is refreshed.
 * * Should only record battles that the logged-in user is a player in (i.e., not spectating).
 *
 * @since 1.0.6
 */
export interface HellodexBattleRecord {
  /**
   * Number of wins in the current session.
   *
   * @default 0
   * @since 1.0.6
   */
  wins: number;

  /**
   * Number of losses in the current session.
   *
   * @default 0
   * @since 1.0.6
   */
  losses: number;
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
   * @default 'xs'
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
export interface HellodexSliceReducers extends SliceCaseReducers<HellodexSliceState> {
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
   * Increases the win count by the specified amount in `action.payload` (`1` by default).
   *
   * * Amount in `action.payload` must be positive, otherwise, will default to `0`.
   *
   * @since 1.0.6
   */
  recordWin: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<number>,
  ) => void;

  /**
   * Increases the loss count by the specified amount in `action.payload` (`1` by default).
   *
   * * Amount in `action.payload` must be positive, otherwise, will default to `0`.
   *
   * @since 1.0.6
   */
  recordLoss: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<number>,
  ) => void;

  /**
   * Resets the record to `0` wins & `0` losses.
   *
   * @since 1.0.6
   */
  resetRecord: (
    state: Draft<HellodexSliceState>,
    action: PayloadAction<null>,
  ) => void;
}

const l = logger('@showdex/redux/store/hellodexSlice');

export const hellodexSlice = createSlice<HellodexSliceState, HellodexSliceReducers, string>({
  name: 'hellodex',

  initialState: {
    containerSize: 'xs',
    battleRecord: {
      wins: 0,
      losses: 0,
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
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'action.payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      const { wins: currentWins = 0 } = state.battleRecord || {};
      const deltaWins = Math.max(action.payload || 1, 0);

      state.battleRecord.wins = Math.max(currentWins + deltaWins, 0);

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    recordLoss: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'action.payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      const { losses: currentLosses = 0 } = state.battleRecord || {};
      const deltaLosses = Math.max(action.payload || 1, 0);

      state.battleRecord.losses = Math.max(currentLosses + deltaLosses, 0);

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    resetRecord: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      state.battleRecord.wins = 0;
      state.battleRecord.losses = 0;

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
 * * `amount` must be positive, otherwise, will default to `0`.
 *
 * @since 1.0.6
 */
export const useBattleRecordWin = () => {
  const dispatch = useDispatch();

  return (amount = 1) => dispatch(
    hellodexSlice.actions.recordWin(amount),
  );
};

/**
 * Convenient hook to increase the loss count in the `HellodexBattleRecord`.
 *
 * * `amount` must be positive, otherwise, will default to `0`.
 *
 * @since 1.0.6
 */
export const useBattleRecordLoss = () => {
  const dispatch = useDispatch();

  return (amount = 1) => dispatch(
    hellodexSlice.actions.recordLoss(amount),
  );
};

/**
 * Convenient hook to reset the `HellodexBattleRecord`.
 *
 * @since 1.0.6
 */
export const useBattleRecordReset = () => {
  const dispatch = useDispatch();

  return () => dispatch(
    hellodexSlice.actions.resetRecord(),
  );
};
