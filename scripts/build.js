import webpack from 'webpack';
import { buildTargets, config, env } from '../webpack.config';

if (!env.PACKAGE_VERSION) {
  console.error('Please run this script through npm or yarn.');
  process.exit(1);
}

// note: this doesn't apply to the webpack config since it's imported before
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

if (!buildTargets.includes(env.BUILD_TARGET)) {
  console.error(`"${env.BUILD_TARGET}" is not a valid BUILD_TARGET`);
  console.error('Valid BUILD_TARGET values are:', buildTargets.join(', '));
  process.exit(1);
}

config.mode = 'production';

console.log('Building', env.BUILD_NAME, 'for production...');
console.log('env:', env);
console.log('entry:', config.entry);
console.log('output.path:', config.output.path);

webpack(config, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('Build for', env.BUILD_NAME, 'successful!');
});
