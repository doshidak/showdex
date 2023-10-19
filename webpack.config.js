import path from 'path';
import { fileURLToPath } from 'url';
import { NIL as NIL_UUID, v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import ZipPlugin from 'zip-webpack-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import VisualizerPlugin from 'webpack-visualizer-plugin2';
import manifest from './src/manifest' assert { type: 'json' };

const __DEV__ = process.env.NODE_ENV !== 'production';
const mode = __DEV__ ? 'development' : 'production';

export const buildTargets = [
  'chrome',
  'firefox',
];

// __dirname is not available in ESModules lmao
if (typeof __dirname !== 'string') {
  global.__dirname = path.dirname(fileURLToPath(import.meta.url));
}

const sanitizeEnv = (
  value,
  defaultValue = '',
) => String(value || defaultValue)
  .toLowerCase()
  .replace(/[^a-z0-9\.\,\-]+/gi, '')
  .replace(/\s+/g, '-');

const finalEnv = {
  ...dotenv.config({
    path: path.join(__dirname, '.env'),
  }).parsed,

  BUILD_DATE: Date.now().toString(16).toUpperCase(),
  BUILD_SUFFIX: sanitizeEnv(process.env.BUILD_SUFFIX),
  BUILD_TARGET: sanitizeEnv(process.env.BUILD_TARGET, buildTargets[0] || 'chrome'),
  NODE_ENV: mode,
  PACKAGE_AUTHOR_EMAIL: process.env.npm_package_author_email,
  PACKAGE_AUTHOR_NAME: process.env.npm_package_author_name,
  PACKAGE_DESCRIPTION: process.env.npm_package_description,
  PACKAGE_NAME: process.env.npm_package_name || 'showdex',
  PACKAGE_URL: process.env.npm_package_homepage,
  PACKAGE_VERSION: process.env.npm_package_version,
  PACKAGE_VERSION_SUFFIX: sanitizeEnv(process.env.PACKAGE_VERSION_SUFFIX),
};

if (!finalEnv.UUID_NAMESPACE || finalEnv.UUID_NAMESPACE === NIL_UUID) {
  finalEnv.UUID_NAMESPACE = uuidv4();
}

finalEnv.BUILD_NAME = [
  finalEnv.PACKAGE_NAME,
  `-v${finalEnv.PACKAGE_VERSION || 'X.X.X'}`,
  !!finalEnv.PACKAGE_VERSION_SUFFIX && `-${finalEnv.PACKAGE_VERSION_SUFFIX}`,
  !!finalEnv.BUILD_DATE && `-b${finalEnv.BUILD_DATE}`,
  !!finalEnv.BUILD_SUFFIX && `-${finalEnv.BUILD_SUFFIX}`,
  __DEV__ && '-dev',
  `.${finalEnv.BUILD_TARGET}`,
].filter(Boolean).join('');

export const env = Object.entries(finalEnv).sort(([a], [b]) => (
  a === b
    ? 0
    : (a > b ? -1 : 1)
)).reduce((prev, [key, value]) => {
  if (key) {
    prev[key] = value;
  }

  return prev;
}, {
  __DEV__,
});

const webpackEnv = Object.entries(env).reduce((prev, [key, value]) => {
  if (key) {
    prev[`${key.startsWith('__') ? '' : 'process.env.'}${key}`] = JSON.stringify(value || '');
  }

  return prev;
}, {});

const entry = {
  main: path.join(__dirname, 'src', 'main.ts'),
  content: path.join(__dirname, 'src', 'content.ts'),
  background: path.join(__dirname, 'src', 'background.ts'),
};

// background is not used on Firefox
if (env.BUILD_TARGET === 'firefox') {
  delete entry.background;
}

const output = {
  path: path.join(__dirname, __DEV__ ? 'build' : 'dist', env.BUILD_TARGET),
  filename: '[name].js',
  clean: false, // clean output.path dir before emitting files (update: cleaning it up ourselves via rimraf)
  publicPath: 'auto',
};

const moduleRules = [{
  test: /\.s?css$/i,
  use: ['style-loader', {
    loader: 'css-loader',
    options: {
      sourceMap: true,
      modules: {
        auto: true, // only files ending in .module.s?css will be treated as CSS modules
        localIdentName: '[name]-[local]--[hash:base64:5]', // e.g., 'Caldex-module-content--mvN2w'
      },
    },
  }, {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
      postcssOptions: {
        // autoprefixer so we don't ever need to specify CSS prefixes like `-moz-` and `-webkit-`
        path: path.join(__dirname, 'postcss.config.cjs'),
      },
    },
  }, {
    loader: 'sass-loader',
    options: {
      sourceMap: true,
      sassOptions: {
        // allows for `@use 'mixins/flex';` instead of `@use '../../../styles/mixins/flex';`
        includePaths: [path.join(__dirname, 'src', 'styles')],
      },
    },
  }],
}, {
  test: /\.(?:jpe?g|jpf|png|gifv?|webp|svg|eot|otf|ttf|woff2?)$/i,
  loader: 'file-loader',
  options: { name: '[name].[ext]' },
  exclude: /node_modules/,
}, {
  test: /\.html$/i,
  loader: 'html-loader',
  exclude: /node_modules/,
}, {
  test: /\.(?:jsx?|tsx?)$/i,
  use: [
    // 'babel-loader',
    {
      loader: 'babel-loader',
      options: {
        cacheDirectory: path.join(__dirname, 'node_modules', '.cache', 'babel'), // default: false
        // cacheCompression: false, // default: true
      },
    },
    'source-map-loader',
  ],
  exclude: /node_modules/,
}];

const resolve = {
  alias: {
    // 'react-dom': '@hot-loader/react-dom',
    '@showdex': path.join(__dirname, 'src'),
  },

  extensions: [
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.json',
  ],
};

const copyPatterns = [{
  // fill in fields from package.json into manifest and transform it depending on env.BUILD_TARGET
  from: 'src/manifest.json',
  to: 'manifest.json',

  transform: (content) => {
    const parsed = JSON.parse(content.toString());

    // should be set according to env.BUILD_TARGET below (in the `switch` block)
    // (purposefully given an erroneous value to indicate some transformation was done)
    parsed.manifest_version = -1;

    parsed.version = env.PACKAGE_VERSION;
    parsed.description = env.PACKAGE_DESCRIPTION;
    parsed.author = env.PACKAGE_AUTHOR;
    parsed.homepage_url = env.PACKAGE_URL;

    const {
      applications,
      permissions: matches = [],
      web_accessible_resources,
    } = parsed;

    switch (env.BUILD_TARGET) {
      case 'chrome': {
        // set to Manifest V3 (MV3) for Chrome
        parsed.manifest_version = 3;

        // applications is not used on Chrome
        delete parsed.applications;

        // remove MV2-specific background properties
        delete parsed.background.persistent;
        delete parsed.background.scripts;

        // auto-fill in matches for content_scripts, web_accessible_resources,
        // and externally_connectable
        parsed.content_scripts[0].matches = [...matches];
        parsed.web_accessible_resources[0].matches = [...matches];
        parsed.externally_connectable.matches = [...matches];

        // add source maps to web_accessible_resources
        parsed.web_accessible_resources[0].resources.unshift(
          'background.js.map',
          'content.js.map',
          'main.js.map',
        );

        if (__DEV__) {
          parsed.web_accessible_resources[0].resources.unshift(
            '*.hot-update.js.map',
            '*.hot-update.json',
          );
        }

        // no permissions are needed on Chrome
        parsed.permissions = [];

        // auto-fill action properties
        parsed.action.default_title = parsed.name;
        parsed.action.default_icon = { ...parsed.icons };

        break;
      }

      case 'firefox': {
        // set to Manifest V2 (MV2) for Firefox
        parsed.manifest_version = 2;

        // auto-fill in matches for content_scripts
        parsed.content_scripts[0].matches = [...matches];

        // set Firefox-specific permissions
        const { permissions = [] } = applications.gecko;

        parsed.permissions.unshift(...permissions);
        delete applications.gecko.permissions;

        // remove properties not used on Firefox
        delete parsed.background;
        delete parsed.action;

        // remove properties not supported on MV2
        delete parsed.host_permissions;
        delete parsed.externally_connectable;

        // format web_accessible_resources in MV2's format
        const { resources = [] } = web_accessible_resources[0];

        // note: background.js.map isn't here since background.js isn't used on Firefox
        parsed.web_accessible_resources = [
          'content.js.map',
          'main.js.map',
          ...resources,
        ];

        if (__DEV__) {
          parsed.web_accessible_resources.unshift(
            '*.hot-update.js.map',
            '*.hot-update.json',
          );
        }

        break;
      }

      default: {
        break;
      }
    }

    return Buffer.from(JSON.stringify(parsed));
  },
}, {
  from: 'src/assets/**/*',
  to: '[name][ext]',
  filter: (path) => moduleRules[1].test.test(path) && [
    ...manifest.web_accessible_resources.flatMap((r) => r.resources),
    ...Object.values(manifest.icons),
  ].some((name) => path.includes(name)),
}];

const plugins = [
  new webpack.ProgressPlugin(),
  new webpack.DefinePlugin(webpackEnv),
  new CopyWebpackPlugin({ patterns: copyPatterns }),

  ...[
    __DEV__
      && process.env.DEV_SPRING_CLEANING === 'true'
      && new CircularDependencyPlugin({
        exclude: /node_modules/,
        include: /src/,
        failOnError: false, // true = errors, false = warnings
        // allowAsyncCycles: false,
        cwd: __dirname,

        onDetected({ module, paths, compilation }) {
          if (paths?.[0]?.endsWith?.('index.ts')) {
            return;
          }

          compilation.warnings.push(new Error(paths.join(' -> ')));
        },
      }),

    (!__DEV__ || env.BUILD_TARGET === 'firefox')
      && new ZipPlugin({
        // spit out the file in either `build` or `dist`
        path: '..',

        // extension will be appended to the end of the filename
        filename: env.BUILD_NAME,
        extension: env.BUILD_TARGET === 'firefox' ? 'xpi' : 'zip',
      }),

    !__DEV__
      && new VisualizerPlugin({
        // per the doc: this is relative to the webpack output dir
        filename: path.join('..', `${env.BUILD_NAME}.html`),
      }),
  ].filter(Boolean),
];

// environment-specific config
const envConfig = {
  // source maps for easier debugging of minified bundles
  // (values are based off of webpack's recommendations depending on the environment,
  // except for development, since we cannot use the webpack-recommended 'eval-source-map'
  // due to an 'unsafe-eval' EvalError thrown when trying to first init the extension)
  devtool: __DEV__ ? 'cheap-module-source-map' : 'source-map',

  // development
  ...(__DEV__ && {
    cache: {
      type: 'filesystem',
      allowCollectingMemory: true,
      cacheDirectory: path.join(__dirname, 'node_modules', '.cache', 'webpack'),
      compression: false,
      hashAlgorithm: 'md4',
    }
  }),

  // production
  ...(!__DEV__ && {
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin()],

      // not required on dev cause you can load a single big ass file no problemo (even into Firefox!)
      /** @todo Find a way to get the names of the generated chunks and inject it as an env or something (for use in content). */
      // splitChunks: {
      //   automaticNameDelimiter: '.',
      //   minSize: 1024 ** 2, // 1 MB
      //   maxSize: 4 * (1024 ** 2), // 4 MB
      //
      //   cacheGroups: {
      //     // disable the default cache groups
      //     default: false,
      //
      //     // chunk the big ass JSON files from @pkmn/dex (particularly learnsets.json)
      //     // (required for submitting to Mozilla's AMO, which enforces a 4 MB limit per file)
      //     pkmn: {
      //       // test: /\.json$/i,
      //       // test: ({ resource }) => typeof resource === 'string'
      //       //   && resource.includes('node_modules')
      //       //   && resource.includes('@pkmn')
      //       //   && resource.endsWith('.json'),
      //       test: /\/node_modules\/@pkmn\/.+\.json$/i,
      //       chunks: 'all',
      //       name: 'pkmn',
      //       // filename: '[name].js',
      //     },
      //   }, // end cacheGroups in optimization.splitChunks
      // }, // end splitChunks in optimization
    },
  }),
};

export const config = {
  mode,
  entry,
  output,
  module: { rules: moduleRules },
  resolve,
  plugins,
  ...envConfig,
};

export default config;
