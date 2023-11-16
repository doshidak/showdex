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

  /**
   * Whether to show the win/loss counter.
   *
   * @default true
   * @since 1.0.6
   */
  showBattleRecord: boolean;

  /**
   * Whether to show the donate button.
   *
   * * This is a hidden setting that is only visible to Showdown usernames assigned to a title.
   *   - List of usernames can be found in `ShowdexPlayerTitles` from `@showdex/consts/app`.
   *   - For instance, donators would be assigned a title, so they'd be able to hide it since they've
   *     donated before, duh.
   * * Purposefully only checking this setting when rendering the button, so users can technically
   *   import this setting as `false` even if they don't have a title assigned.
   *   - i.e., Hellodex won't check if the user has a title, only this setting's value.
   *   - I mean, if you went through all that trouble to hide the button, then you deserve it lmao.
   * * Note that the donate button won't be shown if the value of the `HELLODEX_DONATION_URL`
   *   environment variable doesn't contain a valid URL.
   *
   * @default true
   * @since 1.1.2
   */
  showDonateButton: boolean;
}
