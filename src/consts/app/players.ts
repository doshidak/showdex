/**
 * Special title with special formatting for the special `usernames`.
 *
 * * Do not include the file extension for `icon`!
 *   - e.g., `'check-circle'` instead of `'check-circle.svg'`.
 * * `iconDescription` will be the value of the `<desc>` tag in the icon `<svg>`.
 * * Each user specified in `userIds` should have their username parsed through `formatId()`.
 *   - e.g., `formatId('showdex_testee')` becomes `'showdextestee'`,
 *     which should be the value in `userIds`.
 * * For a user-specific title, specify an tuple instead of a `string` in `userIds`.
 *   - e.g., If the original `title` was `'Tester'`, a tuple of `['showdextestee', 'Testee']`
 *     will apply the `'Testee'` as the `title` (with the same `icon` and `color`) to user ID `'showdextestee'`.
 *
 * @since 1.1.1
 */
export interface ShowdexPlayerTitle {
  title: string;
  icon?: string;
  iconDescription?: string;
  color?: Partial<Record<Showdown.ColorScheme, string>>;
  userIds: (string | [userId: string, title: string])[];
}

/**
 * Special player titles.
 *
 * * Not recommended you access this directly.
 *   - Use `findPlayerTitle()` from `@showdex/utils/app` instead!
 * * Yes, this is hardcoded.
 *
 * @since 1.1.1
 */
export const ShowdexPlayerTitles: ShowdexPlayerTitle[] = [{
  title: 'Verified Showdex Tester',
  icon: 'flask',
  iconDescription: 'Flask Icon',

  color: {
    light: '#009688',
    dark: '#26A69A',
  },

  userIds: [
    'camdawgboi',
    ['showdextestee', 'Verified Showdex Testee'],
    'showdextester',
    'sumfuk',
  ],
}, {
  title: 'Bunny Hopper',
  icon: 'rabbit',
  iconDescription: '"Bunny" Icon',

  color: {
    light: '#AD1457',
    dark: '#D81B60',
  },

  userIds: [
    ['ttoki', 'twitch.tv/tt0ki'],
  ],
}, {
  title: 'Royalty',
  icon: 'crown',
  iconDescription: 'Crown Icon',

  color: {
    light: '#F57F17',
    dark: '#FFB300',
  },

  userIds: [
    ['finchinator', 'Our Lord and Savior'],
    ['mudkipnerd', "What's a King to a God"],
    ['nails', 'VGC Legend'],
  ],
}, {
  title: 'Showdex Supporter',
  icon: 'sparkle',
  iconDescription: 'Sparkle Icon',

  color: {
    light: '#6A1B9A',
    dark: '#9C27B0',
  },

  /** @todo add donators' usernames to this list */
  userIds: [],
}];
