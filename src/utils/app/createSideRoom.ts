import { logger } from '@showdex/utils/debug';

export interface SideRoomOptions {
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
}

const minWidth = 320;
const maxWidth = 1024;

const l = logger('@src/utils/app/createSideRoom');

export const createSideRoom = (
  id: string,
  title: string,
  options?: SideRoomOptions,
): HtmlRoom => {
  if (typeof app?._addRoom !== 'function') {
    l.error(
      'Cannot make side room since app._addRoom() is currently unavailable',
      '\n', 'typeof app._addRoom', typeof app?._addRoom,
    );

    return null;
  }

  const {
    icon,
    focus,
  } = options || {};

  let room: HtmlRoom;

  if (id in app.rooms) {
    room = <HtmlRoom> app.rooms[id];

    l.debug('Found existing side room with matching room.id', id);
  } else {
    room = app._addRoom<HtmlRoom>(id, 'html', true, title);
    app.sideRoomList.push(app.roomList.pop());

    l.info('Created side room with room.id', room.id, 'and room.type', room.type);
  }

  if (!room?.el) {
    l.error('Couldn\'t find or make the side room for room.id', id);

    return null;
  }

  // double-check the room's width params
  if (room.minWidth !== minWidth) {
    room.minWidth = minWidth;
  }

  if (room.maxWidth !== maxWidth) {
    room.maxWidth = maxWidth;
  }

  if (icon) {
    // using setTimeout() to put this at the top of the call stack to make sure
    // the tab is rendered on the DOM by the time the call executes, hopefully
    setTimeout(() => {
      // use jQuery to select the tab
      const $tab = $(`a[href*='${room.id}']`);

      // make sure we found a valid tab
      const $tabIcon = $tab.find('i.fa');

      // if the tab isn't rendered yet, attr() will return undefined
      // (in which case our custom icon won't be set... oh well)
      if ($tabIcon.attr('class')?.includes('fa')) {
        $tabIcon.attr('class', `fa fa-${icon}`);
      }
    });
  }

  if (focus) {
    app.focusRoomRight(room.id);
    app.topbar.updateTabbar();
  }

  return room;
};
