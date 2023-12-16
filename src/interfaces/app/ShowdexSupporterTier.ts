/**
 * Term of the supporter tier.
 *
 * @since 1.1.6
 */
export type ShowdexSupporterTierTerm =
  | 'once'
  | 'monthly';

/**
 * Member of a supporter tier.
 *
 * @since 1.2.0
 */
export interface ShowdexSupporterTierMember {
  /**
   * Member's display name.
   *
   * @example 'Active Patron'
   * @since 1.2.0
   */
  name: string;

  /**
   * Whether the `name` is a Showdown username.
   *
   * * Typically will be clickable to open Showdown's user popup if this value is `true`.
   *
   * @since 1.2.0
   */
  showdownUser?: boolean;

  /**
   * Time periods during which the member was an active supporter.
   *
   * * `start` & `end` dates are ISO 8601 timestamps.
   * * Typically will only contain one element with one `start` timestamp in tiers with `'once'` terms.
   *   - This is to say that one-time donations don't have an `end` date!
   *   - Multiple periods (all without `end` dates) can exist, implying multiple one-time donations.
   * * Missing `end` date for a given period implies ongoing support in tiers with `'monthly'` terms.
   *
   * @example
   * ```ts
   * [
   *   ['2022-04-20T04:20:00Z', '2023-04-20T04:20:00Z'], // first period (inactive)
   *   ['2023-04-20T16:20:00Z'], // second period (active)
   * ]
   * ```
   * @since 1.2.0
   */
  periods: [start: string, end?: string][];
}

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
   * Supporter tier's name.
   *
   * @example 'Tier 3 Pokemane Sub'
   * @since 1.1.3
   */
  title: string;

  /**
   * Supporter tier's term of support.
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
   * @deprecated As of v1.2.0, use `members[]` instead.
   * @since 1.1.3
   */
  names?: (string | [name: string, user?: boolean, start?: string, end?: string])[];

  /**
   * Supporter tier's members.
   *
   * @example
   * ```ts
   * [
   *   {
   *     name: 'Active Patron',
   *     period: [['2023-04-20T04:20:00Z']],
   *   },
   *   {
   *     name: 'ActivePatronUsername',
   *     showdownUser: true,
   *     period: [
   *       ['2022-04-19T04:20:00Z', '2023-04-20T04:20:00Z'],
   *       ['2023-04-20T16:20:00Z'],
   *     ],
   *   },
   *   {
   *     name: 'Inactive Patron',
   *     period: [['2022-04-20T04:20:00Z', '2023-04-20T04:20:00Z']],
   *   },
   * ]
   * ```
   * @since 1.2.0
   */
  members: ShowdexSupporterTierMember[];
}
