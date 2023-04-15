import { env } from '@showdex/utils/core';

/**
 * Returns a one-liner `string` consisting of the package version & build information.
 *
 * @since 0.1.0
 */
export const printBuildInfo = (): string => env(
  'build-name',
  `showdex-vX.X.X-bX${__DEV__ ? '-dev' : ''}.chrome`,
);
