import * as ReactDOM from 'react-dom/client';
import { type RootStore } from '@showdex/redux/store';
import { nonEmptyObject } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';
import { createHellodexRoom } from './createHellodexRoom';
import { getHellodexRoomId } from './getHellodexRoomId';

const l = logger('@showdex/utils/app/openHellodexInstance()');

/**
 * Opens the existing Hellodex tab or creates a new one.
 *
 * * New Hellodex instances will only be created if the user isn't currently in the Hellodex room, whether it was left
 *   prior or disabled in the settings.
 *
 * @since 1.2.3
 */
export const openHellodexInstance = (
  store: RootStore,
  renderer: (
    dom: ReactDOM.Root,
    store: RootStore,
  ) => void,
): void => {
  const canOpen = nonEmptyObject(app?.rooms)
    && typeof store?.getState === 'function'
    && typeof renderer === 'function';

  if (!canOpen) {
    l.warn(
      'Couldn\'t open the Hellodex room due to an invalid runtime environment &/or args.',
      '\n', 'app.rooms', '(type)', typeof app?.rooms, '(now)', app?.rooms,
      '\n', 'store.getState()', '(type)', typeof store?.getState,
      '\n', 'renderer()', '(type)', typeof renderer,
    );

    return;
  }

  // check if the user is already in the Hellodex room
  const roomId = getHellodexRoomId();

  if (roomId in app.rooms) {
    return void app.focusRoomRight(roomId);
  }

  const hellodexRoom = createHellodexRoom(store, true);

  if (!hellodexRoom?.reactRoot) {
    l.error(
      'ReactDOM root hasn\'t been properly initialized by createHellodexRoom();',
      'something is horribly wrong here!',
      '\n', 'hellodexRoom', '(id)', roomId, '(type)', typeof hellodexRoom, '(now)', hellodexRoom,
      '\n', 'reactRoot', '(type)', typeof hellodexRoom?.reactRoot, '(now)', hellodexRoom?.reactRoot,
    );

    return;
  }

  renderer(hellodexRoom.reactRoot, store);
};
