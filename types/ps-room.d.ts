/**
 * ps-room.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-main.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  type RoomID = string & { __isRoomID: true; };

  type PSRoomLocation =
    | 'left'
    | 'right'
    | 'popup'
    | 'mini-window'
    | 'modal-popup'
    | 'semimodal-popup';

  interface RoomOptions extends Record<string, unknown> {
    id: RoomID;
    title?: string;
    type?: string;
    location?: PSRoomLocation;

    /**
     * Handled after initialization, outside of the constructor.
     */
    queue?: Args[];

    parentElem?: HTMLElement;
    parentRoomid?: string;
    rightPopup?: boolean;
    connected?: boolean;
  }

  interface PSNotificationState {
    title: string;
    body?: string;

    /**
     * Used to identify notifications to be dismissed.
     *
     * * `''` if you want to auto-dismiss.
     */
    id: string;

    /**
     * Whether to require manual dismissing of the notification.
     *
     * @default false // auto-dismiss
     */
    noAutoDismiss: boolean;
  }

  type RoomType<T = unknown> = {
    Model?: PSRoom;
    Component: T;
    title?: string;
  };

  interface PSRoom extends PSStreamModel<Args>, RoomOptions {
    id: RoomID;

    /**
     * @default ''
     */
    title: string;

    /**
     * @default ''
     */
    type: string;

    /**
     * @default ''
     */
    readonly classType: string;

    /**
     * @default 'left'
     */
    location: PSRoomLocation;

    /**
     * @default true
     */
    closable: boolean;

    /**
     * Whether the room is connected to the server.
     *
     * * This mostly tracks "should we send `/leave` if the user closes the room?"
     * * In particular, this is `true` after sending `/join`, and `false` after sending `/leave`,
     *   even before the server responds.
     *
     * @default false
     */
    connected: boolean;

    /**
     * Can this room even be connected to at all?
     *
     * * `true` = pass messages from the server to subscribers.
     * * `false` = throw an error if we receive messages from the server.
     *
     * @default false
     */
    readonly canConnect: boolean;

    /**
     * @default false
     */
    connectWhenLoggedIn: boolean;

    onParentEvent?: ((eventId: 'focus' | 'keydown', e?: Event) => false | void);

    /**
     * @default 0
     */
    width: number;

    /**
     * @default 0
     */
    height: number;

    parentElem?: HTMLElement;

    /**
     * @default false
     */
    rightPopup: boolean;

    /**
     * @default []
     */
    notifications: PSNotificationState[];

    /**
     * @default false
     */
    isSubtleNotifying: boolean;

    (options: RoomOptions): this;

    destroy(): void;

    notify(options: { title: string; body?: string; noAutoDismiss?: boolean; id?: string; }): void;
    dismissNotification(id: string): void;
    autoDismissNotifications(): void;
    setDimensions(width: number, height: number): void;
    connect(): void;
    receiveLine(args: Args): void;
    handleMessage(line: string): boolean;
    send(msg: string, direct?: boolean): void;
  }
}
