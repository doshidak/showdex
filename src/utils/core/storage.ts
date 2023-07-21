import { env } from './getEnv';

/**
 * Retrieves the stored item with the specified `envKey` in `LocalStorage`.
 *
 * * Note that `envKey` corresponds to an environment variable, accessed via `env()`!
 * * `null` is returned as the default value when accessing the stored item fails.
 *   - This includes a falsy value stored in the determined `LocalStorage` key from `envKey`.
 *
 * @since 1.0.3
 */
export const getStoredItem = <T extends string>(envKey: string): T => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const key = env(envKey);

  if (!key) {
    return null;
  }

  return localStorage.getItem(key) as T || null;
};

/**
 * Sets the stored item with the specified `envKey` to `value` in `LocalStorage`.
 *
 * * Note that `envKey` corresponds to an environment variable, accessed via `env()`!
 *
 * @since 1.0.3
 */
export const setStoredItem = (envKey: string, value: string): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const key = env(envKey);

  if (!key) {
    return;
  }

  localStorage.setItem(key, value);
};

/**
 * Clears/removes the stored item with the specified `envKey` in `LocalStorage`.
 *
 * * Note that `envKey` corresponds to an environment variable, accessed via `env()`!
 *
 * @since 1.0.3
 */
export const clearStoredItem = (envKey: string): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const key = env(envKey);

  if (!key) {
    return;
  }

  localStorage.removeItem(key);
};
