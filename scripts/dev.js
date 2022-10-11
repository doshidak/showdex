import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { config, env as webpackEnv, printableEnv } from '../webpack.config';

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

// note: __dirname doesn't exist in ESModules, but since we imported the webpack config,
// the __dirname is defined as the project root
const env = dotenv.config({ path: path.join(__dirname, '.env') }).parsed;

Object.entries(env).forEach(([key, value]) => {
  // ok: PORT, SERVER_URL, HAX_MULTIPLIER
  // bad: __DEV__, BABEL_*, NODE_*, npm_*
  if (!(key in process.env) && !/^(?:__|BABEL_|NODE_|npm_)[a-z0-9_]+(?:__)?$/i.test(key)) {
    process.env[key] = JSON.stringify(value || '');
  }
});

const hostname = process.env.DEV_HOSTNAME;
const port = process.env.DEV_PORT;
// const hot = process.env.DEV_HMR_ENABLED === 'true';

// const hasExclusions = 'hmrExclude' in (config.chromeExtension || {});

// Object.keys(config.entry).forEach((key) => {
//   if (hasExclusions && config.chromeExtension.hmrExclude.includes(key)) {
//     return;
//   }
//
//   config.entry[key] = [
//     'webpack/hot/dev-server',
//     `webpack-dev-server/client?hostname=${hostname}&port=${port}&hot=${hot}&protocol=ws`,
//   ].concat(config.entry[key]);
// });

// if (hasExclusions) {
//   delete config.chromeExtension;
// }

// if (hot) {
//   config.plugins.push(new webpack.HotModuleReplacementPlugin());
// }

const packageInfo = [
  process.env.npm_package_name,
  `v${process.env.npm_package_version}`,
  `b${webpackEnv['process.env.BUILD_DATE']?.replace(/"/g, '')}`,
  `(${webpackEnv['process.env.BUILD_TARGET']?.replace(/"/g, '') || 'unknown target'})`,
];

(async () => {
  // yeet the `build` dir, if it exists
  const buildDirPath = path.join(__dirname, 'build');
  const buildDirExists = await fs.pathExists(buildDirPath);

  if (buildDirExists) {
    await fs.remove(buildDirPath);
  }

  const server = new WebpackDevServer({
    host: hostname,
    port,

    devMiddleware: {
      publicPath: `http://${hostname}:${port}/`,
      writeToDisk: true,
    },

    allowedHosts: 'all',
    client: false,
    https: false,
    // hot: false,

    headers: {
      'Access-Control-Allow-Origin': '*',
    },

    static: {
      directory: buildDirPath,
    },
  }, webpack(config));

  // if ('accept' in (module.hot || {}) && typeof module.hot.accept === 'function') {
  //   module.hot.accept();
  // }

  console.log(
    'Starting',
    ...packageInfo,
    'development server...',
  );

  console.log('Loaded node env:', env);
  console.log('Loaded webpack env:', printableEnv);

  await server.start();

  console.log(
    'Development server started for',
    ...packageInfo,
    'at',
    `${hostname}:${port}`,
  );
})();
