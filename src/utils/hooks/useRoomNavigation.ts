// import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
// import { logger } from '@showdex/utils/debug';

// const l = logger('@showdex/utils/hooks/useRoomNavigation()');

/**
 * Mimics the room navigation functionality when hitting the left/right arrow keys.
 *
 * * Only listens for left and right arrow keys.
 *   - Ignores hotkeys when an input field is focused.
 *   - Also the reason why `useHotkeys()` is used globally instead of directly using `hotkeys-js` under-the-hood.
 *   - `react-hotkeys-hook` includes some nice features out-of-the-box, such as the one previously mentioned.
 * * As of v1.0.6, when shift is held down while pressing the left/right arrow keys, the current room will be moved
 *   to the left or right panel, respectively.
 * * Seems to work more reliably than Showdown's native jQuery listener since this does not require an input to be focused
 *   for the `'keydown'` handlers to be triggered.
 * * Performs the same routine as the `$(window).on('keydown')` from the client.
 *   - Note that the aforementioned jQuery event listener is not removed, just in case there are other key combos I may have missed.
 *   - Does not seem to be problematic in terms of UX that `react-hotkeys-hook` and jQuery are both listening for `'keydown'` events.
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
  ].join(', '), (e, handler) => {
    // l.debug('handler.key', handler.key);

    const currentRoom = app.curSideRoom || app.curRoom;

    switch (handler.key) {
      case 'left': {
        // l.debug('focusing current room', currentRoom?.id, 'by -1', currentRoom);

        if (!app.focusRoomBy(currentRoom, -1)) {
          return;
        }

        break;
      }

      case 'right': {
        // l.debug('focusing current room', currentRoom?.id, 'by 1', currentRoom);

        if (!app.focusRoomBy(currentRoom, 1)) {
          return;
        }

        break;
      }

      case 'shift+left': {
        // l.debug('moving current room', currentRoom?.id, 'by -1', currentRoom);

        if (!app.moveRoomBy(currentRoom, -1)) {
          return;
        }

        break;
      }

      case 'shift+right': {
        // l.debug('moving current room', currentRoom?.id, 'by 1', currentRoom);

        if (!app.moveRoomBy(currentRoom, 1)) {
          return;
        }

        break;
      }

      default: {
        return;
      }
    }

    e?.preventDefault?.();
    e?.stopImmediatePropagation?.();
  });

  // React.useImperativeHandle(
  //   hotkeysRef,
  //   () => ref?.current,
  // );
};
