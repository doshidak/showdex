/**
 * Supporter tier & its members.
 *
 * * Primarily only used by the `PatronagePane` in the Hellodex.
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
   * Names/usernames of individuals within the supporter tier.
   *
   * * If the element is a `string` (& not the `[name, active, user?]` tuple),
   *   the name will be treated as if `active` is `true` & `user` is `false`.
   * * When `active` is `false`, the name will appear faded in the `PatronagePane`.
   *   - More specifically, the opacity of the name will be set to `0.3` (i.e., 30%).
   * * Specify the `user` value in the tuple as `true` if the `name` is a Showdown username.
   *   - This will allow the user's profile to appear when clicked on via `openUserPopup()`.
   *
   * @example
   * ```ts
   * [
   *   'Active Patron', // by default for strings, active = true & user = false
   *   ['Another Active Patron', true], // active = true & user = false
   *   ['ActivePatronUsername', true, true], // active = true & user = true
   *   ['InactivePatron', false], // active = false & user = false
   *   ['InactivePatronUsername', false, true], // active = false & user = true
   * ]
   * ```
   * @since 1.1.3
   */
  names: (string | [name: string, active: boolean, user?: boolean])[];
}

/**
 * List of PayPal donors.
 *
 * @since 1.1.3
 */
export const ShowdexDonorTiers: ShowdexSupporterTier[] = [{
  title: 'Paid Pals',
  names: [
    'Angie L',
    ['Fubwubs', true, true],
    'Timothy B',
    'Michael L',
    ['Bongphan', true, true],
    ['GenOne', true, true],
    ['Lunarvania', true, true],
    'Leman T',
    'Sunny B',
    'Peter T',
    ['momalaharris', true, true],
    ['FR1E5', true, true],
    'Tanuj C',
    ['GoldenGottaGo', true, true],
  ],
}];

/**
 * List of Patreon patrons.
 *
 * @since 1.1.3
 */
export const ShowdexPatronTiers: ShowdexSupporterTier[] = [{
  title: 'Supreme Overlords',
  names: [
    ['Dastardlydwarf', true, true],
  ],
}, {
  title: 'Pop Bombers',
  names: [
    ['benzyne', true, true],
    ['goddess mina', true, true],
  ],
}, {
  title: 'Blazikens',
  names: [
    ['BruhMomentMaker', true, true],
  ],
}];
