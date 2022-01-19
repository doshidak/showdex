/**
 * ps-connection.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-connection.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface PSConnection {
    /**
     * SockJS.
     *
     * @todo Add SockJS typing?
     */
    socket: unknown;

    /**
     * @default false
     */
    connected: boolean;

    /**
     * @default []
     */
    queue: string[];

    connection?: PSConnection;

    (): this;

    connect(): void;
    disconnect(): void;
    send(msg: string): void;
  }

  interface PostData {
    [key: string]: string | number;
  }

  interface NetRequestOptions {
    method?: 'GET' | 'POST';
    body?: string | PostData;
    query?: PostData;
  }

  interface NetRequest {
    uri: string;

    (): this;

    get(opts?: NetRequestOptions): Promise<string>;
    post(opts?: NetRequestOptions, body?: PostData | string): Promise<string>;
  }
}
