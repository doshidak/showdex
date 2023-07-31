/**
 * Term of the supporter tier.
 *
 * @since 1.1.6
 */
export type ShowdexSupporterTierTerm =
  | 'once'
  | 'monthly';

/**
 * Supporter tier & its members.
 *
 * * Primarily only used by the `PatronagePane` in the Hellodex.
 * * Actual player titles are assigned in `players.ts`.
 *
 * @since 1.1.3
 */
export interface ShowdexSupporterTier {
  /**
   * Unique ID of the supporter tier.
   *
   * * Primarily used to link a `ShowdexPlayerTitle` to a `ShowdexSupporterTier`,
   *   particularly in instances where the user's name is **not** a Showdown user ID.
   *   - `findPlayerTitle()` won't know which styling to apply for non-Showdown user IDs
   *     in the `PatronagePageRenderer`.
   *
   * @example 'tier-3-pokemane-sub'
   * @since 1.1.6
   */
  id?: string;

  /**
   * Name of the supporter tier.
   *
   * @example 'Tier 3 Pokemane Sub'
   * @since 1.1.3
   */
  title: string;

  /**
   * Term of the supporter tier.
   *
   * @default 'monthly'
   * @since 1.1.6
   */
  term?: ShowdexSupporterTierTerm;

  /**
   * Names/usernames of individuals within the supporter tier.
   *
   * * If the element is a `string` (& not the `[name, user?, start?, end?]` tuple),
   *   the name will be implicitly treated as if `user` is `false`.
   * * When the `term` of the tier is `'once'`, the `start` & `end` elements of the tuple
   *   will be ignored as it only applies to `'monthly'` terms.
   * * When the `term` is `'monthly'` & the `end` element is specified, the name will
   *   appear faded in the `PatronagePane`.
   *   - More specifically, the opacity of the name will be set to `0.5` (i.e., 50%).
   * * For tuple elements in `names`, the `start` & `end` elements are both ISO 8601 date strings.
   *   - For `'once'` terms, only the `start` date is used to display the date of donation.
   *     (If `end` is provided for whatever reason, it will be ignored.)
   *   - For `'monthly' terms, the length of the term is determined by the `start` date up until
   *     the build date (`process.env.BUILD_DATE`) or the `end` date, whichever comes first.
   * * Specify the `user` value in the tuple as `true` if the `name` is a Showdown username.
   *   - This will allow the user's profile to appear when clicked on via `openUserPopup()`.
   *   - This logic also occurs in `PatronagePane`.
   *
   * @example
   * ```ts
   * [
   *   'Active Patron', // by default for strings, user = false (implicit)
   *   ['Another Active Patron', false], // user = false (explicit)
   *   ['ActivePatronUsername', true, '2023-04-20T04:20:00Z'], // user = true (explicit)
   *   ['InactivePatron', null, '2023-04-20T04:20:00Z', '2023-04-21T16:20:00Z'], // user = false (implicit)
   *   ['InactivePatronUsername', true, '2023-04-20T04:20:00Z', '2023-04-21T16:20:00Z'], // user = true (explicit)
   * ]
   * ```
   * @since 1.1.3
   */
  names: (string | [name: string, user?: boolean, start?: string, end?: string])[];
}

/**
 * List of PayPal donors.
 *
 * @since 1.1.3
 */
export const ShowdexDonorTiers: ShowdexSupporterTier[] = [{
  id: 'donor',
  title: 'Paid Pals',
  term: 'once',
  names: [
    ['Angie L', false, '2022-12-31T23:26:59Z'],
    ['Fubwubs', true, '2022-12-31T06:38:03Z'],
    ['Timothy B', false, '2023-03-09T00:08:19Z'],
    ['PastGenOUFan', true, '2023-05-11T01:52:57Z'],
    ['joshtheking7', true, '2023-05-17T22:21:31Z'],
    ['Michael L', false, '2022-11-09T05:17:33Z'],
    ['Bongphan', true, '2023-04-17T23:56:43Z'],
    ['GenOne', true, '2023-03-18T20:56:43Z'],
    ['Lunarvania', true, '2022-12-30T19:24:14Z'],
    ['Leman T', false, '2022-12-01T20:08:37Z'],
    ['Sunny B', false, '2023-01-03T16:12:09Z'],
    ['Peter T', false, '2023-01-30T03:50:05Z'],
    ['Sam P', false, '2023-05-08T10:35:08Z'],
    ['PokePastry', true, '2023-05-17T22:21:31Z'],
    ['DoubleCaret', true, '2023-07-25T17:41:33Z'],
    ['momalaharris', true, '2022-12-23T18:48:45Z'],
    ['FR1E5', true, '2022-10-22T16:18:20Z'],
    ['Tanuj C', false, '2023-02-07T06:39:25Z'],
    ['GoldenGottaGo', true, '2023-02-14T12:14:18Z'],
  ],
}];

/**
 * List of Patreon patrons.
 *
 * @since 1.1.3
 */
export const ShowdexPatronTiers: ShowdexSupporterTier[] = [{
  id: 'patreon-tier-03',
  title: 'Supreme Overlords',
  term: 'monthly',
  names: [
    ['Dastardlydwarf', true, '2023-04-12T21:25:18Z', null],
    ['goddess mina', true, '2023-04-10T16:17:09Z', null],
    ['Zzodz', true, '2023-05-13T00:02:51Z', '2023-06-13T00:02:51Z'],
  ],
}, {
  id: 'patreon-tier-02',
  title: 'Pop Bombers',
  term: 'monthly',
  names: [
    ['benzyne', true, '2023-03-31T06:12:04Z', null],
  ],
}, {
  id: 'patreon-tier-01',
  title: 'Blazikens',
  term: 'monthly',
  names: [
    ['BruhMomentMaker', true, '2023-04-10T13:35:32Z', null],
    ['Christopher Y', false, '2023-07-02T21:05:52Z', null],
    ['TheNexyr', true, '2023-07-21T01:24:21Z', null],
  ],
}];

/**
 * Combined list of all Showdex supporters.
 *
 * @since 1.1.6
 */
export const ShowdexSupporterTiers: ShowdexSupporterTier[] = [
  ...ShowdexDonorTiers,
  ...ShowdexPatronTiers,
];
