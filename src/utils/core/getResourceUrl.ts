import { getExtensionId } from './getExtensionId';
import { getExtensionProtocol } from './getExtensionProtocol';

export const getResourceUrl = (fileName: string): string => {
  const protocol = getExtensionProtocol();
  const extensionId = getExtensionId();

  if (!extensionId || !fileName) {
    return null;
  }

  return `${protocol}://${extensionId}/${fileName}`;
};
