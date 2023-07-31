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
   * Player title icon color.
   *
   * * If unspecified, will fallback to using `color`.
   *
   * @since 1.1.5
   */
  iconColor?: Partial<Record<Showdown.ColorScheme, string>>;

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
  supporterId: null,
  custom: false,
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
  supporterId: null,
  custom: true,
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
  title: 'Showdex Royalty',
  supporterId: null,
  custom: false,
  icon: 'crown',
  iconDescription: 'Crown Icon',

  color: {
    light: '#F57F17',
    dark: '#FFB300',
  },

  userIds: [
    'agentlag', // Lazosful
    'dbkeith',
    ['finchinator', 'Our Lord and Savior'],
    'heavancanwait', // DBKEITH
    'lesarlags', // Lazosful
    'l4z0s', // Lazosful
    ['mudkipnerd', "What's a King to a God"],
    'mypaloalto', // DBKEITH
    ['nails', 'VGC Legend'],
    'nathaneatschicken', // NathanLikesChicken
    'woahhhchien', // DBKEITH
  ],
}, {
  title: 'Paid Pal',
  supporterId: 'donor',
  custom: false,
  icon: 'sparkle',
  iconDescription: 'Sparkle Icon',

  color: {
    light: '#6A1B9A',
    dark: '#9C27B0',
  },

  userIds: [
    'bongphan',
    'doublecaret',
    ['fr1e5', 'First Paid Pal'],
    'fubwubs',
    'genone',
    'goldengottago',
    'joshtheking7',
    'lunarvania',
    'momalaharris',
    'pastgenoufan',
    'pokepastry',
    'weavileisasin',
  ],
}, {
  title: 'Blaziken Patron',
  supporterId: 'patreon-tier-01',
  custom: false,
  icon: 'fire',
  iconDescription: 'Fire Icon',

  color: {
    light: '#C62828',
    dark: '#F44336',
  },

  userIds: [
    ['bruhmomentmaker', 'First Blaziken Patron'],
    'thenexyr',
    'nexyralt',
  ],
}, {
  title: 'Pop Bomb Patron',
  supporterId: 'patreon-tier-02',
  custom: false,
  icon: 'mouse',
  iconDescription: 'Mouse Icon',

  color: {
    light: '#0277BD',
    dark: '#29B6F6',
  },

  userIds: [
    ['benzyne', 'First Showdex Patron'],
  ],
}, {
  title: 'Supreme Overlord Patron',
  supporterId: 'patreon-tier-03',
  custom: false,
  icon: 'winged-sword',
  iconDescription: 'Winged Sword Icon',

  color: {
    light: '#F57F17',
    dark: '#FFB300',
  },

  userIds: [
    'zzodz',
  ],
}, {
  title: 'First Supreme Overlord',
  supporterId: 'patreon-tier-03',
  custom: true,
  icon: 'dragon',
  iconDescription: 'Dragon Head Icon',

  color: {
    light: '#D5AD1C',
    dark: '#FFC800',
  },

  iconColor: {
    light: '#FF6F00',
    dark: '#FF6F00',
  },

  userIds: [
    'dastardlydwarf',
  ],
}, {
  title: 'Aww what a cute teddy bear! <3 uwu',
  supporterId: 'patreon-tier-03',
  custom: true,
  icon: 'teddy-bear',
  iconDescription: 'Teddy Bear Icon',

  color: {
    light: '#F06292',
    dark: '#F06292',
  },

  userIds: [
    ['goddessmina', 'warning: ratch af'],
  ],
}];
