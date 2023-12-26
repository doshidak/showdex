import { env } from '@showdex/utils/core';

/* eslint-disable @typescript-eslint/indent */

/**
 * Retrieves the stored item with the specified `envKey` in `LocalStorage`.
 *
 * * Note that `envKey` corresponds to an environment variable, accessed via `env()`!
 * * `null` is returned as the default value when accessing the stored item fails.
 *   - This includes a falsy value stored in the determined `LocalStorage` key from `envKey`.
 *
 * @since 1.0.3
 */
export const readLocalStorageItem = <
  T extends string,
>(
  envKey: string,
): T => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const key = env(envKey);

  if (!key) {
    return null;
  }

  return localStorage.getItem(key) as T || null;
};

/* eslint-enable @typescript-eslint/indent */

/**
 * Sets the stored item with the specified `envKey` to `value` in `LocalStorage`.
 *
 * * Note that `envKey` corresponds to an environment variable, accessed via `env()`!
 *
 * @since 1.0.3
 */
export const writeLocalStorageItem = (
  envKey: string,
  value: string,
): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const key = env(envKey);

  if (!key) {
    return;
  }

  // setTimeout() to make it non-blocking
  setTimeout(() => localStorage.setItem(key, value), 0);
};

/**
 * Clears/removes the stored item with the specified `envKey` in `LocalStorage`.
 *
 * * Note that `envKey` corresponds to an environment variable, accessed via `env()`!
 *
 * @since 1.0.3
 */
export const purgeLocalStorageItem = (
  envKey: string,
): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const key = env(envKey);

  if (!key) {
    return;
  }

  setTimeout(() => localStorage.removeItem(key), 0);
};
