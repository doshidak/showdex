import webpack from 'webpack';
import { config, env as webpackEnv } from '../webpack.config';

// note: this doesn't apply to the webpack config since it's imported before
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

// if ('chromeExtension' in config) {
//   delete config.chromeExtension;
// }

config.mode = 'production';

const packageInfo = [
  process.env.npm_package_name,
  `v${process.env.npm_package_version}`,
  `b${webpackEnv['process.env.BUILD_DATE']}`,
  `(${webpackEnv['process.env.BUILD_TARGET'] || 'unknown target'})`,
];

console.log(
  'Building',
  ...packageInfo,
  'for production...',
);

console.log('Loaded webpack env:', webpackEnv);
console.log('webpack entry:', config.entry);
console.log('webpack output:', config.output);

webpack(config, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log(
    'Build for',
    ...packageInfo,
    'successful!',
  );
});
