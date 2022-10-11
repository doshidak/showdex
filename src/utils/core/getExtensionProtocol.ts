import { env } from './getEnv';

export const getExtensionProtocol = (): string => (
  env('build-target') === 'firefox'
    ? 'moz-extension'
    : 'chrome-extension'
);
