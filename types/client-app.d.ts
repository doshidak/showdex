/**
 * client-app.d.ts
 *
 * Provides global `app` typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface ClientApp {
    /**
     * @default '/'
     */
    root: string;

    /**
     * @default
     * ```ts
     * { '*path': 'dispatchFragment' }
     * ```
     */
    routes: Record<string, string>;

    /**
     * @default
     * ```ts
     * { 'submit form': 'submitSend' }
     * ```
     */
    events: Record<string, string>;

    /**
     * @default false
     */
    focused: boolean;

    /**
     * @default true
     */
    fixedWidth: boolean;

    fragment?: string;
    initialFragment: string;

    topbar: ClientTopbar;
    user: ClientUser;
    roomList: ClientRoom[];
    draggingLoc?: number;
    draggingRoom?: string;
    draggingRoomList?: string;
    rooms: { [roomid: string]: ClientRoom; };
    roomsData: ClientRoomsData;
    roomsFirstOpen: number;
    curRoom?: ClientRoom;
    curSideRoom?: ClientRoom;
    sideRoomList: ClientRoom[];
    sideRoom?: ClientRoom;
    draggingSideRoom?: ClientRoom;
    // popups?: ClientPopup[];

    /**
     * @default {}
     */
    ignore: Record<string, unknown>;

    supports?: {
      formatColumns: boolean;
    };

    hostCheckInterval: number;
    isDisconnected: boolean;
    reconnectPending: boolean;

    initialize(): void;
    initializeConnection(): void;
    connect(): void;
    dispatchFragment(fragment: string): void;
    send(data: string, room?: string | boolean): void;
    serializeForm(form: HTMLFormElement, checkboxOnOff?: boolean): [string, (string | number | boolean)?][];
    submitSend(e: Event): void;
    sendTeam(team: ClientTeam): void;
    receive(data: string): void;
    saveIgnore(): void;
    loadIgnore(): void;
    parseGroups(groupsList: string): void;
    parseFormats(formatsList: string[]): void;
    uploadReplay(data: { id: string; password?: string; silent?: boolean; log?: string; }): void;
    roomsResponse(data: ClientRoomsData): void;
    addGlobalListeners(): void;
    initializeRooms(): void;
    resize(): void;
    joinRoom(id: string, type?: ClientRoomType, nojoin?: boolean): ClientRoom;
    unjoinRoom(id: string, reason?: string): void;
    tryJoinRoom(id: string): void;
    _addRoom<T extends ClientRoom = ClientRoom>(id: string, type?: ClientRoomType, nojoin?: boolean, title?: string): T;
    focusRoom(id: string, focusTextbox?: boolean): boolean;
    focusRoomLeft(id: string): boolean;
    focusRoomRight(id: string): boolean;
    updateLayout(): void;
    updateSideRoom(id: string): void;
    leaveRoom(id: string, e?: Event): boolean;
    renameRoom(id: string, newid: string, newtitle?: string): boolean;
    removeRoom(id: string, alreadyLeft?: boolean): boolean;
    moveRoomBy(room: ClientRoom, amount: number): boolean;
    focusRoomBy(room: ClientRoom, amount: number, focusTextbox?: boolean): boolean;
    openInNewWindow(url: string): void;
    clickLink(e: Event): boolean;
    roomTitleChanged(room: ClientRoom): void;
    updateTitle(room: ClientRoom): void;
    updateAutojoin(): void;
    playNotificationSound(): void;
    initializePopups(): void;
    addPopup<TPopup extends ClientPopup>(type: TPopup, data?: Partial<TPopup>): TPopup;
    addPopupMessage(message: string): void;
    addPopupPrompt(message: string, buttonOrCallback?: HTMLButtonElement | ((e?: Event) => void), callback?: (e?: Event) => void): void;
    closePopup(id: string): boolean;
    dismissPopups(): boolean;
  }
}
