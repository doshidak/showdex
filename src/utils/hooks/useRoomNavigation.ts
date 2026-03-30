/**
 * @file `useRoomNavigation.ts`
 * @author Keith Choison <keith@tize.io>
 * @since 1.0.5
 */

// import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { detectClassicHost, detectPreactHost } from '@showdex/utils/host';
// import { logger } from '@showdex/utils/debug';

// const l = logger('@showdex/utils/hooks/useRoomNavigation()');

const focusClassicRoomBy = (amount: number): void => {
  if (!detectClassicHost(window)) {
    return;
  }

  const currentRoom = window.app.curSideRoom || window.app.curRoom;

  if (!currentRoom?.id) {
    return;
  }

  // l.debug('moving current room', currentRoom?.id, 'by', amount, currentRoom);
  window.app.focusRoomBy(currentRoom, amount);
};

const moveRoomBy = (amount: number): void => {
  if (detectClassicHost(window)) {
    const currentRoom = window.app.curSideRoom || window.app.curRoom;

    if (!currentRoom?.id) {
      return;
    }

    // l.debug('moving current room', currentRoom?.id, 'by', amount, currentRoom);

    return void window.app.moveRoomBy(currentRoom, amount);
  }

  // note: PS.room includes popups, PS.panel doesn't
  if (!detectPreactHost(window) || !window.PS.panel?.id || !amount) {
    return;
  }

  const leftRoomIndex = window.PS.leftRoomList.indexOf(window.PS.panel.id);
  const rightRoomIndex = window.PS.rightRoomList.indexOf(window.PS.panel.id);

  if (leftRoomIndex < 0 && rightRoomIndex < 0) {
    return;
  }

  if (leftRoomIndex > -1) { // i.e., panel is on the left rn
    const nextIndex = leftRoomIndex + amount;

    if (nextIndex < 0) { // wrap move the left panel back to the end of the right panels
      // l.debug('wrapping left panel', window.PS.panel.id, 'to the right index', window.PS.rightRoomList.length);
      window.PS.moveRoom(window.PS.panel, 'right', false, window.PS.rightRoomList.length);
    } else if (nextIndex >= window.PS.leftRoomList.length) { // wrap move the left panel to the start of the right panels
      // l.debug('wrapping left panel', window.PS.panel.id, 'to the right index', window.PS.leftRoomList.length - nextIndex);
      window.PS.moveRoom(window.PS.panel, 'right', false, window.PS.leftRoomList.length - nextIndex);
    } else {
      // l.debug('moving left panel', window.PS.panel.id, 'to the left index', nextIndex);
      window.PS.moveRoom(window.PS.panel, 'left', false, nextIndex);
    }

    return void window.PS.update();
  }

  // at this point, we're dealing w/ panels on the right
  const nextIndex = rightRoomIndex + amount;

  if (nextIndex < 0) { // wrap move the right panel back to the end of the left panels
    // l.debug('wrapping right panel', window.PS.panel.id, 'to the left index', window.PS.leftRoomList.length);
    window.PS.moveRoom(window.PS.panel, 'left', false, window.PS.leftRoomList.length);
  } else if (nextIndex >= window.PS.rightRoomList.length) { // wrap move the right panel to the start of the left panels
    // l.debug('wrapping right panel', window.PS.panel.id, 'to the left index', window.PS.rightRoomList.length - nextIndex);
    window.PS.moveRoom(window.PS.panel, 'left', false, window.PS.rightRoomList.length - nextIndex);
  } else {
    // l.debug('moving right panel', window.PS.panel.id, 'to the right index', nextIndex);
    window.PS.moveRoom(window.PS.panel, 'right', false, nextIndex);
  }

  window.PS.update();
};

const roomNav = {
  focus: {
    left: (detectPreactHost(window) ? () => {
      window.PS.focusLeftRoom();
    } : detectClassicHost(window) ? () => {
      focusClassicRoomBy(-1);
    } : () => void 0),

    right: (detectPreactHost(window) ? () => {
      window.PS.focusRightRoom();
    } : detectClassicHost(window) ? () => {
      focusClassicRoomBy(1);
    } : () => void 0),
  },

  move: {
    left: () => void moveRoomBy(-1),
    right: () => void moveRoomBy(1),
  },
};

/**
 * Mimics the room navigation functionality when hitting the left/right arrow keys.
 *
 * * Only listens for left & right arrow keys.
 *   - Ignores hotkeys when an input field is focused.
 *   - Also the reason why `useHotkeys()` is used globally instead of directly using `hotkeys-js` under-the-hood.
 *   - `react-hotkeys-hook` includes some nice features out-of-the-box, such as the one previously mentioned.
 * * As of v1.0.6, when shift is held down while pressing the left/right arrow keys, the current room will be moved
 *   to the left or right panel, respectively.
 * * Seems to work more reliably than Showdown's native jQuery listener since this does not require an input to be focused
 *   for the `'keydown'` handlers to be triggered.
 * * Performs the same routine as the `$(window).on('keydown')` from the client.
 *   - Note that the aforementioned jQuery event listener is not removed, just in case there are other key combos I may have missed.
 *   - Doesn't seem to be problematic in terms of UX that `react-hotkeys-hook` & jQuery are both listening for `'keydown'` events.
 * * As of v1.3.0, this now works on the Showdown `'preact'` rewrite, auto-detecting which `__SHOWDEX_HOST` we're on.
 *
 * @see https://github.com/smogon/pokemon-showdown-client/blob/8842fb44ca97f4090d8d78e6b13401c0037e9e10/js/client.js#L599-L677
 * @since 1.0.5
 */
export const useRoomNavigation = (): void => {
  useHotkeys([
    'left',
    'right',
    'shift+left',
    'shift+right',
  ].join(',\x20'), (e, handler) => {
    // l.debug('handler.key', handler.key);

    switch (handler.keys?.[0]) {
      case 'left': roomNav.focus.left(); break;
      case 'right': roomNav.focus.right(); break;
      case 'shift+left': roomNav.move.left(); break;
      case 'shift+right': roomNav.move.right(); break;
      default: return;
    }

    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
  });
};
