import { createSlice } from '@reduxjs/toolkit';
import { getColorScheme, getSystemColorScheme } from '@showdex/utils/app';
import { logger } from '@showdex/utils/debug';
import type { Draft, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';
import { useSelector } from './hooks';

/**
 * Extension-wide settings.
 *
 * @todo As of v1.0.2, more settings are planned in future versions!
 * @since 1.0.2
 */
export interface ShowdexSettings {
  /**
   * Current color scheme.
   *
   * @since 1.0.2
   */
  colorScheme: Showdown.ColorScheme;
}

/**
 * Primary state for the entire extension.
 *
 * @since 1.0.2
 */
export interface ShowdexSliceState {
  settings: ShowdexSettings;
}

/**
 * Reducer function definitions.
 *
 * @since 1.0.2
 */
export interface ShowdexSliceReducers extends SliceCaseReducers<ShowdexSliceState> {
  /**
   * Sets the `colorScheme` value in the `ShowdexSettings`.
   *
   * * Primarily dispatched via a `MutationObserver` in `main`.
   * * Should be dispatched from the Showdown client itself, not inside React.
   *   - Otherwise, there is no other way to let React when to re-render when the user
   *     updates the value in Showdown's options menu.
   *
   * @since 1.0.2
   */
  setColorScheme: (state: Draft<ShowdexSliceState>, action: PayloadAction<Showdown.ColorSchemeOption>) => void;
}

const l = logger('@showdex/redux/store/showdexSlice');

export const showdexSlice = createSlice<ShowdexSliceState, ShowdexSliceReducers, string>({
  name: 'showdex',

  initialState: {
    settings: {
      colorScheme: getColorScheme(),
    },
  },

  reducers: {
    setColorScheme: (state, action) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
      );

      if (!['light', 'dark', 'system'].includes(action.payload)) {
        if (__DEV__) {
          l.warn(
            'action.payload is not one of: light, dark, system',
            '\n', 'action.payload', action.payload,
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      state.settings.colorScheme = action.payload === 'system'
        ? getSystemColorScheme()
        : action.payload;

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        // '\n', 'state.settings', state.settings, // this is a proxy
      );
    },
  },
});

export const useColorScheme = () => useSelector(
  (state) => (<ShowdexSliceState> state?.showdex)?.settings?.colorScheme ?? 'light',
);
