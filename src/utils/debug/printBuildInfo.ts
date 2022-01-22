export const printBuildInfo = (): string => (
  `${process.env.PACKAGE_NAME} v${process.env.PACKAGE_VERSION} ` +
  `b${process.env.PACKAGE_BUILD_DATE}` +
  `-${__DEV__ ? 'dev' : 'prod'}`
);
