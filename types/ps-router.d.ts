/**
 * ps-router.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panels.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface PSRouter {
    /**
     * @default ''
     */
    roomid: string;

    /**
     * @default ''
     */
    panelState: string;

    (): this;

    extractRoomID(url: string): string;
    subscribeHash(): void;
    subscribeHistory(): void;
  }
}
