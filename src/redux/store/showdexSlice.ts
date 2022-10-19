import { createSlice, current } from '@reduxjs/toolkit';
import { getSystemColorScheme } from '@showdex/utils/app';
import { getStoredItem, setStoredItem } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { dehydrateShowdexSettings, hydrateShowdexSettings } from '@showdex/utils/redux';
import type { Draft, PayloadAction, SliceCaseReducers } from '@reduxjs/toolkit';
import type { SmogonMatchupNhkoColors, SmogonMatchupNhkoLabels } from '@showdex/utils/calc';
import type { CalcdexPlayerKey, CalcdexRenderMode } from './calcdexSlice';
import { useDispatch, useSelector } from './hooks';

/**
 * Extension-wide settings.
 *
 * @since 1.0.2
 */
export interface ShowdexSettings {
  /**
   * Current color scheme.
   *
   * @default 'light'
   * @since 1.0.2
   */
  colorScheme: Showdown.ColorScheme;

  /**
   * Forced color scheme, regardless of the color scheme set in Showdown.
   *
   * * Set this to `'showdown'` (default) to use the color scheme set in Showdown.
   *
   * @default 'showdown'
   * @since 1.0.3
   */
  forcedColorScheme: 'showdown' | Showdown.ColorScheme;

  /**
   * Whether advanced developer options should be available to the user.
   *
   * @deprecated As of v1.0.3, this currently does nothing.
   * @default false
   * @since 1.0.3
   */
  developerMode: boolean;

  /**
   * Hellodex-specific settings.
   *
   * @since 1.0.3
   */
  hellodex: ShowdexHellodexSettings;

  /**
   * Calcdex-specific settings.
   *
   * @since 1.0.3
   */
  calcdex: ShowdexCalcdexSettings;
}

/**
 * Hellodex-specific settings.
 *
 * @since 1.0.3
 */
export interface ShowdexHellodexSettings {
  /**
   * Whether the Hellodex should automatically open when Showdown starts.
   *
   * @default true
   * @since 1.0.3
   */
  openOnStart: boolean;

  /**
   * Whether to focus the `RoomsRoom` (main menu) instead of the Hellodex when Showdown starts.
   *
   * @default false
   * @since 1.0.3
   */
  focusRoomsRoom: boolean;
}

/**
 * Calcdex-specific settings.
 *
 * @since 1.0.3
 */
export interface ShowdexCalcdexSettings {
  /**
   * How the Calcdex should automatically open once a battle starts.
   *
   * * `'always'` (default) will open the Calcdex for battles where the user is `'playing'` or `'spectating'`.
   * * `'playing'` will only open the Calcdex if the logged-in user is also a player in the battle.
   * * `'spectating'` will only open the Calcdex if the user is spectating a battle.
   * * `'never'` will completely disable the Calcdex, making this extension kinda useless.
   *
   * @default 'always'
   * @since 1.0.3
   */
  openOnStart: 'always' | 'playing' | 'spectating' | 'never';

  /**
   * How the Calcdex should open when opened.
   *
   * * `'showdown'` (default) will open the Calcdex based on the panel layout in Showdown's graphic settings.
   *   - Left-right panels will use `'overlay'`.
   *   - Single panel will use `'panel'`.
   *   - Similar functionality to `forcedColorScheme` in the `ShowdexSettings`.
   * * `'panel'` will open the Calcdex in its own panel.
   * * `'overlay'` will open the Calcdex as an overlay over the battle chat.
   *   - Useful for single-panel mode users or those who are annoyed by the accumulating tabs when set to `'panel'`.
   *   - In this mode, a button will be added next to the battle timer to open the Calcdex.
   *
   * @default 'showdown'
   * @since 1.0.3
   */
  openAs: 'showdown' | CalcdexRenderMode;

  /**
   * How the Calcdex panel tab automatically closes.
   *
   * * `'battle-end'` will close the Calcdex panel tab when the battle ends.
   * * `'battle-tab'` will close the Calcdex panel tab when the user closes the battle tab.
   *   - More specifically, we'll be hooking into the `BattleRoom`'s `onRequestLeave()`
   *     (invoked by `app.leaveRoom()`, which is invoked by the user clicking the "X" button)
   *     to detect when the user closes the battle tab (as opposed to switching to another tab).
   *   - This is probably more safe than directly hooking into the globally used `app.leaveRoom()`.
   * * `'never'` refers to the automatic closing mechanism.
   *   - Users will still be able to close the tab *manually*!
   * * Has no effect if `openAs` is `'overlay'`.
   *
   * @default 'battle-tab'
   * @since 1.0.4
   */
  closeOn: 'battle-end' | 'battle-tab' | 'never';

  /**
   * Whether the Calcdex should be destroyed from the Redux state when the panel tab is closed.
   *
   * * If `true`, Calcdex won't be able to be reopened once closed.
   * * Enabling this may help with performance, especially with multiple Calcdexes in a single Showdown session.
   * * This also applies if `closeOnEnd` is `true`.
   * * Has no effect if `openAs` is `'overlay'`.
   *
   * @default true
   * @since 1.0.3
   */
  destroyOnClose: boolean;

  /**
   * Whether to perserve the component rendering states of an overlayed Calcdex by hiding instead of blocking renders.
   *
   * * If `true` (default), will simply slap a `display: none;` instead of returning `null`,
   *   allowing for instantaneous opening and closing.
   * * If `false`, there may be a noticeable delay when reopening the Calcdex overlay as the components
   *   reinitialize their states.
   * * Has no effect if `openAs` is `'panel'` (default).
   *
   * @default true
   * @since 1.0.3
   */
  preserveRenderStates: boolean;

  /**
   * Default auto-select settings per side.
   *
   * * `auth` pertains to whichever side the logged-in user is playing as.
   *   - Will override the side's setting that `auth` pertains to with the value of `auth`.
   * * Though `p3` and `p4` are defined, they currently aren't being used.
   *
   * @default
   * ```ts
   * {
   *   auth: true,
   *   p1: true,
   *   p2: true,
   *   p3: true,
   *   p4: true,
   * }
   * ```
   * @since 1.0.3
   */
  defaultAutoSelect: Record<'auth' | CalcdexPlayerKey, boolean>;

  /**
   * Whether to show player ratings if they're available.
   *
   * @default true
   * @since 1.0.3
   */
  showPlayerRatings: boolean;

  /**
   * Position that the logged-in player should always be at.
   *
   * * `'auto'` will use the side that the logged-in player is in the battle.
   *   - If the logged-in player is `p1`, they will be on the `'top'`.
   *   - If the logged-in player is `p2`, they will be on the `'bottom'`.
   * * Has no effect if the logged-in user is spectating a battle, obviously.
   *
   * @default 'top'
   * @since 1.0.3
   */
  authPosition: 'top' | 'bottom' | 'auto';

  /**
   * Whether to show Pokemon nicknames.
   *
   * * If `false` (default), the Pokemon's current `speciesForme` will be shown instead.
   * * Note that if this is `true`, the only way to see the Pokemon's current `speciesForme` is through the tooltip.
   *   - Mostly pertains to Pokemon with switchable `altFormes`.
   *
   * @default false
   * @since 1.0.3
   */
  showNicknames: boolean;

  /**
   * Whether to reverse the functionality of the Pokemon's icon and name when clicked on.
   *
   * * If `false` (default), the functionality will be as follows:
   *   - Clicking on the icon will open the Pokemon's *Smogon University* page.
   *   - Clicking on the name will switch the Pokemon's current `speciesForme` if it has defined `altFormes`.
   * * If `true`, the functionality will be switched as follows:
   *   - Clicking on the icon will switch the Pokemon's current `speciesForme` if it has defined `altFormes`.
   *   - Clicking on the name will open the Pokemon's *Smogon University* page.
   *
   * @default false
   * @since 1.0.3
   */
  reverseIconName: boolean;

  /**
   * Whether to allow all possible formes to be switched to, if any, even if a forme is revealed.
   *
   * @default true
   * @since 1.0.3
   */
  showAllFormes: boolean;

  /**
   * Whether to show all possible abilities/items/moves in legal-locked formats.
   *
   * @default false
   * @since 1.0.3
   */
  showAllOptions: boolean;

  /**
   * Whether to show "N/A" damage ranges, which are typically from status moves.
   *
   * * Disabling this will prevent the matchup tooltip from appearing,
   *   even though it'll say 0 damage lol.
   *
   * @default true
   * @since 1.0.3
   */
  showNonDamageRanges: boolean;

  /**
   * Whether to download Smogon sets.
   *
   * * Does not include Smogon sets for Randoms.
   *   - Actually a separate setting: `downloadRandomsPresets`.
   * * Disabling this may improve performance.
   *
   * @default true
   * @since 1.0.3
   */
  downloadSmogonPresets: boolean;

  /**
   * Whether to download Randoms sets.
   *
   * * Disabling this may *slightly* improve performance.
   *
   * @default true
   * @since 1.0.3
   */
  downloadRandomsPresets: boolean;

  /**
   * Whether to download Showdown usage stats.
   *
   * * Disabling this may *slightly* improve performance.
   *
   * @default true
   * @since 1.0.3
   */
  downloadUsageStats: boolean;

  /**
   * Whether the first preset applied to the Pokemon should be from the Showdown usage stats.
   *
   * * Has no effect if `downloadUsageStats` is `false`.
   *
   * @default false
   * @since 1.0.3
   */
  prioritizeUsageStats: boolean;

  /**
   * Whether local Teambuilder presets should be included.
   *
   * * If disabled, the Pokemon's spread will be guessed, which may lead to Chinese EVs/IVs and an incorrect nature.
   *
   * @deprecated As of v1.0.3, this currently does nothing.
   * @default true
   * @since 1.0.3
   */
  includeTeambuilder: boolean;

  /**
   * Whether to auto-export the opponent's team to the Teambuilder once the battle ends.
   *
   * * If `true`, will be exported to its own Teambuilder folder called "Showdex".
   *
   * @deprecated As of v1.0.3, this currently does nothing.
   * @default false
   * @since 1.0.3
   */
  autoExportOpponent: boolean;

  /**
   * Default auto-move selection per side.
   *
   * * Despite the `autoMoves` setting pertaining to each Pokemon, the determined setting will be set for
   *   every Pokemon in the side, functioning more as the initial value.
   *   - User should be able to tweak the `autoMoves` setting for each individual Pokemon afterwards.
   * * `auth` pertains to whichever side the logged-in user is playing as.
   *   - Will override the side's setting that `auth` pertains to with the value of `auth`.
   * * Though `p3` and `p4` are defined, they currently aren't being used.
   *
   * @default
   * ```ts
   * {
   *   auth: false,
   *   p1: true,
   *   p2: true,
   *   p3: true,
   *   p4: true,
   * }
   * ```
   * @since 1.0.3
   */
  defaultAutoMoves: Record<'auth' | CalcdexPlayerKey, boolean>;

  /**
   * Default EVs/IVs visibility per side.
   *
   * * Despite the `showGenetics` setting pertaining to each Pokemon, the determined setting will be set for
   *   every Pokemon in the side, functioning more as the initial value.
   *   - User should be able to tweak the `showGenetics` setting for each individual Pokemon afterwards.
   * * `auth` pertains to whichever side the logged-in player is playing as.
   *   - Will override the side's setting that `auth` pertains to with the value of `auth`.
   * * Though `p3` and `p4` are defined, they currently aren't being used.
   *
   * @default
   * ```ts
   * {
   *   auth: false,
   *   p1: true,
   *   p2: true,
   *   p3: true,
   *   p4: true,
   * }
   * ```
   * @since 1.0.3
   */
  defaultShowGenetics: Record<'auth' | CalcdexPlayerKey, boolean>;

  /**
   * Whether to show UI tooltips.
   *
   * @default true
   * @since 1.0.4
   */
  showUiTooltips: boolean;

  /**
   * Whether to show the ability tooltip.
   *
   * @default true
   * @since 1.0.3
   */
  showAbilityTooltip: boolean;

  /**
   * Whether to show the item tooltip.
   *
   * @default true
   * @since 1.0.3
   */
  showItemTooltip: boolean;

  /**
   * Whether to show the move tooltip.
   *
   * @default true
   * @since 1.0.3
   */
  showMoveTooltip: boolean;

  /**
   * Whether to show the matchup tooltip containing the result description.
   *
   * @default true
   * @since 1.0.3
   */
  showMatchupTooltip: boolean;

  /**
   * Whether to format the matchup result description to be easier to read.
   *
   * * Has no effect if `showMatchupTooltip` is `false`.
   *
   * @default true
   * @since 1.0.3
   */
  prettifyMatchupDescription: boolean;

  /**
   * When to show possible damage amounts in the matchup tooltip.
   *
   * * Has no effect if `showMatchupTooltip` is `false`.
   * * `'nfe'` will only show the possible damage amounts against Pokemon who are NFE (Not Fully Evolved).
   *
   * @default 'nfe'
   * @since 1.0.3
   */
  showMatchupDamageAmounts: 'always' | 'nfe' | 'never';

  /**
   * Whether to format the damage amounts as percentages.
   *
   * * Percentages should only be shown if there are 5 or less unique damage amounts.
   *   - Otherwise, each amount would have some small percentage, making it really dense to quickly read!
   *   - Why 5? Completely arbitrary, but probably a safe bet to distinguish those of many repeats from uniques.
   *   - (If you find that exact number to be a bad idea, don't forget to update `formatDamageAmounts()`!)
   * * Has no effect if `showMatchupDamageAmounts` is `'never'`.
   *
   * @default true
   * @since 1.0.4
   */
  formatMatchupDamageAmounts: boolean;

  /**
   * Whether to allow the matchup result description to be copied to the clipboard when clicked.
   *
   * * Has no effect if `showMatchupTooltip` is `false`.
   * * Copied matchup result description will be unformatted regardless of the value of `prettifyMatchupDescription`.
   * * If `showMatchupDamageAmounts` is `'always'` or `'nfe'` (default), the possible damage amounts will also be copied to the clipboard.
   *
   * @default true
   * @since 1.0.3
   */
  copyMatchupDescription: boolean;

  /**
   * Whether to show tooltips for field conditions in `FieldCalc`.
   *
   * * This one setting applies to all tooltips for screens, weather, and terrain.
   *
   * @default true
   * @since 1.0.3
   */
  showFieldTooltips: boolean;

  /**
   * Colors for the NHKO values, up to 4HKO.
   *
   * * Any value after 4HKO will use the last defined color in the array.
   * * Note that the first index at `0` pertains to the 1HKO color.
   * * Any valid CSS color representation (e.g., `rgba()`, `hsla()`, etc.) are acceptable values.
   *
   * @default
   * ```ts
   * [
   *   '#4CAF50', // 1HKO (green)
   *   '#FF9800', // 2HKO (orange)
   *   '#FF9800', // 3HKO (orange)
   *   '#F44336', // 4HKO (red)
   *   '#F44336', // 5+HKO (red)
   * ]
   * ```
   * @since 1.0.3
   */
  nhkoColors: SmogonMatchupNhkoColors;

  /**
   * Labels for the NHKO values, up to 4HKO.
   *
   * * Any value after 4HKO will be displayed in the format `<n>HKO`, where `<n>` is the number of hits before KO.
   * * Maximum accepted length should be `8` characters, in order to discourage long NHKO names that overflow to the next line.
   *   - Essentially this enforcement will make sure each move takes up a single line, instead of two or more.
   *   - However, percentages may be shown (e.g., `'69.5% 1HKO'`), which may cause the text to overflow onto the next line.
   * * Note that the first index at `0` pertains to the 1HKO label.
   *
   * @default
   * ```ts
   * [
   *   '1HKO',
   *   '2HKO',
   *   '3HKO',
   *   '4HKO',
   * ]
   * ```
   * @since 1.0.3
   */
  nhkoLabels: SmogonMatchupNhkoLabels;
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
   * Sets any specified `ShowdexSettings`.
   *
   * * Also will store the dehydrated settings in `LocalStorage` via `setStoredItem()`.
   *   - Dehydration occurs via `dehydrateShowdexSettings()`.
   *   - Stored dehydrated settings won't be hydrated again until the next Showdown session.
   *
   * @since 1.0.3
   */
  updateSettings: (state: Draft<ShowdexSliceState>, action: PayloadAction<DeepPartial<ShowdexSettings>>) => void;

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

  /**
   * Restores the `ShowdexSettings` back to their defaults.
   *
   * * Restored defaults will also be written to `LocalStorage` via `setStoredItem()`.
   *
   * @since 1.0.3
   */
  restoreDefaults: (state: Draft<ShowdexSliceState>, action: PayloadAction<null>) => void;
}

const l = logger('@showdex/redux/store/showdexSlice');

export const showdexSlice = createSlice<ShowdexSliceState, ShowdexSliceReducers, string>({
  name: 'showdex',

  initialState: {
    settings: hydrateShowdexSettings(getStoredItem('storage-settings-key')),
  },

  reducers: {
    updateSettings: (state, action) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
      );

      if (!Object.keys(action.payload || {}).length) {
        if (__DEV__) {
          l.warn(
            'Received an empty action.payload!',
            '\n', 'action.payload', action.payload,
            '\n', '(You will only see this warning on development.)',
          );
        }

        return;
      }

      Object.entries(action.payload).forEach(([key, value]) => {
        if (['hellodex', 'calcdex'].includes(key) && typeof value === 'object' && Object.keys(value).length) {
          Object.entries(value).forEach((
            [objKey, objValue]: [
              keyof ShowdexHellodexSettings | keyof ShowdexCalcdexSettings,
              ShowdexHellodexSettings[keyof ShowdexHellodexSettings] | ShowdexCalcdexSettings[keyof ShowdexCalcdexSettings],
            ],
          ) => {
            state.settings[<keyof ShowdexSettings> key][objKey] = objValue;
          });

          return;
        }

        state.settings[key] = value;
      });

      const stateSnapshot = current(state);
      const dehydratedSettings = dehydrateShowdexSettings(stateSnapshot.settings);

      if (dehydratedSettings) {
        setStoredItem('storage-settings-key', dehydratedSettings);
      }

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && stateSnapshot,
      );
    },

    setColorScheme: (state, action) => {
      l.debug(
        'RECV', action.type,
        '\n', 'action.payload', action.payload,
        '\n', 'state', __DEV__ && current(state),
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
        '\n', 'state', __DEV__ && current(state), // this is a proxy
      );
    },

    restoreDefaults: (state, action) => {
      l.debug(
        'RECV', action,
        '\n', 'action.payload', action.payload, '(should be null btw)',
        '\n', 'state', __DEV__ && current(state),
      );

      // defaults are stored in hydrateShowdexSettings(),
      // which is returned by passing in no args
      const defaultSettings = hydrateShowdexSettings();

      // hydrateShowdexSettings() creates a new object every time,
      // so no worries about deep-copying here (I say that now tho...)
      state.settings = defaultSettings;

      l.debug(
        'DONE', action.type,
        '\n', 'action.payload', action.payload, '(should be null btw)',
        '\n', 'state', __DEV__ && current(state),
      );
    },
  },
});

/**
 * Convenient hook to access the `ShowdexSettings` state.
 *
 * @since 1.0.3
 */
export const useShowdexSettings = () => useSelector(
  (state) => state?.showdex?.settings,
);

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
 * Convenient hook to access the `ShowdexHellodexSettings` from the `ShowdexSettings` state.
 *
 * @since 1.0.3
 */
export const useHellodexSettings = () => useSelector(
  (state) => state?.showdex?.settings?.hellodex,
);

/**
 * Convenient hook to access the `ShowdexCalcdexSettings` from the `ShowdexSettings` state.
 *
 * @since 1.0.3
 */
export const useCalcdexSettings = () => useSelector(
  (state) => state?.showdex?.settings?.calcdex,
);

/**
 * Convenient hook to update the `ShowdexSettings` by dispatching the `updateSettings` action.
 *
 * @since 1.0.3
 */
export const useUpdateSettings = () => {
  const dispatch = useDispatch();

  return (settings: DeepPartial<ShowdexSettings>) => dispatch(
    showdexSlice.actions.updateSettings(settings),
  );
};

/**
 * Convenient hook to reset the `ShowdexSettings` to their defaults.
 *
 * @since 1.0.3
 */
export const useRestoreDefaults = () => {
  const dispatch = useDispatch();

  return () => dispatch(
    showdexSlice.actions.restoreDefaults(null),
  );
};
