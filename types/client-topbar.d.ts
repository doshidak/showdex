/**
 * client-topbar.d.ts
 *
 * Provides topbar typings for the live PS client running on Backbone.js.
 *
 * @author Keith Choison <keith@tize.io>
 */

declare namespace Showdown {
  interface ClientTopbar {
    cid: string;

    el?: HTMLDivElement;
    $el?: JQuery<HTMLDivElement>;
    $tabbar?: JQuery<HTMLDivElement>;
    $userbar?: JQuery<HTMLDivElement>;

    /**
     * @default false
     */
    dragging: boolean;

    /**
     * @default
     * {
     *   'click a': 'click',
     *   'click .username': 'clickUsername',
     *   'click button': 'dispatchClickButton',
     *   'dblclick button[name=openSounds]': 'toggleMute',
     *   'dragstart .roomtab': 'dragStartRoom',
     *   'dragend .roomtab': 'dragEndRoom',
     *   'dragenter .roomtab': 'dragEnterRoom',
     *   'dragover .roomtab': 'dragEnterRoom',
     * }
     */
    events?: Record<string, string>;

    initialize(): void;
    updateUserbar(): void;
    login(): void;
    openSounds(): void;
    openOptions(): void;
    clickUsername(e: Event): void;
    toggleMute(): void;
    renderRoomTab(room: ClientRoom, id: string): string;
    updateTabbar(): void;
    updateTabbarMini(): void;
    dispatchClickButton(e: Event): void;
    click(e: Event): void;
    closeRoom(roomid: string, button?: HTMLButtonElement, e?: Event): void;
    tablist(): void;
    roomidOf(room: ClientRoom): string;
    dragStartRoom(e: DragEvent): void;
    dragEnterRoom(e: DragEvent): void;
    dragEndRoom?(e: DragEvent): void;
  }
}
