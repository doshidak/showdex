import * as ReactDOM from 'react-dom/client';
import { createHtmlRoom } from '@showdex/utils/host';
import { getHonkdexRoomId } from './getHonkdexRoomId';

/**
 * Creates an `HtmlRoom` via `createHtmlRoom()` specially made to house a `Honkdex`.
 *
 * * Providing a falsy `instanceId` of any kind will fallback to a random UUID.
 * * honk honk
 *
 * @since 1.2.0
 */
export const createHonkdexRoom = (
  instanceId?: string,
  focus?: boolean,
): Showdown.HtmlRoom => {
  const honkdexRoom = createHtmlRoom(getHonkdexRoomId(instanceId), 'Honkdex', {
    side: true,
    icon: 'car',
    focus,
  });

  if (!honkdexRoom?.el) {
    return null;
  }

  honkdexRoom.reactRoot = ReactDOM.createRoot(honkdexRoom.el);

  return honkdexRoom;
};
