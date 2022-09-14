/**
 * ps-config.d.ts
 *
 * Adapted from `pokemon-showdown-client/config/config.js`.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface PSConfig {
    /**
     * @example '0.11.2 (d4e9642b)'
     * @since 1.0.2
     */
    version: string;

    /**
     * @example
     * ```ts
     * ['example.com', /\.example\.com/]
     * ```
     * @since 1.0.2
     */
    bannedHosts: (string | RegExp)[];

    /**
     * @example
     * ```ts
     * ['pokemonshowdown.com', 'psim.us', 'smogon.com']
     * ```
     * @since 1.0.2
     */
    whitelist: string[];

    /**
     * @example '/showdown'
     * @since 1.0.2
     */
    sockjsprefix: string;

    /**
     * @example '/'
     * @since 1.0.2
     */
    root: string;

    routes: Record<string, string>;
    customcolors: Record<string, string>;
    server: PSServer;
    defaultserver: PSServer;
    groups: Record<string, PSGroup>;
    roomsFirstOpenScript(mainMenuOnly?: boolean): void;
  }
}
