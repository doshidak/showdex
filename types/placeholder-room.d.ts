/**
 * placeholder-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license APGLv3
 */

declare namespace Showdown {
  interface PlaceholderRoom extends PSRoom {
    /**
     * @default []
     */
    queue: Args[];

    readonly classType: 'placeholder';

    receiveLine(args: Args): void;
  }
}
