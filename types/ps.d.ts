/**
 * ps.d.ts
 *
 * Adapted from `pokemon-showdown-client/src/client-core.ts`.
 *
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 */

declare namespace Showdown {
  interface PS extends PSModel {
    /**
     * @default false
     */
    down: string | boolean;

    prefs: PSPrefs;
    teams: PSTeams;
    user: PSUser;
    server: PSServer;
    connection?: PSConnection;

    /**
     * @default false
     */
    connected: boolean;

    /**
     * While PS is technically disconnected while it's trying to connect,
     * it still shows UI like it's connected, so you can click buttons
     * before the server is established.
     *
     * * `isOffline` is only set if PS is neither connected nor trying to connect.
     *
     * @default false
     */
    isOffline: boolean;

    router?: PSRouter;

    /**
     * @default {}
     */
    rooms: { [roomid: string]: PSRoom; };

    /**
     * @default {}
     */
    roomTypes: { [type: string]: RoomType; };

    /**
     * List of rooms on the left side of the top tabbar.
     *
     * @default []
     */
    leftRoomList: string[];

    /**
     * List of rooms on the right side of the top tabbar.
     *
     * @default []
     */
    rightRoomList: string[];

    /**
     * List of mini-rooms in the main menu.
     *
     * @default []
     */
    miniRoomList: string[];

    /**
     * Currently active popups, in stack order (bottom to top).
     *
     * @default []
     */
    popups: string[];

    /**
     * Currently active left room.
     *
     * * In two-panel mode, this will be the visible left panel.
     * * In one-panel mode, this is the visible room only if it is `PS.room`.
     *   - Still tracked when not visible, so we know which panels to display if PS is resized to two-panel mode.
     */
    leftRoom?: PSRoom;

    /**
     * Currently active right room.
     *
     * * In two-panel mode, this will be the visible right panel.
     * * In one-panel mode, this is the visible room only if it is `PS.room`.
     *   - Still tracked when not visible, so we know which panels to display if PS is resized to two-panel mode.
     */
    rightRoom?: PSRoom;

    /**
     * Currently focused room.
     *
     * * Should always be the topmost popup if it exists.
     * * Determines which room receives keyboard shortcuts.
     * * Clicking inside a panel will focus it, in two-panel mode.
     */
    room?: PSRoom;

    /**
     * Currently active panel.
     *
     * * Should always be either `PS.leftRoom` or `PS.rightRoom`.
     * * If no popups are open, should be `PS.room`.
     * * In one-panel mode, determines whether the left or right panel is visible.
     */
    activePanel?: PSRoom;

    /**
     * Will be `true` if one-panel mode is on,
     * but it will also be `true` if the right panel is temporarily hidden
     * (by opening the Rooms panel and clicking "Hide").
     *
     * * Not to be confused with `PSPrefs.onepanel`, which is permanent.
     * * Will NOT be `true` if only one panel fits onto the screen,
     *   but resizing will display multiple panels.
     *   - For that, check `PS.leftRoomWidth === 0`.
     *
     * @default false
     */
    onePanelMode: boolean;

    /**
     * * `0` = only one panel is visible.
     *
     * **NOTE:** PS will only update if the left room width changes.
     * Resizes that don't change the left room width will not trigger an update.
     *
     * @default 0
     */
    leftRoomWidth: number;

    // mainmenu?: MainMenuRoom;
    mainmenu?: unknown;

    dragging?: {
      type: 'room';
      roomid: string;
    };

    /**
     * Tracks whether to display the "Use arrow keys" hint.
     *
     * @default false
     */
    arrowKeysUsed: boolean;

    newsHTML: string;

    (): this;

    /**
     * All PS rooms are expected to responsively support any width from `320px` and up,
     * when in single-panel mode.
     *
     * `minWidth` and `maxWidth` are used purely to calculate the location of the separator
     * in two-panel mode.
     *
     * * `minWidth` = minimum width as a right-panel
     * * `width` = preferred width, minimum width as a left-panel
     * * `maxWidth` = maximum width as a left-panel
     *
     * **NOTE:** PS will only show two panels if it can fit `width` in the left,
     * and `minWidth` in the right.
     *
     * Extra space will be given to the right-panel until it reaches `width`,
     * then evenly distributed until both panels reach `maxWidth`.
     *
     * Any extra space above that will be given to the right-panel.
     */
    getWidthFor(room: PSRoom): {
      minWidth: number;
      width: number;
      maxWidth: number;
      isMainMenu?: boolean;
    };

    updateLayout(alreadyUpdating?: boolean): void;
    update(layoutAlreadyUpdated?: boolean): void;
    receive(msg: string): void;
    send(fullMsg: string): void;

    isVisible(room: PSRoom): boolean;
    calculateLeftRoomWidth(): number;

    createRoom(options: RoomOptions): PSRoom;
    updateRoomTypes(): void;
    addRoom(options: RoomOptions, noFocus?: boolean): PSRoom;
    removeRoom(room: PSRoom): void;
    focusRoom(roomid: string): boolean;
    focusLeftRoom(): boolean;
    focusRightRoom(): boolean;
    focusPreview(room: PSRoom): string;
    closePopup(skipUpdate?: boolean): void;
    // getPMRoom(userid: string): ChatRoom;

    join(roomid: string, side?: PSRoomLocation, noFocus?: boolean): void;
    leave(roomid: string): void;
  }
}
