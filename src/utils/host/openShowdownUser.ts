import { env } from '@showdex/utils/core';
import { logger } from '@showdex/utils/debug';

/**
 * `windowFeatures` passed to the built-in `window.open()`.
 *
 * @warning Do not specify `'noreferrer'`, or else none of the other window features (like `width` and `height`) will be applied!
 * @warning Do not specify `'noopener'`, or else `window.opener` will return `null` instead of the desired `Window`!
 * @since 0.1.2
 */
const ShowdownUserWindowFeatures = [
  'top=0',
  `left=${typeof window === 'undefined' ? 0 : (window.screen?.width ?? 960) - 960}`,
  'width=620',
  'height=800',
  'resizable',
  'scrollbars',
  'status',
].join(',');

const l = logger('@showdex/utils/host/openShowdownUser()');

/**
 * Opens a popup window for the user's page on Showdown.
 *
 * @param name Username. Duh.
 * @since 0.1.2
 */
export const openShowdownUser = (
  name: string,
): WindowProxy => {
  if (typeof window === 'undefined') {
    l.warn(
      'could not find the global window object, probably because you\'re running this in a Node.js environment',
      '\n', 'typeof window', typeof window,
      '\n', 'name', name,
    );

    return null;
  }

  if (!name) {
    l.warn(
      'you forgot to provide the name, dummy!',
      '\n', 'name', name,
    );

    return null;
  }

  const windowUrl = [
    env('showdown-users-url'),
    name,
  ].filter(Boolean).join('/');

  return window.open(
    windowUrl,
    'ShowdownUser',
    ShowdownUserWindowFeatures,
  );
};
