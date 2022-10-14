/**
 * `client-html-room.d.ts`
 *
 * Provides global `HtmlRoom` typings for the live PS client running on Backbone.js.
 * Adapted from `pokemon-showdown-client/js/client-ladder.js`.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  class HtmlRoom extends ClientRoom {
    public id: string;
    public cid: string;
    public type: ClientRoomType = 'html';
    public title = 'Page';

    public minWidth?: number;
    public maxWidth?: number;
    public leftWidth?: number;
    public bestWidth = 659;
    public isSideRoom: boolean;

    public className = 'ps-room';
    public el: HTMLDivElement;
    public $el: JQuery<HTMLDivElement>;

    public notificationClass = '';
    public notifications = {};
    public subtleNotification = false;

    /**
     * @default
     * {
     *   'click .username': 'clickUsername',
     *   'submit form': 'submitSend',
     * }
     */
    public events: Record<string, string>;
    public lastUpdate?: number;

    public constructor(props?: {
      id: string;
      el?: JQuery<HTMLDivElement>;
      nojoin?: boolean;
      title?: string;
    });

    public initialize(): void;
    public send<T = unknown>(data?: T): void;
    public submitSend(e: Event): void;
    public receive<T = unknown>(data: T): void;
    public add(log: string | string[]): void;
    public join(): void;
    public leave(): void;
    public requestLeave(e?: Event): boolean;
    public login(): void;
    public addRow(line: string): void;
    public clickUsername(e: Event): void;

    public dispatchClickButton(e: Event): void;
    public dispatchClickBackground(e: Event): void;
    public focus(): void;
    public blur(): void;
    public show(position?: ClientRoomPosition, leftWidth?: number): void;
    public hide(): void;
    public requestNotifications(): void;
    public notify(title: string, body: string, tag?: string, once?: boolean): void;
    public subtleNotifyOnce(): void;
    public notifyOnce(title: string, body: string, tag?: string): void;
    public closeNotification(tag?: string, alreadyClosed?: boolean): void;
    public closeAllNotifications(skipUpdate?: boolean): void;
    public dismissNotification(tag?: string): void;
    public dismissAllNotifcations(skipUpdate?: boolean): void;
    public clickNotification(tag?: string): void;
    public updateLayout(): void;
    public close(): void;
    public destroy(alreadyLeft?: boolean): void;
  }
}
