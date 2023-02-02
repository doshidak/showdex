import { calcdexSlice } from '@showdex/redux/store';
import type { RootStore, ShowdexSliceState } from '@showdex/redux/store';
import { createHtmlRoom } from './createHtmlRoom';
import { getCalcdexRoomId } from './getCalcdexRoomId';
import { getBattleRoom } from './getBattleRoom';

/**
 * Creates an `HtmlRoom` via `createHtmlRoom()` specially made to house a `Calcdex`.
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
): Showdown.HtmlRoom => {
  if (!battleId) {
    return null;
  }

  const settings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;

  // if the openOnPanel setting is falsy, default to the 'showdown' behavior
  const side = settings?.openOnPanel === 'right'
    || ((!settings?.openOnPanel || settings.openOnPanel === 'showdown') && !Dex?.prefs('rightpanelbattles'));

  const calcdexRoom = createHtmlRoom(getCalcdexRoomId(battleId), 'Calcdex', {
    side,
    icon: 'calculator',
    focus,
    maxWidth: 650,
  });

  if (!calcdexRoom?.el) {
    return null;
  }

  if (typeof store?.getState === 'function') {
    calcdexRoom.requestLeave = () => {
      // check if there's a corresponding BattleRoom for this Calcdex room
      // (app should be available here; otherwise, createHtmlRoom() would've returned null)
      const battle = getBattleRoom(battleId)?.battle;

      if (battle?.id) {
        delete battle.calcdexRoom;
        // delete battle.calcdexReactRoot; // update (2023/02/01): no longer exists in battle
      }

      // we need to grab a fresher version of the state when this function runs
      // (i.e., do NOT use calcdexSettings here! it may contain a stale version of the settings)
      const freshSettings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;

      if (freshSettings?.destroyOnClose) {
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
