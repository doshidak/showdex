import { constantCase } from 'change-case';

export type EnvDict = Record<string, string>;

/**
 * Convenient factory to parse and read environment variables.
 *
 * * Accepts any case for the env key,
 *   such as `SOME_ENV_VARIABLE`, `some-env-variable`, and `SomeEnvVariable`.
 * * For Webpack and similar bundlers, you'll need to provide a `dict` since the bundler
 *   will directly replace any mention of `process.env.NODE_ENV` (for instance) with the actual value.
 *   - You won't be able to access `process.env` like an object in Node.js environments,
 *     as `process.env` will be `undefined` during runtime.
 *
 * @since 0.1.0
 */
export const createEnvParser = (
  dict: EnvDict = process.env,
  debugKey = 'DEBUG',
) => {
  const env = (
    key: string,
    defaultValue = '',
  ): string => dict?.[constantCase(key)] || defaultValue;

  // env type parsers
  env.int = (
    key: string,
    defaultValue = 0,
  ) => parseInt(env(key), 10) || defaultValue;

  env.float = (
    key: string,
    defaultValue = 0,
  ) => parseFloat(env(key)) || defaultValue;

  env.bool = (
    key: string,
  ) => env(key, 'false').toLowerCase() === 'true';

  // env utilities
  env.exists = (
    key: string,
  ) => constantCase(key) in dict;

  env.debug = (
    debugSubKey: string,
  ) => [
    dict?.NODE_ENV,
    process.env.NODE_ENV,
  ].includes('development') && env.bool(`${debugKey}_${constantCase(debugSubKey)}`);

  env.cmp = (
    key: string,
    testValue: string,
  ) => env(key) === testValue;

  return env;
};
