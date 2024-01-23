import * as ReactDOM from 'react-dom/client';
import { type RootStore, type ShowdexSliceState } from '@showdex/redux/store';
import { createHtmlRoom } from '@showdex/utils/host';
import { getHellodexRoomId } from './getHellodexRoomId';

/**
 * Creates an `HtmlRoom` via `createHtmlRoom()` specially made to house a `Hellodex`.
 *
 * * Essentially exists to keep all the properties like the room name and icon consistent.
 * * Auto-focuses the room once created, but this behavior can be disabled if `focusRoomsRoom` of
 *   the user's `ShowdexHellodexSettings` is `true`.
 * * Creates a `ReactDOM.Root` from the `Showdown.HtmlRoom`'s `el` (`HTMLDivElement`), accessible
 *   under the `reactRoot` property.
 *   - When this room's `requestLeave()` is called (typically by `app.leaveRoom()` or the user
 *     closing the tab), `reactRoot.unmount()` will be automatically called.
 *
 * @since 1.1.5
 */
export const createHellodexRoom = (
  store?: RootStore,
  focus?: boolean,
): Showdown.HtmlRoom => {
  const settings = (store?.getState()?.showdex as ShowdexSliceState)?.settings?.hellodex;
  const shouldFocus = focus || !settings?.focusRoomsRoom;

  const hellodexRoom = createHtmlRoom(getHellodexRoomId(), 'Hellodex', {
    side: true,
    icon: Math.random() > 0.5 ? 'smile-o' : 'heart',
    focus: shouldFocus,
  });

  if (!hellodexRoom?.el) {
    return null;
  }

  hellodexRoom.reactRoot = ReactDOM.createRoot(hellodexRoom.el);

  // override the requestLeave() handler to unmount the reactRoot
  hellodexRoom.requestLeave = () => {
    // unmount the reactRoot we created earlier
    hellodexRoom.reactRoot?.unmount?.();

    // actually leave the room
    return true;
  };

  return hellodexRoom;
};
