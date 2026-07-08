import webpack from 'webpack';
import { buildTargets, config, env } from '../webpack.config.js';

if (!env.PACKAGE_VERSION) {
  console.error('Please run this script through pnpm.');
  process.exit(1);
}

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

webpack(config, (err, stats) => {
  // `err` only catches fatal (config-level) failures; compilation errors -- e.g. a
  // Module not found from an undeclared dep -- surface via stats.hasErrors() & would
  // otherwise print "successful!" + exit 0 WITHOUT emitting to dist (which is exactly
  // how the v1.4.0 Firefox source build got rejected by AMO for "not reproducing").
  if (err) {
    console.error(err);
    process.exit(1);
  }

  if (stats?.hasErrors()) {
    console.error(stats.toString({ all: false, errors: true, colors: true }));
    console.error('Build for', env.BUILD_NAME, 'FAILED (see errors above).');
    process.exit(1);
  }

  if (stats?.hasWarnings()) {
    console.warn(stats.toString({ all: false, warnings: true, colors: true }));
  }

  console.log('Build for', env.BUILD_NAME, 'successful!');
});
