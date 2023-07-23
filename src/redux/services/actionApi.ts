import qs from 'qs';
import { HttpMethod } from '@showdex/consts/core';
import { type ReduxBasePayload, createTagProvider } from '@showdex/redux/factories';
import { env, runtimeFetch, safeJsonParse } from '@showdex/utils/core';
import { showdownApi } from './showdownApi';
import { ShowdownReduxTagType } from './tagTypes';

/**
 * Schema of a user's ladder info from the Showdown Actions API.
 *
 * @since 1.0.7
 */
export interface ShowdownActionUserLadderInfo extends ReduxBasePayload {
  /**
   * ID used by RTK Query in its internal tagging system.
   *
   * * Not provided by the Showdown Actions API.
   * * Populated by concatenating the `userid`, `formatid`, and `entryid`,
   *   all deliminated by a colon (`:`) into a single `string`.
   *
   * @example 'showdextester:gen8randombattle:98078492'
   * @since 1.0.7
   */
  id: string;

  /**
   * ID of the entry, as stored on Showdown's server, probably.
   *
   * @example '98078492'
   * @since 1.0.7
   */
  entryid: string;

  /**
   * Format that this ladder info pertains to.
   *
   * @example 'gen8randombattle'
   * @since 1.0.7
   */
  formatid: string;

  /**
   * ID of the user, most likely parsed through something like `formatId()` from the `username`.
   *
   * @example 'showdextester'
   * @since 1.0.7
   */
  userid: string;

  /**
   * Username that this ladder info pertains to.
   *
   * @example 'showdex_tester'
   * @since 1.0.7
   */
  username: string;

  /**
   * Number of wins, formatted as a `string`.
   *
   * @example '34'
   * @since 1.0.7
   */
  w: string;

  /**
   * Number of losses, formatted as a `string`.
   *
   * @example '14'
   * @since 1.0.7
   */
  l: string;

  /**
   * Number of ties, formatted as a `string`.
   *
   * @example '0'
   * @since 1.0.7
   */
  t: string;

  /**
   * Elo rating of the user, formatted as a `string`.
   *
   * * Appears to be rounded up via `Math.round()` when displayed in the Showdown client.
   * * Should not be stylized as "ELO", which can refer to the British rock band *Electric Light Orchestra*,
   *   the PVC lubricant *Epoxidized Linseed Oil*, or perhaps an *Extra Long Orifice*.
   *
   * @example '1473.1580443168'
   * @see https://smogon.com/smog/issue43/elo-hello
   * @since 1.0.7
   */
  elo: string;

  /**
   * GXE rating of the user, formatted as a `string`.
   *
   * * More specifically, this is a custom Glicko implementation dubbed "GLIXARE" (GXE), which is short for
   *   *Glicko X-Act Rating Estimate* ("X-Act" referring to the user who came up with this implementation).
   * * From the title tooltip in the Showdown client: "user's percentage chance of winning a random battle".
   * * Value represents a percentage, already formatted as such without the percent sign (i.e., no need to multiply by `100`).
   *
   * @example '71.4'
   * @see https://smogon.com/forums/threads/gxe-glixare-a-much-better-way-of-estimating-a-players-overall-rating-than-shoddys-cre.51169
   * @since 1.0.7
   */
  gxe: string;

  /**
   * Rating of the user, formatted as a `string`.
   *
   * * Unsure what rating system this value is based off of (some kind of Glicko).
   * * Probably used for GXE calculations.
   *
   * @example '1676.6337086801'
   * @since 1.0.7
   */
  r: string;

  /**
   * Rating deviation of the user, formatted as a `string`.
   *
   * * Unsure what rating system this value is based off of (probably some kind of Glicko).
   * * Probably used for GXE calculations.
   *
   * @example '55.202594845423'
   * @since 1.0.7
   */
  rd: string;

  /**
   * Rating volatility of the user, formatted as a `string.
   *
   * * Unsure what rating system this value is based off of (probably some kind of Glicko).
   * * Probably used for GXE calculations.
   *
   * @example '0'
   * @since 1.0.7
   */
  sigma: string;

  /**
   * Glicko-1 rating of the user, formatted as a `string`.
   *
   * * Appears to be rounded up via `Math.round()` when displayed in the Showdown client.
   *
   * @example '1674.2639414529'
   * @since 1.0.7
   */
  rpr: string;

  /**
   * Glicko-1 rating deviation of the user, formatted as a `string`.
   *
   * * Appears to be rounded up via `Math.round()` when displayed in the Showdown client.
   *
   * @example '53.896359545623'
   * @since 1.0.7
   */
  rprd: string;

  /**
   * Glicko-1 rating volatility, formatted as a `string`.
   *
   * * Doesn't seem to be displayed anywhere in the Showdown client, so may be not worth using.
   *
   * @example '0'
   * @since 1.0.7
   */
  rpsigma: string;

  /**
   * Last recorded timestamp to determine the *rating period* of the user's Glicko-1 rating, formatted as a `string`.
   *
   * * Doesn't seem to be displayed anywhere in the Showdown client, so may be not worth using.
   *
   * @example '1668243600'
   * @since 1.0.7
   */
  rptime: string;
}

export const actionApi = showdownApi.injectEndpoints({
  overrideExisting: true,

  endpoints: (build) => ({
    userLadder: build.query<ShowdownActionUserLadderInfo[], string>({
      queryFn: async (username) => {
        if (!username) {
          throw new Error('No valid username was provided.');
        }

        const response = await runtimeFetch([
          env('showdown-client-base-url'), // e.g., 'https://play.pokemonshowdown.com'
          env('showdown-client-action-path'), // e.g., '/~~showdown/action.php'
          '?',
          qs.stringify({
            act: 'ladderget',
            user: username,
          }),
        ].join(''), {
          method: HttpMethod.GET,
          headers: {
            Accept: 'text/plain',
          },
        });

        // this API has malformed JSON lul
        let text = response.text();

        if (text?.startsWith?.(']')) {
          text = text.slice(1);
        }

        // format as JSON
        const data = safeJsonParse<ShowdownActionUserLadderInfo[]>(text)?.map((info) => ({
          ...info,
          id: `${info?.entryid || '?'}:${info?.formatid || '?'}:${info?.entryid || '?'}`,
        }));

        return { data };
      },

      providesTags: createTagProvider(ShowdownReduxTagType.Ladder),
    }),
  }),
});

export const {
  useUserLadderQuery,
} = actionApi;
