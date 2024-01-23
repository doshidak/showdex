import * as ReactDOM from 'react-dom/client';
import { type RootStore, type ShowdexSliceState, calcdexSlice } from '@showdex/redux/store';
import { createHtmlRoom, getBattleRoom } from '@showdex/utils/host';
import { getCalcdexRoomId } from './getCalcdexRoomId';

/**
 * Creates an `HtmlRoom` via `createHtmlRoom()` specially made to house a `Calcdex`.
 *
 * * Essentially exists to keep all the properties like the room name and icon consistent.
 * * Provide the optional Redux `store` argument to supply the room's `requestLeave()` handler,
 *   which will update the corresponding `BattleRoom` and `CalcdexBattleState`, if any,
 *   when the user leaves the room.
 * * As of v1.1.5, this will create a `ReactDOM.Root` from the `Showdown.HtmlRoom`'s `el`
 *   (`HTMLDivElement`), accessible under the `reactRoot` property.
 *   - When this room's `requestLeave()` is called (typically by `app.leaveRoom()` or the user
 *     closing the tab), `reactRoot.unmount()` will be automatically called.
 *
 * @since 1.0.3
 */
export const createCalcdexRoom = (
  battleId: string,
  store?: RootStore,
  focus?: boolean,
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

  calcdexRoom.reactRoot = ReactDOM.createRoot(calcdexRoom.el);

  if (typeof store?.getState === 'function') {
    calcdexRoom.requestLeave = () => {
      // check if there's a corresponding BattleRoom for this Calcdex room
      // (app should be available here; otherwise, createHtmlRoom() would've returned null)
      const battle = getBattleRoom(battleId)?.battle;

      if (battle?.id) {
        delete battle.calcdexRoom;
      }

      // unmount the reactRoot we created earlier
      // (if destroyOnClose is false, the reactRoot will be recreated when the user selects the
      // battle in the Hellodex instances list [via openCalcdexInstance() -> createCalcdexRoom()])
      calcdexRoom.reactRoot?.unmount?.();

      // we need to grab a fresher version of the state when this function runs
      // (i.e., do NOT use calcdexSettings here! it may contain a stale version of the settings)
      const freshSettings = (store.getState()?.showdex as ShowdexSliceState)?.settings?.calcdex;

      if (freshSettings?.destroyOnClose) {
        // clean up allocated memory from Redux for this Calcdex instance
        store.dispatch(calcdexSlice.actions.destroy(battleId));

        if (battle?.id) {
          // technically calcdexReactRoot would only exist for battle-overlayed Calcdexes,
          // but calling it here just in case I screwed something up LOL
          battle.calcdexReactRoot?.unmount?.();
          battle.calcdexDestroyed = true;
        }
      }

      // actually leave the room
      return true;
    };
  }

  return calcdexRoom;
};
