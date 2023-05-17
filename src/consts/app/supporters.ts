/**
 * Term of the supporter tier.
 *
 * @since 1.2.0
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
   * Name of the supporter tier.
   *
   * @example 'Tier 3 Pokemane Sub'
   * @since 1.1.3
   */
  title: string;

  /**
   * Term of the supporter tier.
   *
   * @default 'once'
   * @since 1.2.0
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
  title: 'Paid Pals',
  term: 'once',
  names: [
    ['Angie L', false, '2022-12-31T07:26:59Z'],
    ['Fubwubs', true, '2022-12-30T14:38:03Z'],
    ['Timothy B', false, '2023-03-08T08:08:19Z'],
    ['PastGenOUFan', true, '2023-05-10T11:52:57Z'],
    ['Michael L', false, '2022-11-08T13:17:33Z'],
    ['Bongphan', true, '2023-04-17T09:56:43Z'],
    ['GenOne', true, '2023-03-18T06:56:43Z'],
    ['Lunarvania', true, '2022-12-30T03:24:14Z'],
    ['Leman T', false, '2022-12-01T04:08:37Z'],
    ['Sunny B', false, '2023-01-03T00:12:09Z'],
    ['Peter T', false, '2023-01-29T11:50:05Z'],
    ['Sam P', false, '2023-05-07T20:35:08Z'],
    ['momalaharris', true, '2022-12-23T02:48:45Z'],
    ['FR1E5', true, '2022-10-22T02:18:20Z'],
    ['Tanuj C', false, '2023-02-06T14:39:25Z'],
    ['GoldenGottaGo', true, '2023-02-13T20:14:18Z'],
  ],
}];

/**
 * List of Patreon patrons.
 *
 * @since 1.1.3
 */
export const ShowdexPatronTiers: ShowdexSupporterTier[] = [{
  title: 'Supreme Overlords',
  term: 'monthly',
  names: [
    ['Dastardlydwarf', true, '2023-04-12T07:25:18Z', null],
    ['goddess mina', true, '2023-04-10T02:17:09Z', null],
    ['Zzodz', true, '2023-05-12T10:02:51Z', null],
  ],
}, {
  title: 'Pop Bombers',
  term: 'monthly',
  names: [
    ['benzyne', true, '2023-03-30T16:12:04Z', null],
  ],
}, {
  title: 'Blazikens',
  term: 'monthly',
  names: [
    ['BruhMomentMaker', true, '2023-04-09T23:35:32Z', null],
  ],
}];
