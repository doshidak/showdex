import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import ZipPlugin from 'zip-webpack-plugin';
import VisualizerPlugin from 'webpack-visualizer-plugin2';
import manifest from './src/manifest' assert { type: 'json' };

const __DEV__ = process.env.NODE_ENV !== 'production';
const mode = __DEV__ ? 'development' : 'production';

const buildTarget = String(process.env.BUILD_TARGET || 'chrome').toLowerCase();
const buildDate = Date.now().toString(16).toUpperCase();

// does not include the extension
const buildFilename = [
  process.env.npm_package_name,
  !!process.env.npm_package_version && `-v${process.env.npm_package_version}`,
  !!buildDate && `-b${buildDate}`,
  __DEV__ ? '-dev' : '',
  `.${buildTarget}`,
].filter(Boolean).join('');

// __dirname is not available in ESModules lmao
if (typeof __dirname !== 'string') {
  global.__dirname = path.dirname(fileURLToPath(import.meta.url));
}

export const env = Object.entries({
  ...dotenv.config({ path: path.join(__dirname, '.env') }).parsed,
  NODE_ENV: mode,
  BUILD_TARGET: buildTarget,
  BUILD_DATE: buildDate,
  PACKAGE_NAME: process.env.npm_package_name,
  PACKAGE_VERSION: process.env.npm_package_version,
  PACKAGE_URL: process.env.npm_package_homepage,
}).reduce((prev, [key, value]) => {
  if (key) {
    prev[`process.env.${key}`] = JSON.stringify(value || '');
  }

  return prev;
}, {
  __DEV__,
});

export const printableEnv = Object.keys(env).sort().reduce((prev, key) => {
  const value = env[key];

  const parsedKey = key.replace(/(?:"|process\.env\.)/g, '');
  const parsedValue = typeof value === 'string' ? value?.replace(/"/g, '') : value;

  prev[parsedKey] = parsedValue;

  return prev;
}, {});

const entry = {
  main: path.join(__dirname, 'src', 'main.ts'),
  content: path.join(__dirname, 'src', 'content.ts'),
  background: path.join(__dirname, 'src', 'background.ts'),
};

// background is not used on Firefox
if (buildTarget === 'firefox') {
  delete entry.background;
}

const output = {
  path: path.join(__dirname, __DEV__ ? 'build' : 'dist', buildTarget),
  filename: '[name].js',
  clean: true, // clean output.path dir before emitting files
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
        includePaths: [path.join(__dirname, 'src/styles')],
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
    'babel-loader',
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
  // fill in fields from package.json into manifest and transform it depending on the buildTarget
  from: `src/manifest.json`,
  to: 'manifest.json',

  transform: (content) => {
    const parsed = JSON.parse(content.toString());

    // should be set according to the buildTarget
    // (purposefully given an erroneous value to indicate some transformation was done)
    parsed.manifest_version = -1;

    parsed.version = process.env.npm_package_version;
    parsed.description = process.env.npm_package_description;
    parsed.author = process.env.npm_package_author;
    parsed.homepage_url = process.env.npm_package_homepage;

    const {
      applications,
      permissions: matches = [],
      web_accessible_resources,
    } = parsed;

    switch (buildTarget) {
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

        parsed.web_accessible_resources = [...resources];

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
  new webpack.DefinePlugin(env),
  new CopyWebpackPlugin({ patterns: copyPatterns }),

  ...[
    (!__DEV__ || buildTarget === 'firefox')
      && new ZipPlugin({
        // spit out the file in either `build` or `dist`
        path: '..',

        // extension will be appended to the end of the filename
        filename: buildFilename,
        extension: buildTarget === 'firefox' ? 'xpi' : 'zip',
      }),

    !__DEV__
      && new VisualizerPlugin({
        // per the doc: this is relative to the webpack output dir
        filename: path.join('..', `${buildFilename}.html`),
      }),
  ].filter(Boolean),
];

// environment-specific config
const envConfig = {
  // development
  ...(__DEV__ && {
    devtool: 'cheap-module-source-map',
  }),

  // production
  ...(!__DEV__ && {
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({ extractComments: true })],

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
