/**
 * @file `ps.d.ts` - Adapted from `pokemon-showdown-client/play.pokemonshowdown.com/src/client-main.ts`.
 * @author Keith Choison <keith@tize.io>
 * @author Guangcong Luo <guangcongluo@gmail.com>
 * @license AGPLv3
 * @since 0.1.0
 */

declare namespace Showdown {
  type PSDragging =
    | { type: 'room'; roomid: RoomID; foreground?: boolean; }
    | { type: 'team'; team: Team | number; folder?: string; }
    | { type: '?'; };

  /**
   * This `PSModel` updates when:
   *
   * * a `PSRoom` is joined / left / focused, &
   * * the width of the left `PSRoom` changes in the two-panel mode.
   */
  class PS extends PSModel {
    public down: string | boolean = false;
    public prefs: PSPrefs;
    public teams: PSTeams;
    public user: PSUser;
    public server: PSServer;
    public connection?: PSConnection = null;
    /**
     * While PS is technically disconnected while it's trying to connect, it still shows UI like it's connected,
     * so you can click buttons before the server is established.
     *
     * * `isOffline` is only set if PS is neither connected nor trying to connect.
     *
     * @default false
     */
    public isOffline = false;
    public readonly startTime = Date.now();
    public router?: PSRouter = null;
    public rooms: { [roomid: string]: PSRoom; } = {};
    public roomTypes: { [type: string]: PSRoomPanelSubclass; } = {};
    /**
     * URL pathname routes.
     *
     * * Routes prefixed with an asterisk (i.e., `'*'`) refer to a cached room location for a `PlaceholderRoom`.
     * * Any other route will be a `RoomID`.
     * * Filled in automatically by `PS.updateRoomTypes()`.
     */
    public routes: Record<string, RoomID> = {
      '': '*' as const,
      'battle-*': '*' as const,
      battles: '*right' as const,
      formatdropdown: '*semimodal-popup' as const,
      'help-*': 'chat' as const,
      ladder: '*' as const,
      'ladder-*': '*' as const,
      login: '*semimodal-popup' as const,
      news: '*mini-window' as const,
      options: '*popup' as const,
      rooms: '*right' as const,
      'team-*': '*' as const,
      teambuilder: '*' as const,
      teamdropdown: '*semimodal-popup' as const,
      'user-*': '*popup' as const,
      'view-*': '*' as const,
      'viewuser-*': '*popup' as const,
      volume: '*popup' as const,
    };
    /** List of rooms on the left side of the top tabbar. */
    public leftRoomList: RoomID[] = [];
    /** List of rooms on the right side of the top tabbar. */
    public rightRoomList: RoomID[] = [];
    /** List of mini-rooms in the main menu. */
    public miniRoomList: RoomID[] = [];
    /** Currently active popups, in stack order (bottom to top). */
    public popups: RoomID[] = [];
    /**
     * Currently focused room.
     *
     * * Should always be the topmost popup if it exists.
     * * Determines which room receives keyboard shortcuts.
     * * Clicking inside a panel will focus it, in two-panel mode.
     */
    public room?: PSRoom = null;
    /**
     * Currently active panel.
     *
     * * Should always be either `PS.leftRoom` or `PS.rightRoom`.
     * * If no popups are open, should be `PS.room`.
     * * In one-panel mode, determines whether the left or right panel is visible.
     */
    public panel?: PSRoom = null;
    /**
     * Currently active left room.
     *
     * * In two-panel mode, this will be the visible left panel.
     * * In one-panel mode, this is the visible room only if it is `PS.room`.
     *   - Still tracked when not visible, so we know which panels to display if PS is resized to two-panel mode.
     */
    public leftPanel?: PSRoom = null;
    /**
     * Currently active right room.
     *
     * * In two-panel mode, this will be the visible right panel.
     * * In one-panel mode, this is the visible room only if it is `PS.room`.
     *   - Still tracked when not visible, so we know which panels to display if PS is resized to two-panel mode.
     */
    public rightPanel?: PSRoom = null;
    /**
     * Width of the left panel, which doubles as PS's canonical single-panel flag: it's falsy whenever only
     * one panel is visible (see `PS.isVisiblePanel()`), which is what `hasSinglePanel()` keys off of.
     *
     * * `0` = only one panel is visible.
     *   - Set when the `onepanel` pref is on, or when there aren't both a left & right room to show.
     * * `null` = `'vertical'` nav layout, or the viewport's `clientWidth` is under `800px`.
     * * Any positive number = left-right panels (i.e., NOT single panel).
     * * Note: PS will only update if the left panel width changes.
     *   - Resizes that don't change the left panel width will not trigger an update.
     * * Note: was called `leftRoomWidth` until PS renamed it in the preact client.
     *
     * @default 0
     */
    public leftPanelWidth?: number = 0;
    public mainmenu: MainMenuRoom;
    /**
     * "The drag-and-drop API is incredibly dumb and doesn't let us know what's being dragged until the `drop` event,
     * so we track what we do know here."
     *
     * * Note that `PS.dragging` will sometimes have type `?` if the drag was initiated outside PS (e.g. dragging a team
     *   from File Explorer to PS) & for security reasons it's impossible to know what they are until they're dropped.
     */
    public dragging?: PSDragging = null;
    /** Tracks whether to display the "Use arrow keys" hint. */
    public arrowKeysUsed = false;
    public newsHTML: string;
    public libsLoaded: LoadTracker;

    /**
     * All PS rooms are expected to responsively support any width from `320px` & up when in single-panel mode.
     *
     * * `minWidth` & `maxWidth` are used purely to calculate the location of the separator in two-panel mode.
     *   - `minWidth` = minimum width as a right-panel.
     *   - `width` = preferred width, minimum width as a left-panel.
     *   - `maxWidth` = maximum width as a left-panel.
     * * Note: PS will only show two panels if it can fit `width` in the left & `minWidth` in the right.
     * * Extra space will be given to the right-panel until it reaches `width`, * then evenly distributed until both
     *   panels reach `maxWidth`.
     * * Any extra space above that will be given to the right-panel.
     */
    public getWidthFor(room: PSRoom): {
      minWidth: number;
      width: number;
      maxWidth: number;
      isMainMenu?: boolean;
    };
    public updateLayout(): boolean;
    public getRoom(element?: HTMLElement | EventTarget, skipClickable?: boolean): PSRoom;
    public dragOnto(fromRoom: PSRoom, toLocation: 'left' | 'right' | 'mini-window', toIndex: number): void;
    public receive(message: string): void;
    public send(message: string, roomid?: RoomID): void;
    public isVisible(room: PSRoom): boolean;
    public calculateLeftPanelWidth(): number;
    public createRoom<TRoom extends PSRoom = PSRoom>(options: RoomOptions): TRoom;
    public getRouteInfo(roomid: RoomID): RoomID;
    public getRouteLocation(roomid: RoomID): PSRoomLocation;
    public getRoute(roomid: RoomID): RoomID;
    public addRoomType(...types: PSRoomPanelSubclass[]): void;
    public updateRoomTypes(): void;
    public setFocus(room: PSRoom): void;
    public focusRoom(roomid: RoomID): boolean;
    public horizontalNav(room = this.room): { rooms: RoomID[]; index: number; };
    public verticalNav(room = this.room): { rooms: RoomID[]; index: number; };
    public focusLeftRoom(): boolean;
    public focusRightRoom(): boolean;
    public focusUpRoom(): boolean;
    public focusDownRoom(): boolean;
    public alert(
      message: string,
      options: {
        okButton?: string;
        parentElem?: HTMLElement;
        width?: number;
      } = {},
    ): void;
    public confirm(
      message: string,
      options: { okButton?: string; cancelButton?: string; } = {},
    ): Promise<void>;
    public prompt(
      message: string,
      options: {
        okButton?: string;
        cancelButton?: string;
        type?: 'text' | 'password' | 'number',
        parentElem?: HTMLElement;
      } = {},
    ): Promise<string>;
    public getPMRoom(userid: ID): ChatRoom;
    /**
     * Low-level room adder. (You probably want to use `join()` instead.)
     *
     * * Focuses the room by default unless `options.autofocus` is `false`.
     * * Auto-focusing will auto-close any popups unless `options.autoclosePopups` is `false`.
     */
    public addRoom(
      options: RoomOptions & {
        autoclosePopups?: boolean;
        autofocus?: boolean;
      },
    ): PSRoom;
    public hideRightRoom(): void;
    public roomVisible(room: PSRoom): boolean;
    public renameRoom(room: PSRoom, id: RoomID): void;
    public isPopup(room?: PSRoom): boolean;
    public isNormalRoom(room?: PSRoom): boolean;
    public moveRoom(room: PSRoom, location: PSRoomLocation, background?: boolean, index?: number): void;
    public removeRoom(room: PSRoom): void;
    /** You shouldn't use this inside a `while` loop apparently o_O */
    public closePopup(skipUpdate?: boolean): void;
    public closeAllPopups(): void;
    public closePopupsAbove(room?: PSRoom, skipUpdate?: boolean): void;
    /** Focus a room, creating it if it doesn't already exist. */
    public join(
      roomid: RoomID,
      options?: Partial<Omit<RoomOptions, 'id'> & {
        autoclosePopups?: boolean;
        autofocus?: boolean;
      }>,
    ): void;
    public leave(roomid: RoomID): void;
    public updateAutojoin(): void;
    public requestNotifications(): void;
    public playNotificationSound(): void;
  }
}
