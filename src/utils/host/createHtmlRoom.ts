import { logger } from '@showdex/utils/debug';

export interface HtmlRoomOptions {
  /**
   * Whether to create a side room, which will appear on the right in left-right panel mode.
   *
   * @since 1.1.1
   */
  side?: boolean;

  /**
   * Name of icon from *Font Awesome* used in the tab.
   *
   * * Do not include the `'fa-'` prefix.
   *
   * @example 'calculator'
   * @since 0.1.3
   */
  icon?: string;

  /**
   * Whether to focus the room once created.
   *
   * @since 0.1.0
   */
  focus?: boolean;

  /**
   * Minimum width of the room, in **pixels**, presumably.
   *
   * @default 320
   * @since 1.0.5
   */
  minWidth?: number;

  /**
   * Maxmimum width of the room, in **pixels**, presumably.
   *
   * @default 1024
   * @since 1.0.5
   */
  maxWidth?: number;
}

const l = logger('@showdex/utils/host/createHtmlRoom()');

/**
 * Abstraction that creates an `HtmlRoom` in the Showdown client.
 *
 * * As of v1.1.0, this has been renamed from `createSideRoom()` since there's a Calcdex setting
 *   to open rooms on the left now (i.e., just regular rooms, not side rooms).
 *
 * @since 0.1.0
 */
export const createHtmlRoom = (
  id: string,
  title: string,
  options?: HtmlRoomOptions,
): Showdown.HtmlRoom => {
  if (typeof app?._addRoom !== 'function') {
    l.error(
      `Cannot make a ${options?.side ? 'side ' : ''}room since app._addRoom() is unavailable`,
      '\n', 'typeof app._addRoom', typeof app?._addRoom,
    );

    return null;
  }

  const {
    side,
    icon,
    focus,
    minWidth = 320,
    maxWidth = 1024,
  } = options || {};

  let room: Showdown.HtmlRoom;

  if (id in app.rooms) {
    room = app.rooms[id] as Showdown.HtmlRoom;

    // l.debug(`Found existing ${side ? 'side ' : ''}room with matching room.id`, id);
  } else {
    // create a new room (will add the new room to the app.roomList array)
    room = app._addRoom<Showdown.HtmlRoom>(id, 'html', true, title);

    // remove the initial "Page unavailable" HTML
    room.$el.html('');

    // if a side room, add the room to the sideRoomList (also in the app.rooms object)
    if (side) {
      room.isSideRoom = true;
      app.sideRoomList.push(app.roomList.pop());
    }

    // l.debug(`Created ${side ? 'side ' : ''}room with room.id`, room.id, 'and room.type', room.type);
  }

  if (!room?.el) {
    l.error(`Couldn\'t find or make the ${side ? 'side ' : ''}room for room.id`, id);

    return null;
  }

  // double-check the room's width params
  // if (room.minWidth !== minWidth) {
  //   room.minWidth = minWidth;
  // }

  // if (room.maxWidth !== maxWidth) {
  //   room.maxWidth = maxWidth;
  // }

  room.minWidth = minWidth;
  room.maxWidth = maxWidth;

  if (icon) {
    // hook directly into renderRoomTab(), which is hacky as hell, but necessary since it gets called pretty frequently
    // (using jQuery to edit the class names isn't viable since the icon will just get replaced again)
    const originalRenderer = app.topbar.renderRoomTab.bind(app.topbar) as typeof app.topbar.renderRoomTab;

    app.topbar.renderRoomTab = function renderCustomRoomTab(appRoom, appRoomId) {
      const roomId = appRoom?.id || appRoomId;
      const buf = originalRenderer(appRoom, appRoomId);

      // set the custom icon for the current room only
      // (note: only HTMLRooms get the 'fa-file-text-o' [Font Awesome Outlined File Text] icon)
      if (roomId === id) {
        return buf.replace('fa-file-text-o', `fa-${icon}`);
      }

      return buf;
    };
  }

  if (focus) {
    app[side ? 'focusRoomRight' : 'focusRoom'](room.id);
  }

  app.topbar.updateTabbar();

  return room;
};
