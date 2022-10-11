import { getExtensionId, getExtensionProtocol } from '@showdex/utils/core';

/**
 * Cleans up the stack trace paths with `'@showdex'`.
 *
 * @example
 * ```ts
 * // pre-sanitized stack
 * error.stack = `
 * Error: This is a test error.
 *     at createSmogonPokemon (chrome-extension://dabpnahpcemkfbgfbmegmncjllieilai/main.js:53384:11)
 *     at calcSmogonMatchup (chrome-extension://dabpnahpcemkfbgfbmegmncjllieilai/main.js:53174:104)
 * `;
 *
 * sanitizeStackTrace(error);
 *
 * `
 * Error: This is a test error.
 *   at createSmogonPokemon (@showdex/main.js:53384:11)
 *   at calcSmogonMatchup (@showdex/main.js:53174:104)
 * `
 * ```
 * @since 1.0.3
 */
export const sanitizeStackTrace = (error: Error | string): string => {
  const stack = error instanceof Error
    ? error?.stack
    : error;

  const protocol = getExtensionProtocol();
  const extensionId = getExtensionId();

  if (!extensionId) {
    return stack;
  }

  const regExp = new RegExp(`${protocol}:\\/\\/${extensionId}`, 'gi');

  return stack
    .replace(/\n\s{4}/g, '\n  ') // replace 4-length soft tabs with 2
    .replace(regExp, '@showdex');
};
