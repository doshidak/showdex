// import * as React from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/utils/hooks/useRoomNavigation');

/**
 * Mimics the room navigation functionality when hitting the left/right arrow keys.
 *
 * * Only listens for left and right arrow keys.
 *   - Ignores hotkeys when an input field is focused.
 *   - Also the reason why `useHotkeys()` is used globally instead of directly using `hotkeys-js` under-the-hood.
 *   - `react-hotkeys-hooks` includes some nice features out-of-the-box, such as the one previously mentioned.
 * * Performs the same routine as the `$(window).on('keydown')` from the client.
 *
 * @since 1.0.5
 */
export const useRoomNavigation = (): void => {
  useHotkeys('left, right', (e, handler) => {
    l.debug('handler.key', handler.key);

    const currentRoom = app.curSideRoom || app.curRoom;

    switch (handler.key) {
      case 'left': {
        l.debug('focusing room by -1 from', currentRoom);

        if (!app.focusRoomBy(currentRoom, -1)) {
          return;
        }

        break;
      }

      case 'right': {
        l.debug('focusing room by 1 from', currentRoom);

        if (!app.focusRoomBy(currentRoom, 1)) {
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
