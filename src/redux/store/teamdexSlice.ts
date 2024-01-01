import {
  type Draft,
  type PayloadAction,
  type SliceCaseReducers,
  createSlice,
  current,
} from '@reduxjs/toolkit';
import { type CalcdexPokemonPreset } from '@showdex/interfaces/calc';
import { logger } from '@showdex/utils/debug';
import { useSelector } from './hooks';

/**
 * Future home of the Teamdex (i.e., Calcdex for the Teambuilder), but is only being used to store
 * converted presets from Teambuilder teams and boxes atm.
 *
 * @since 1.1.3
 */
export interface TeamdexSliceState {
  /**
   * Converted presets derived from Teambuilder teams and boxes.
   *
   * * Used by the Calcdex as well.
   *
   * @default
   * ```ts
   * []
   * ```
   * @since 1.1.3
   */
  presets: CalcdexPokemonPreset[];
}

/**
 * Reducer function definitions.
 *
 * @since 1.1.3
 */
export interface TeamdexSliceReducers extends SliceCaseReducers<TeamdexSliceState> {
  /**
   * Directly sets the internally stored `presets` with the provided value in `action`.
   *
   * @since 1.1.3
   */
  setPresets: (
    state: Draft<TeamdexSliceState>,
    action: PayloadAction<CalcdexPokemonPreset[]>,
  ) => void;
}

const l = logger('@showdex/redux/store/teamdexSlice');

export const teamdexSlice = createSlice<TeamdexSliceState, TeamdexSliceReducers, string>({
  name: 'teamdex',

  initialState: {
    presets: [],
  },

  reducers: {
    setPresets: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'action.payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      if (!Array.isArray(action.payload)) {
        if (__DEV__) {
          l.warn(
            'Attempted to set Teambuilder presets to a non-array payload.',
            '\n', 'typeof action.payload', typeof action.payload,
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      // note: this is only a shallow copy of the preset object elements in the payload array
      state.presets = [...action.payload];

      l.debug(
        'DONE', action.type,
        // '\n', 'action.payload', action.payload,
        '\n', '#action.payload', action.payload.length,
        // '\n', 'state', __DEV__ && current(state),
        '\n', '#state.presets', state.presets.length,
      );
    },
  },
});

/**
 * Convenient hook to access the current `presets` in the `TeamdexSliceState`.
 *
 * @since 1.1.3
 */
export const useTeamdexPresets = () => useSelector(
  (state) => state.teamdex?.presets || [],
);
