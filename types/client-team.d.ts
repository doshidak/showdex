/**
 * client-team.d.ts
 *
 * Provides team typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface ClientTeam {
    /**
     * Name of the team.
     *
     * @example 'ELO EXTRACTOR'
     */
    name: string;

    /**
     * Format of the team, including the gen number.
     *
     * @example 'gen9ou'
     */
    format: string;

    /**
     * Folder that this team is under, if any.
     *
     * * If there's no folder, this value will be an empty string (i.e., `''`).
     *
     * @example 'OU Disruptors'
     * @default ''
     */
    folder: string;

    /**
     * Number of Pokemon in the team.
     *
     * * There isn't any distinction here for teams vs. boxes, except for this property.
     *   - Teams will typically have a value of `6`.
     *   - Boxes will typically have a value of `24`.
     *
     * @example 6
     */
    capacity: number;

    /**
     * HTML of the Picons for each Pokemon in `team`.
     *
     * * This is only typically available if the teams were downloaded from another origin.
     *   - If the origin is of the main Showdown client, this will be an empty string (i.e., `''`).
     *   - e.g., You'll find this populated on `dl.psim.us`, but not on `play.pokemonshowdown.com`.
     *
     * @example '<span class="picon" style="background:transparent url(https://play.pokemonshowdown.com...">...'
     * @default ''
     */
    iconCache: string;

    /**
     * Serialized Teambuilder teams as a single string.
     *
     * * This is stored in the same way (after the `<format>]<name>|` prefix) for each team.
     *
     * @example 'Glimmora||airballoon|toxicdebris|stealthrock,spikes,mortalspin,earthpower|Timid|252,,,4,,252|...'
     */
    team: string;
  }
}
