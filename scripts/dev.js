import path from 'path';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import { buildTargets, config, env } from '../webpack.config';

if (!env.PACKAGE_VERSION) {
  console.error('Please run this script through npm or yarn.');
  process.exit(1);
}

process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

if (!buildTargets.includes(env.BUILD_TARGET)) {
  console.error(`"${env.BUILD_TARGET}" is not a valid BUILD_TARGET`);
  console.error('Valid values for BUILD_TARGET are:', buildTargets.join(', '));
  process.exit(1);
}

const host = env.DEV_HOSTNAME;
const port = env.DEV_PORT;
const url = `${host}:${port}`;

(async () => {
  const server = new WebpackDevServer({
    host,
    port,

    devMiddleware: {
      publicPath: `http://${url}/`,
      writeToDisk: true,
    },

    allowedHosts: 'all',
    client: false,
    https: false,
    hot: 'only', // default: true
    liveReload: false, // default: true

    headers: {
      'Access-Control-Allow-Origin': '*',
    },

    static: {
      directory: path.join(__dirname, 'build'),
    },
  }, webpack(config));

  console.log('Starting', env.BUILD_NAME, 'development server...');
  console.log('env:', env);

  await server.start();

  console.log('Development server started for', env.BUILD_NAME, 'at', url);
})();
