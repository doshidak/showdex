/**
 * page-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/panel-page.tsx`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license MIT
 */

declare namespace Showdown {
  interface PageRoom extends PSRoom {
    readonly classType: 'html';
    readonly page?: string;
    readonly canConnect: true;

    /**
     * @default true
     */
    loading: boolean;

    htmlData?: string;
    setHTMLData: (htmlData?: string) => void;

    (options: RoomOptions): this;

    connect(): void;
  }
}
