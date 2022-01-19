/**
 * ps-server.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface PSServer {
    /**
     * @default Config.defaultserver.id
     */
    id: string;

    /**
     * @default Config.defaultserver.host
     */
    host: string;

    /**
     * @default Config.defaultserver.port
     */
    port: string | number;

    /**
     * @default Config.defaultserver.altport
     */
    altport: string | number;

    /**
     * @default Config.defaultserver.registered
     */
    registered: boolean;

    /**
     * @default '/showdown'
     */
    prefix: string;

    /**
     * @default Config.defaultserver.httpport ? 'https' : 'http'
     */
    protocol: 'http' | 'https';

    groups: { [symbol: string]: PSGroup; };

    /**
     * @default { order: 108 }
     */
    defaultGroup: PSGroup;

    getGroup(symbol?: string): PSGroup;
  }
}
