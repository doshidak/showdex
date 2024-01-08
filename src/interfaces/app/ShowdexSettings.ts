import { type ShowdexCalcdexSettings } from './ShowdexCalcdexSettings';
import { type ShowdexHellodexSettings } from './ShowdexHellodexSettings';
import { type ShowdexHonkdexSettings } from './ShowdexHonkdexSettings';
import { type ShowdexShowdownSettings } from './ShowdexShowdownSettings';

/**
 * Extension-wide settings.
 *
 * @since 1.0.2
 */
export interface ShowdexSettings {
  /**
   * Language locale that Showdex should appear in.
   *
   * @default 'en'
   * @since 1.2.1
   */
  locale: string;

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
   * Tastefully blurs the background of all Showdex panels.
   *
   * * This includes the Calcdex battle overlay, which will slightly show the chat behind it.
   * * Due to the background blur being expensive to paint (potentially causing some lag), this setting is opt-in.
   * * ...& about the name, couldn't resist, sorry.
   *
   * @default false
   * @since 1.2.0
   */
  glassyTerrain: boolean;

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
   * Honkdex-specific settings.
   *
   * @since 1.2.0
   */
  honkdex: ShowdexHonkdexSettings;

  /**
   * Showdown-specific settings.
   *
   * @since 1.1.7
   */
  showdown: ShowdexShowdownSettings;
}
