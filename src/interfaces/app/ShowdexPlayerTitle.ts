/**
 * Special title with special formatting for the special `usernames`.
 *
 * @since 1.1.1
 */
export interface ShowdexPlayerTitle {
  /**
   * Base player title.
   *
   * * Can be overwritten on a per-user basis by specifying a tuple element in `userIds[]`.
   *
   * @since 1.1.1
   */
  title: string;

  /**
   * Linked `ShowdexSupporterTier` by its `id`.
   *
   * * As mentioned in the notes for the `id` property in the `ShowdexSupporterTier` interface,
   *   this is primarily used for styling non-Showdown user IDs in the `PatronagePageRenderer`.
   * * This is optional; most titles probably won't have this populated.
   *
   * @since 1.1.6
   */
  supporterId?: string;

  /**
   * Whether this is a custom player title.
   *
   * * Primarily used for distinguishing official titles from custom Patreon titles.
   *   - Custom Patreon titles are offered to our highest tier *Supreme Overlord* patrons.
   * * If `true`, a specialized tooltip will be displayed in the `PatronageTierRenderer`.
   *   - Not currently being used anywhere else, I don't think.
   *
   * @since 1.1.6
   */
  custom?: boolean;

  /**
   * Filename of the player title icon.
   *
   * * Do **not** include the file extension!
   *   - e.g., `'check-circle'` instead of `'check-circle.svg'`.
   * * Filename must be a SVG in `src/assets/icons`.
   *   - Don't forget that assets must also be defined in the `manifest.json`.
   *
   * @since 1.1.1
   */
  icon?: string;

  /**
   * Description of the player title icon.
   *
   * * If specified, will be set as the `children` of the `<desc>` tag in the icon's `<svg>`.
   * * Primarily used for ARIA (accessibility) purposes, particularly for screen-readers.
   *   - Is Showdex ADA-compliant? Not really, but doesn't hurt!
   *
   * @since 1.1.1
   */
  iconDescription?: string;

  /**
   * Player title color.
   *
   * * Applies to both the icon & the player's name, unless `iconColor` is also defined.
   * * This is an object with `light` & `dark` colors.
   *
   * @since 1.1.1
   */
  color?: Partial<Record<Showdown.ColorScheme, string>>;

  /**
   * Whether to apply the `color` as a glowing color.
   *
   * * Actual text color will be white on both light & dark modes.
   *
   * @since 1.2.3
   */
  colorGlow?: boolean;

  /**
   * Player title icon color.
   *
   * * If unspecified, will fallback to using `color`.
   *
   * @since 1.1.5
   */
  iconColor?: Partial<Record<Showdown.ColorScheme, string>>;

  /**
   * Whether to apply the `iconColor` as a glowing color.
   *
   * * Actual icon color will be white on both light & dark modes.
   *
   * @since 1.2.3
   */
  iconColorGlow?: boolean;

  /**
   * IDs of Showdown users that are assigned to the player title.
   *
   * * Each user specified in `userIds` should have their username parsed through `formatId()`.
   *   - e.g., `formatId('showdex_testee')` becomes `'showdextestee'`,
   *     which should be the value in `userIds`.
   * * For a user-specific title, specify an tuple instead of a `string` in `userIds`.
   *   - e.g., If the original `title` was `'Tester'`, a tuple of `['showdextestee', 'Testee']`
   *     will apply the `'Testee'` as the `title` (with the same `icon` and `color`) to user ID `'showdextestee'`.
   *
   * @since 1.1.1
   */
  userIds: (string | [userId: string, title: string])[];
}
