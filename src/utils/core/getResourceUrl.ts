import { env } from './getEnv';
import { getExtensionId } from './getExtensionId';
import { getExtensionProtocol } from './getExtensionProtocol';

export const getResourceUrl = (
  fileName: string,
): string => {
  if (!fileName) {
    return null;
  }

  const protocol = getExtensionProtocol();

  if (env('build-target') === 'standalone') {
    const prefix = env('standalone-resource-prefix');

    return (
      protocol
        ? `${protocol}://${prefix || ''}/${fileName}`
        : `/${prefix || ''}/${fileName}`
    ).replace(/(?<!:)\/{2,}/g, '/');
  }

  // we should have a protocol at this point (optional only for 'standalone' build targets)
  if (!protocol) {
    return null;
  }

  const extensionId = getExtensionId();

  if (!extensionId) {
    return null;
  }

  return `${protocol}://${extensionId}/${fileName}`;
};
