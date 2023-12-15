/**
 * @file `battle-formats.d.ts`
 *
 * Adapted from reading the `BattleFormats` global from `pokemon-showdown-client`, captured on 2023/12/14.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface BattleFormat {
    /**
     * Format ID.
     *
     * @example 'gen9randombattle'
     */
    id: string;

    /**
     * Human-readable format name.
     *
     * @example '[Gen 9] Random Battle'
     */
    name: string;

    /**
     * Effect type ...?
     *
     * @example 'Format'
     */
    effectType: 'Format';

    /**
     * Category/section that this format falls under.
     *
     * @example 'S/V Singles'
     */
    section: string;

    /**
     * Column number that this format appears in Showdown's format selector popup.
     *
     * @example 1
     */
    column: number;

    /**
     * Whether this format is rated/ranked on the ladder.
     */
    rated: boolean;

    /**
     * Whether this format allows partners.
     *
     * * Not sure if this indicates partner players or Pokemon, but probably the latter.
     * * Ironically, `gen9partnersincrime` has a `false` value.
     * * Actually, there aren't any formats as of the date of capturing `BattleFormat` that has this `true`.
     */
    partner: boolean;

    /**
     * Appears to indicate how teams are handled.
     *
     * * If falsy (typically `null`), most likely means this format requires a pre-configured team from the player.
     *   - There's also a `isTeambuilderFormat` property you can probably read to verify this.
     * * On the other hand, if this value is `'preset'`, typical of Randoms, most likely means the teams are
     *   pre-configured by the server.
     *
     * @example 'preset'
     * @default null
     */
    team: string;

    /**
     * Whether this format allows Teambuilder teams.
     */
    isTeambuilderFormat: boolean;

    /**
     * Which format to show when building the list of Teambuilder teams.
     *
     * * If falsy (typically `''`, i.e., an empty string), most likely means the teams should be filtered to the current
     *   format... probably.
     * * Appears to be an empty string for most formats.
     *
     * @example
     * ```ts
     * // for BattleFormats.gen9vgc2023regulationebo3:
     * 'gen9vgc2023regulatione'
     * ```
     * @default ''
     */
    teambuilderFormat: string;

    /**
     * Max level of Teambuilder Pokemon.
     *
     * * If falsy (typically `null`), most likely means there isn't a level cap.
     * * Appears to be `null` for most formats, except for VGC, where this value is typically `50`.
     *
     * @example 50
     */
    teambuilderLevel: number;

    /**
     * Whether this format should default to a "Bo*X*" (i.e., "best of *X*") matchup.
     *
     * * Interestingly, this is typically `true` for `gen9vgc2023regulatione`, but `false` for `gen9vgc2023regulationebo3`.
     * * Also appears to be `false` for most formats.
     */
    bestOfDefault: boolean;

    /**
     * Whether this format should appear in format search results.
     */
    searchShow: boolean;

    /**
     * Whether this format should appear when challenging another user.
     */
    challengeShow: boolean;

    /**
     * Whether this format should appear when creating a tournament.
     */
    tournamentShow: boolean;
  }

  /**
   * Object containing all of the currently available formats on Showdown.
   *
   * * Key refers to the format's `id`.
   *
   * @example
   * ```ts
   * {
   *   // ...
   *   gen9randombattle: {
   *     id: 'gen9randombattle',
   *     name: '[Gen 9] Random Battle',
   *     effectType: 'Format',
   *     section: 'S/V Singles',
   *     column: 1,
   *     rated: true,
   *     partner: false,
   *     team: 'preset',
   *     isTeambuilderFormat: false,
   *     teambuilderFormat: '',
   *     teambuilderLevel: null,
   *     bestOfDefault: false,
   *     searchShow: true,
   *     challengeShow: true,
   *     tournamentShow: true,
   *   },
   *   // ...
   *   gen9vgc2023regulatione: {
   *     id: 'gen9vgc2023regulatione',
   *     name: '[Gen 9] VGC 2023 Regulation E',
   *     effectType: 'Format',
   *     section: 'S/V Doubles',
   *     column: 1,
   *     rated: true,
   *     partner: false,
   *     team: null,
   *     isTeambuilderFormat: true,
   *     teambuilderFormat: '',
   *     teambuilderLevel: 50,
   *     bestOfDefault: true,
   *     searchShow: true,
   *     challengeShow: true,
   *     tournamentShow: true,
   *   },
   *   gen9vgc2023regulationebo3: {
   *     id: 'gen9vgc2023regulationebo3',
   *     name: '[Gen 9] VGC 2023 Regulation E (Bo3)',
   *     effectType: 'Format',
   *     section: 'S/V Doubles',
   *     column: 1,
   *     rated: true,
   *     partner: false,
   *     team: null,
   *     isTeambuilderFormat: false,
   *     teambuilderFormat: 'gen9vgc2023regulatione',
   *     teambuilderLevel: 50,
   *     bestOfDefault: false,
   *     searchShow: true,
   *     challengeShow: false,
   *     tournamentShow: true,
   *   },
   *   // ...
   * }
   * ```
   */
  type BattleFormats = Record<string, BattleFormat>;
}
