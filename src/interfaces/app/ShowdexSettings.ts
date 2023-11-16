import { type ShowdexCalcdexSettings } from './ShowdexCalcdexSettings';
import { type ShowdexHellodexSettings } from './ShowdexHellodexSettings';
import { type ShowdexShowdownSettings } from './ShowdexShowdownSettings';

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

  /**
   * Showdown-specific settings.
   *
   * @since 1.1.7
   */
  showdown: ShowdexShowdownSettings;
}
