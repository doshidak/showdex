import { env } from '@showdex/utils/core';

/**
 * Returns a one-liner `string` consisting of the package version & build information.
 *
 * @since 0.1.0
 */
export const printBuildInfo = (): string => {
  const packageName = env('package-name');
  const packageVersion = env('package-version');
  const buildDate = env('build-date');
  const buildTarget = env('build-target', 'chrome');
  const buildSuffix = env('build-suffix');

  return packageName
    + (packageVersion ? `-v${packageVersion}` : '')
    + (buildDate ? `-b${buildDate}` : '')
    + (buildSuffix ? `-${buildSuffix}` : '')
    + `${__DEV__ ? '-dev' : ''}`
    + `.${buildTarget}`;
};
