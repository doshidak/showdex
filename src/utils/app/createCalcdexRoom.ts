import { calcdexSlice } from '@showdex/redux/store';
import type { RootStore, ShowdexSliceState } from '@showdex/redux/store';
import { createSideRoom } from './createSideRoom';
import { getCalcdexRoomId } from './getCalcdexRoomId';
import { getBattleRoom } from './getBattleRoom';

/**
 * Creates an `HtmlRoom` via `createSideRoom()` specially made to house a `Calcdex`.
 *
 * * Essentially exists to keep all the properties like the room name and icon consistent.
 * * Provide the optional Redux `store` argument to supply the room's `requestLeave()` handler,
 *   which will update the corresponding `BattleRoom` and `CalcdexBattleState`, if any,
 *   when the user leaves the room.
 *
 * @since 1.0.3
 */
export const createCalcdexRoom = (
  battleId: string,
  focus?: boolean,
  store?: RootStore,
): HtmlRoom => {
  if (!battleId) {
    return null;
  }

  const calcdexRoom = createSideRoom(getCalcdexRoomId(battleId), 'Calcdex', {
    icon: 'calculator',
    focus,
  });

  if (!calcdexRoom?.el) {
    return null;
  }

  if (typeof store?.getState === 'function') {
    calcdexRoom.requestLeave = () => {
      // check if there's a corresponding BattleRoom for this Calcdex room
      // (app should be available here; otherwise, createSideRoom() would've returned null)
      const battle = getBattleRoom(battleId)?.battle;

      if (battle?.id) {
        delete battle.calcdexRoom;
        delete battle.calcdexReactRoot;
      }

      // we need to grab a fresher version of the state when this function runs
      // (i.e., do NOT use calcdexSettings here! it may contain a stale version of the settings)
      const settings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;

      if (settings?.destroyOnClose) {
        store.dispatch(calcdexSlice.actions.destroy(battleId));

        if (battle?.id) {
          battle.calcdexDestroyed = true;
        }
      }

      // actually leave the room
      return true;
    };
  }

  return calcdexRoom;
};
