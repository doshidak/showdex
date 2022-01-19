process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('../webpack.config');

const env = dotenv.config({ path: path.join(__dirname, '../.env') }).parsed;

Object.entries(env).forEach(([key, value]) => {
  // ok: PORT, SERVER_URL, HAX_MULTIPLIER
  // bad: __DEV__, BABEL_*, NODE_*, npm_*
  if (!(key in process.env) && !/^(?:__|BABEL_|NODE_|npm_)[a-z0-9_]+(?:__)?$/i.test(key)) {
    process.env[key] = JSON.stringify(value || '');
  }
});

const hostname = process.env.DEV_HOSTNAME;
const port = process.env.DEV_PORT;
const hot = process.env.DEV_HMR_ENABLED === 'true';

if ('hmrExclude' in (config.chromeExtension || {}) && Array.isArray(config.chromeExtension.hmrExclude)) {
  const { hmrExclude } = config.chromeExtension;

  hmrExclude.filter((key) => !hmrExclude.includes(key)).forEach((key) => {
    config.entry[key] = [
      'webpack/hot/dev-server',
      `webpack-dev-server/client?hostname=${hostname}&port=${port}&hot=${hot}`,
      ...config.entry[key],
    ];
  });

  delete config.chromeExtension;
}

if (hot) {
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
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
  hot: false,

  headers: {
    'Access-Control-Allow-Origin': '*',
  },

  static: {
    directory: path.join(__dirname, '../build'),
  },
}, webpack(config));

if ('accept' in (module.hot || {}) && typeof module.hot.accept === 'function') {
  module.hot.accept();
}

(async () => { await server.start(); })();
