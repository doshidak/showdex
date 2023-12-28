import { type RootStore, calcdexSlice } from '@showdex/redux/store';
import { nonEmptyObject } from '@showdex/utils/core';
import { purgeHonksDb } from '@showdex/utils/storage';
import { getHonkdexRoomId } from './getHonkdexRoomId';

/**
 * Removes all traces of the provided Honkdex `instanceId`'s.
 *
 * * Removal involves the following steps:
 *   - Leaving the room (if applicable),
 *   - Destroying it from the `CalcdexSliceState`, &
 *   - Finally purging it from Showdex's IndexedDB honks store.
 *
 * @since 1.2.0
 */
export const removeHonkdexInstances = (
  store: RootStore,
  instanceId: string | string[],
): void => {
  const instanceIds = [...(Array.isArray(instanceId) ? instanceId : [instanceId])].filter(Boolean);

  if (!instanceIds.length) {
    return;
  }

  if (nonEmptyObject(app?.rooms)) {
    instanceIds.forEach((id) => {
      const roomId = getHonkdexRoomId(id);

      if (!(roomId in app.rooms)) {
        return;
      }

      app.leaveRoom(roomId);
    });
  }

  if (typeof store?.dispatch === 'function') {
    store.dispatch(calcdexSlice.actions.destroy(instanceIds));
  }

  void purgeHonksDb(instanceIds);
};
