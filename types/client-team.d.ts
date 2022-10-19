/**
 * client-team.d.ts
 *
 * Provides team typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface ClientTeam {
    name: string;
    format: string;
    team: string | Partial<Pokemon>[];
    capacity: number;
    folder: string;
    iconCache: string;
  }
}
