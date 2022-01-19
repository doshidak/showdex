/**
 * rooms-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panel-rooms.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface RoomsRoom extends PSRoom {
    readonly classType: 'rooms';

    (options: RoomOptions): this;
  }
}
