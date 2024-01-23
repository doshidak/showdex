import * as ReactDOM from 'react-dom/client';
import { type CalcdexSliceState, type RootStore, calcdexSlice } from '@showdex/redux/store';
import { nonEmptyObject } from '@showdex/utils/core';
import { getBattleRoom } from '@showdex/utils/host';
import { createCalcdexRoom } from './createCalcdexRoom';
import { getCalcdexRoomId } from './getCalcdexRoomId';

/**
 * Opens an existing Calcdex tab (or battle if overlayed) or creates a new one.
 *
 * * For that last reason, the second `renderer()` argument is required.
 * * Extracted from the Hellodex bootstrapper in v1.2.0.
 *
 * @since 1.0.3
 */
export const openCalcdexInstance = (
  store: RootStore,
  renderer: (
    dom: ReactDOM.Root,
    store: RootStore,
    battleId: string,
  ) => void,
  battleId: string,
): void => {
  const shouldOpen = nonEmptyObject(app?.rooms)
    && typeof store?.getState === 'function'
    && !!battleId
    && typeof renderer === 'function';

  if (!shouldOpen) {
    return;
  }

  // attempt to grab the current battle state
  const battleState = (store.getState()?.calcdex as CalcdexSliceState)?.[battleId];

  // shouldn't be the case, but we'll check again anyways
  if (!battleState?.battleId) {
    return;
  }

  // attempt to grab the current battle room
  const battleRoom = getBattleRoom(battleId);

  // note: battleRoom.id should equal battleRoom.battle.id,
  // which is where battleId should be derived from when the Calcdex state was initialized
  const battleRoomId = battleRoom?.id || battleId;

  // check if the Calcdex is rendered as an overlay for this battle
  if (battleState.renderMode === 'overlay') {
    // if we're not even in the battleRoom anymore, destroy the state
    if (!(battleRoomId in app.rooms)) {
      store.dispatch(calcdexSlice.actions.destroy(battleRoomId));

      return;
    }

    const shouldFocus = !app.curRoom?.id || app.curRoom.id !== battleRoomId;

    if (shouldFocus) {
      app.focusRoom(battleRoomId);
    }

    // we'll toggle it both ways here (only if we didn't have to focus the room),
    // for use as an "emergency exit" (hehe) should the "Close Calcdex" go missing...
    // but it shouldn't tho, think I covered all the bases... hopefully :o
    if (!shouldFocus || !battleState.overlayVisible) {
      battleRoom.toggleCalcdexOverlay?.();
    }

    // for overlays, this is all we'll do since the Calcdex is rendered inside the battle frame
    // (entirely possible to do more like reopen as a tab later, but for v1.0.3, nah)
    return;
  }

  // check if the Calcdex tab is already open
  const calcdexRoomId = getCalcdexRoomId(battleId);

  if (calcdexRoomId in app.rooms) {
    // no need to call app.topbar.updateTabbar() since app.focusRoomRight() will call it for us
    // (app.focusRoomRight() -> app.updateLayout() -> app.topbar.updateTabbar())
    app.focusRoomRight(calcdexRoomId);
  } else {
    // at this point, we need to recreate the room
    // (we should also be in the 'panel' renderMode now)
    const calcdexRoom = createCalcdexRoom(battleId, store, true);

    renderer(
      calcdexRoom.reactRoot,
      store,
      battleRoom?.battle?.id || battleId,
    );

    // if the battleRoom exists, attach the created room to the battle object
    if (battleRoom?.battle?.id) {
      battleRoom.battle.calcdexDestroyed = false; // just in case
      battleRoom.battle.calcdexRoom = calcdexRoom;
    }
  }

  // refocus the battleRoom that the tabbed Calcdex pertains to, if still joined
  if ((!app.curRoom?.id || app.curRoom.id !== battleRoomId) && battleRoomId in app.rooms) {
    app.focusRoom(battleRoomId);
  }
};
