import { logger } from '@showdex/utils/debug';

const l = logger('@showdex/utils/host/openUserPopup()');

/**
 * Opens a user popup.
 *
 * @since 0.1.3
 */
export const openUserPopup = (
  username: string,
): void => {
  if (typeof app?.addPopup !== 'function') {
    if (__DEV__) {
      l.warn(
        'Failed to open user popup since app.addPopup() is unavailable',
        '\n', 'typeof app.addPopup', typeof app?.addPopup,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return;
  }

  if (!UserPopup) {
    if (__DEV__) {
      l.warn(
        'Failed to open user popup since UserPopup class global is unavailable',
        '\n', 'typeof app.addPopup', typeof app?.addPopup,
        '\n', 'typeof UserPopup', typeof UserPopup,
        '\n', 'UserPopup', UserPopup,
        '\n', '(You will only see this warning on development.)',
      );
    }

    return;
  }

  app.addPopup(UserPopup, {
    name: username,
    // sourceEl: target,
  });
};
