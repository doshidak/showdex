/**
 * client-room.d.ts
 *
 * Provides generic Room typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  type ClientRoomPosition =
    | 'left'
    | 'right'
    | 'full';

  type ClientRoomType =
    | 'html'
    | 'battle'
    | 'battles'
    | 'chat'
    | 'rooms';

  interface ClientRoom {
    id: string;
    cid: string;
    type: ClientRoomType;
    title?: string;

    /**
     * @default 'ps-room'
     */
    className: string;

    el: HTMLElement;
    $el: JQuery<HTMLElement>;

    /**
     * @default {}
     */
    events: Record<string, string>;

    minWidth?: number;
    minMainWidth?: number;
    maxWidth?: number;
    leftWidth?: number;

    /**
     * @default 659
     */
    bestWidth: number;

    /**
     * @default false
     */
    isSideRoom: boolean;

    /**
     * @default ''
     */
    notificationClass: string;

    /**
     * @default {}
     */
    notifications: Record<string, Notification>;

    /**
     * @default false
     */
    subtleNotification: boolean;

    /**
     * Timestamp (in ms) of the last update since the Unix epoch.
     */
    lastUpdate?: number;

    dispatchClickButton(e: Event): void;
    dispatchClickBackground(e: Event): void;
    send(data: string): void;
    receive(data: string): void;
    show(position: ClientRoomPosition, leftWidth: number): void;
    hide(): void;
    focus(): void;
    blur(): void;
    join(): void;
    leave(): void;
    requestLeave(e?: Event): boolean;
    requestNotifications(): void;
    notify(title: string, body: string, tag?: string, once?: boolean): void;
    subtleNotifyOnce(): void;
    notifyOnce(title: string, body: string, tag?: string): void;
    closeNotification(tag?: string, alreadyClosed?: boolean): void;
    closeAllNotifications(skipUpdate?: boolean): void;
    dismissNotification(tag?: string): void;
    dismissAllNotifcations(skipUpdate?: boolean): void;
    clickNotification(tag?: string): void;
    updateLayout(): void;
    close(): void;
    destroy(alreadyLeft?: boolean): void;
  }
}
