import { env } from './getEnv';
import { getExtensionId } from './getExtensionId';

export const getResourceUrl = (fileName: string): string => {
  const extensionId = getExtensionId();

  if (!extensionId || !fileName) {
    return null;
  }

  const protocol = env('build-target') === 'firefox'
    ? 'moz-extension'
    : 'chrome-extension';

  return `${protocol}://${extensionId}/${fileName}`;
};
