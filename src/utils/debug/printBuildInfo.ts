import { env } from '@showdex/utils/core';

export const printBuildInfo = (): string => (
  env('package-name')
    + `-v${env('package-version')}`
    + `-b${env('build-date')}`
    + `${__DEV__ ? '-dev' : ''}`
    + `.${env('build-target', 'chrome')}`
);
