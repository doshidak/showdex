import {
  type Draft,
  type PayloadAction,
  type SliceCaseReducers,
  createSlice,
  current,
} from '@reduxjs/toolkit';
import { DefaultShowdexSettings } from '@showdex/consts/hydro';
import { type BakedexApiBunsPayload } from '@showdex/interfaces/api';
import {
  type ShowdexCalcdexSettings,
  type ShowdexHellodexSettings,
  type ShowdexPlayerTitle,
  type ShowdexSettings,
  type ShowdexSettingsGroup,
  type ShowdexSupporterTier,
  ShowdexSettingsGroups,
} from '@showdex/interfaces/app';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { getAuthUsername, getColorScheme, getSystemColorScheme } from '@showdex/utils/host';
import { writeSettingsDb } from '@showdex/utils/storage';
import { useDispatch, useSelector } from './hooks';

/**
 * In-memory storage of some Showdex asset bundles as received from the Bakedex API & cached in the IndexedDB bundles store.
 *
 * * These props are populated by the `bakeBakedexBundles()` utility from `@showdex/utils/app`.
 *   - This will fetch the latest bundles from the Bakedex API & dispatch them into Redux.
 *   - As a fallback, the pre-bundled versions will load instead if fetching fails for whatever reason.
 *   - (Opted to not perform these operations through RTK Query cause that'd needlessly complicate things!)
 *
 * @see https://github.com/doshidak/bakedex
 * @see https://bake.dex.tize.io
 * @since 1.2.4
 */
export interface ShowdexSliceBundles {
  /**
   * Bundle catalog from the Bakedex API.
   *
   * @since 1.2.4
   */
  buns: BakedexApiBunsPayload;

  /**
   * Showdex player titles.
   *
   * @since 1.2.4
   */
  titles: ShowdexPlayerTitle[];

  /**
   * Showdex supporter tiers.
   *
   * @since 1.2.4
   */
  tiers: ShowdexSupporterTier[];
}

/**
 * Primary state for the entire extension.
 *
 * @since 1.0.2
 */
export interface ShowdexSliceState {
  /**
   * Name of the currently authenticated Showdown user.
   *
   * * Note that this is populated inside the Hellodex bootstrapper, which loads as soon as Showdown starts.
   *
   * @since 1.1.3
   */
  authUsername: string;

  /**
   * Showdex settings.
   *
   * @since 1.0.2
   */
  settings: ShowdexSettings;

  /**
   * Showdex asset bundles from the Bakedex API.
   *
   * @since 1.2.4
   */
  bundles: ShowdexSliceBundles;
}

/**
 * Reducer function definitions.
 *
 * @since 1.0.2
 */
export interface ShowdexSliceReducers extends SliceCaseReducers<ShowdexSliceState> {
  /**
   * Sets the `authUsername`.
   *
   * @since 1.1.3
   */
  setAuthUsername: (
    state: Draft<ShowdexSliceState>,
    action: PayloadAction<string>,
  ) => void;

  /**
   * Sets any specified `ShowdexSettings`.
   *
   * * Also will store the dehydrated settings in `LocalStorage` via `writeLocalStorageItem()`.
   *   - Dehydration occurs via `dehydrateShowdexSettings()`.
   *   - Stored dehydrated settings won't be hydrated again until the next Showdown session.
   *
   * @since 1.0.3
   */
  updateSettings: (
    state: Draft<ShowdexSliceState>,
    action: PayloadAction<DeepPartial<ShowdexSettings>>,
  ) => void;

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
  setColorScheme: (
    state: Draft<ShowdexSliceState>,
    action: PayloadAction<Showdown.ColorSchemeOption>,
  ) => void;

  /**
   * Restores the `ShowdexSettings` back to their defaults.
   *
   * * Restored defaults will also be written to `LocalStorage` via `writeLocalStorageItem()`.
   *
   * @since 1.0.3
   */
  restoreDefaults: (
    state: Draft<ShowdexSliceState>,
    action: PayloadAction<null>,
  ) => void;

  /**
   * Sets any specified `ShowdexSliceBundles`.
   *
   * @since 1.2.4
   */
  updateBundles: (
    state: Draft<ShowdexSliceState>,
    action: PayloadAction<Partial<ShowdexSliceBundles>>,
  ) => void;
}

const l = logger('@showdex/redux/store/showdexSlice');

export const showdexSlice = createSlice<ShowdexSliceState, ShowdexSliceReducers, string>({
  name: 'showdex',

  initialState: {
    authUsername: getAuthUsername(), // won't probably exist on init btw
    settings: {
      ...DefaultShowdexSettings,
      colorScheme: getColorScheme(),
    },
    bundles: {
      buns: null,
      titles: [],
      tiers: [],
    },
  },

  reducers: {
    setAuthUsername: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      state.authUsername = action.payload || null;

      l.debug(
        'DONE', action.type,
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );
    },

    updateSettings: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

      if (!nonEmptyObject(action.payload)) {
        if (__DEV__) {
          l.warn(
            'Received an empty payload!',
            '\n', 'payload', action.payload,
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      Object.entries(action.payload).forEach(([key, value]) => {
        if (ShowdexSettingsGroups.includes(key as ShowdexSettingsGroup) && key !== 'showdex' && nonEmptyObject(value)) {
          Object.entries(value).forEach((
            [objKey, objValue]: [
              keyof ShowdexHellodexSettings | keyof ShowdexCalcdexSettings,
              // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
              ShowdexHellodexSettings[keyof ShowdexHellodexSettings] | ShowdexCalcdexSettings[keyof ShowdexCalcdexSettings],
            ],
          ) => {
            state.settings[key as keyof ShowdexSettings][objKey] = objValue;
          });

          return;
        }

        state.settings[key] = value;
      });

      const stateSnapshot = current(state);
      const { settings: updatedSettings } = stateSnapshot;

      if (nonEmptyObject(updatedSettings)) {
        void writeSettingsDb(updatedSettings);
      }

      l.debug(
        'DONE', action.type,
        '\n', 'payload', action.payload,
        '\n', 'state', __DEV__ && stateSnapshot,
      );
    },

    setColorScheme: (state, action) => {
      // l.debug(
      //   'RECV', action.type,
      //   '\n', 'action.payload', action.payload,
      //   '\n', 'state', __DEV__ && current(state),
      // );

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
        '\n', 'state', __DEV__ && current(state), // this is a proxy
      );
    },

    restoreDefaults: (state, action) => {
      // l.debug(
      //   'RECV', action,
      //   '\n', 'action.payload', action.payload, '(should be null btw)',
      //   '\n', 'state', __DEV__ && current(state),
      // );

      state.settings = {
        ...DefaultShowdexSettings,
        colorScheme: getColorScheme(),
      };

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload, '(should be null btw)',
        '\n', 'state', __DEV__ && current(state),
      );
    },

    updateBundles: (state, action) => {
      state.bundles = {
        ...state.bundles,
        ...action.payload,
      };

      l.debug(
        'DONE', action.type,
        '\n', 'state', __DEV__ && current(state),
      );
    },
  },
});

/**
 * Convenient hook to access the `authUsername`.
 *
 * @since 1.1.3
 */
export const useAuthUsername = () => useSelector((s) => s?.showdex?.authUsername);

/**
 * Convenient hook to access the `ShowdexSettings` state.
 *
 * @since 1.0.3
 */
export const useShowdexSettings = () => useSelector((s) => s?.showdex?.settings);

/**
 * Convenient hook to access the current color scheme from the `ShowdexSettings` state.
 *
 * * Note that if the user specified a `forcedColorScheme`, that will take precedence over
 *   the current `colorScheme` value.
 *
 * @since 1.0.2
 */
export const useColorScheme = () => useSelector((state) => {
  const settings = state?.showdex?.settings;

  const forcedScheme = !settings?.forcedColorScheme || settings.forcedColorScheme === 'showdown'
    ? settings?.colorScheme
    : settings?.forcedColorScheme;

  return forcedScheme || 'light';
});

/**
 * Convenient hook to access the `colorTheme` graphics setting value from the `ShowdexSettings` state.
 *
 * * This is not to be confused with `useColorScheme()`, which specifies `'light'` or `'dark'` modes.
 *
 * @since 1.2.4
 */
export const useColorTheme = () => useSelector((s) => s?.showdex?.settings?.colorTheme);

/**
 * Convenient hook to access the `grassyTerrain` graphics setting value from the `ShowdexSettings` state.
 *
 * @since 1.2.0
 */
export const useGlassyTerrain = () => useSelector((s) => s?.showdex?.settings?.glassyTerrain);

/**
 * Convenient hook to access the `ShowdexHellodexSettings` from the `ShowdexSettings` state.
 *
 * @since 1.0.3
 */
export const useHellodexSettings = () => useSelector((s) => s?.showdex?.settings?.hellodex);

/**
 * Convenient hook to access the `ShowdexCalcdexSettings` from the `ShowdexSettings` state.
 *
 * @since 1.0.3
 */
export const useCalcdexSettings = () => useSelector((s) => s?.showdex?.settings?.calcdex);

/**
 * Convenient hook to access the `ShowdexHonkdexSettings` from the `ShowdexSettings` state.
 *
 * @since 1.2.0
 */
export const useHonkdexSettings = () => useSelector((s) => s?.showdex?.settings?.honkdex);

/**
 * Convenient hook to access the `ShowdexShowdownSettings` from the `ShowdexSettings` state.
 *
 * @since 1.1.7
 */
export const useShowdexShowdownSettings = () => useSelector((s) => s?.showdex?.settings?.showdown);

/**
 * Convenient hook to update the `ShowdexSettings` by dispatching the `updateSettings` action.
 *
 * @since 1.0.3
 */
export const useUpdateSettings = () => {
  const dispatch = useDispatch();

  return (
    settings: DeepPartial<ShowdexSettings>,
  ): void => void dispatch(showdexSlice.actions.updateSettings(settings));
};

/**
 * Convenient hook to reset the `ShowdexSettings` to their defaults.
 *
 * @since 1.0.3
 */
export const useRestoreDefaults = () => {
  const dispatch = useDispatch();

  return (): void => void dispatch(showdexSlice.actions.restoreDefaults(null));
};

/**
 * Convenient hook to access the `ShowdexSliceBundles`.
 *
 * @since 1.2.4
 */
export const useShowdexBundles = () => useSelector((s) => s?.showdex?.bundles);

/**
 * Convenient hook to update the `ShowdexSliceBundles`.
 *
 * @since 1.2.4
 */
export const useUpdateBundles = () => {
  const dispatch = useDispatch();

  return (
    bundles: Partial<ShowdexSliceBundles>,
  ): void => void dispatch(showdexSlice.actions.updateBundles(bundles));
};
