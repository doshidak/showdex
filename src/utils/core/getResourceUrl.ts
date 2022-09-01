import { getExtensionId } from './getExtensionId';

export const getResourceUrl = (fileName: string): string => {
  const extensionId = getExtensionId();

  if (!extensionId || !fileName) {
    return null;
  }

  return `chrome-extension://${extensionId}/${fileName}`;
};
