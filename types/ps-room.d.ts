/**
 * @file `ps-room.d.ts` - Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/client-main.ts`.
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @author Adam Tran <aviettran@gmail.com>
 * @license AGPLv3
 * @since 0.1.0
 */

/* eslint-disable max-classes-per-file */

declare namespace Showdown {
  type RoomID = string & { __isRoomID: true; };

  type PSRoomLocation =
    | 'left'
    | 'right'
    | 'popup'
    | 'mini-window'
    | 'modal-popup';

  interface RoomOptions {
    id: RoomID;
    title?: string;
    type?: string;
    location?: PSRoomLocation;
    /** In case the room received messages before it was ready for them. */
    backlog?: Args[];
    /**
     * Popup parent element.
     *
     * * If it exists, a popup shows up right above/below that element.
     * * No effect on non-popup modals.
     */
    parentElem?: HTMLElement;
    /**
     * Popup's parent room.
     *
     * * Inferred from `parentElem`.
     * * Closes any popup that isn't this popup.
     * * No effect on non-popup panels.
     */
    parentRoomid?: RoomID;
    /** Opens the popup to the right of its parent instead of the default above/below for userlists. */
    rightPopup?: boolean;
    connected?: 'autoreconnect' | 'client-only' | 'expired' | boolean;
    /** Whether the room's `id` should be in the URL. */
    noURL?: boolean;
    args?: Record<string, unknown>;
  }

  /** Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/panel-mainmenu.tsx`. */
  interface RoomInfo {
    title: string;
    desc?: string;
    userCount?: number;
    section?: string;
    privacy?: 'hidden';
    spotlight?: string;
    subRooms?: string[];
  }

  interface PSNotificationState {
    title: string;
    body?: string;
    /**
     * Used to identify notifications to be dismissed.
     *
     * * Specify `''` if you only want to auto-dismiss.
     */
    id: string;
    /** Normally auto-dismisses the notification when viewing the room; set this to require manual dismissals. */
    noAutoDismiss: boolean;
    notification?: Notification;
  }

  type ClientCommands<TRoom extends PSRoom> = {
    /** Return `true` to send the original command on to the server or a `string` to send that command. */
    [command: Lowercase<string>]: (
      this: TRoom,
      target: string,
      cmd: string,
      element?: HTMLElement,
    ) => string | boolean | null | void,
  };

  /**
   * "The command signature is a lie but TypeScript and string validation amirite?"
   *
   * * u rite u rite lolol
   */
  type ParsedClientCommands = {
    [command: `parsed${string}`]: (
      this: PSRoom,
      target: string,
      cmd: string,
      element?: HTMLElement,
    ) => string | boolean | null | void,
  };

  /**
   * Basically a `Promise<void>` w/ an exposed `resolve()` function named `loaded()` so that u can `await` an external
   * asynchronous task possibly defined outside of the scope you're `await`'ing in for that dank dank concurrency.
   *
   * * This is returned by the `LoadTrackerFactory`, i.e., the `window.makeLoadTracker()` global.
   */
  type LoadTracker = Promise<void> & {
    loaded: () => void;
  };

  /**
   * Primary typing for the `window.makeLoadTracker()` global.
   */
  type LoadTrackerFactory = () => LoadTracker;

  /**
   * As a `PSStreamModel<Args | null>`, the `PSRoom` can emit `Args` to indicate "we received a message" &
   * `null` to "tell Preact to re-render this room."
   */
  class PSRoom extends PSStreamModel<Args | null> implements RoomOptions {
    public id: RoomID;
    public title = '';
    public type = '';
    public isPlaceholder = false;
    public readonly classType: string = '';
    public location: PSRoomLocation = 'left';
    public closable = true;
    /**
     * Whether the room is connected to the server.
     *
     * * This mostly tracks "should we send `/leave` if the user closes the room?"
     * * In particular, this is `true` after sending `/join`, and `false` after sending `/leave`,
     *   even before the server responds.
     *
     * @default false
     */
    public connected: RoomOptions['connected'] = false;
    /**
     * Can this room even be connected to at all?
     *
     * * `true` = pass messages from the server to subscribers.
     * * `false` = throw an error if we receive messages from the server.
     *
     * @default false
     */
    public readonly canConnect: boolean = false;
    public connectWhenLoggedIn = false;
    public onParentEvent?: (eventId: 'focus' | 'keydown', event?: Event) => void = null;
    public width = 0;
    public height = 0;
    /**
     * Preact means that the DOM state lags behind the app state.
     *
     * Rooms will frequently have `display: none` at the time we want to focus them & popups sometimes initialize hidden
     * in order to calculate their widths/heights without flickering. But hidden HTML elements can't be focused, so this
     * is a note-to-self to focus the next time they can be.
     */
    public focusNextUpdate = false;
    public parentElem?: HTMLElement = null;
    public parentRoomid?: RoomID = null;
    public rightPopup = false;

    public notifications: PSNotificationState[] = [];
    public isSubtleNotifying = false;

    /** Only affects "mini-windows." */
    public minimized = false;
    public caughtError?: string = null;
    /** Whether this room's `id` should be in the URL. */
    public noURL = false;
    public args?: Record<string, unknown>;

    public globalClientCommands: ParsedClientCommands = {};
    public clientCommands?: ParsedClientCommands = null;
    public currentElement?: HTMLElement = null;

    public constructor(options: RoomOptions);
    public getParent(): PSRoom;
    public notify(
      options: {
        title: string;
        body?: string;
        noAutoDismiss?: boolean;
        id?: string;
      },
    ): void;
    public subtleNotify(): void;
    public dismissNotificationAt(index: number): void;
    public dismissNotification(id: string): void;
    public autoDismissNotifications(): void;
    public connect(): void;
    /**
     * By default, a reconnected room will receive the init message as a bunch of `receiveLine()`'s as normal.
     *
     * * Before that happens, `handleReonnect()` is called & you can return `true` to stop that behavior.
     * * You could also prep for a bunch of `receiveLine()`'s & then not return anything (i.e., `void`).
     */
    public handleReconnect(message: string): boolean | void;
    /** Return `true` to prevent the line from being sent to the server. */
    public receiveLine(args: Args): true | void;
    /** Used only by commands; messages from the server go directly from `PS.receive()` to `room.receiveLine()`. */
    public add(line: string, ifChat?: boolean): void;
    public errorReply(message: string, element = this.currentElement): void;
    public parseClientCommands(commands: ClientCommands<this>): ParsedClientCommands;
    /**
     * Handles outgoing messages like `/logout`.
     *
     * * Return `true` to prevent the `line` from being sent to servers.
     * * Returns the command result, if any, or the `line` if no command handler was found (or it returns `true`).
     */
    public handleSend(line: string, element = this.currentElement): string;
    public send(message?: string, element?: HTMLElement): void;
    public sendDirect(message: string): void;
    public destroy(): void;
  }

  class PlaceholderRoom extends PSRoom {
    public override readonly classType = 'placeholder';
    public override isPlaceholder = true as const;
  }
}
