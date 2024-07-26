import path from 'path';
import { fileURLToPath } from 'url';
import { NIL as NIL_UUID, v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { Glob } from 'glob';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import ZipPlugin from 'zip-webpack-plugin';
import CircularDependencyPlugin from 'circular-dependency-plugin';
import VisualizerPlugin from 'webpack-visualizer-plugin2';
import manifest from './src/manifest' assert { type: 'json' };

// todo: import your dank node-babel-loader & turn this into ts (I miss you)

const __DEV__ = process.env.NODE_ENV !== 'production';
const mode = __DEV__ ? 'development' : 'production';

export const buildTargets = [
  'chrome',
  'firefox',
  'standalone',
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

const { parsed: envFile } = dotenv.config({
  path: path.join(__dirname, '.env'),
});

const finalEnv = {
  ...envFile,

  BUILD_DATE: Date.now().toString(16).toUpperCase(),
  BUILD_SUFFIX: sanitizeEnv(process.env.BUILD_SUFFIX),
  BUILD_TARGET: sanitizeEnv(process.env.BUILD_TARGET, buildTargets[0] || 'chrome'),
  DEV_HOSTNAME: process.env.DEV_HOSTNAME || envFile.DEV_HOSTNAME,
  DEV_PORT: process.env.DEV_PORT || envFile.DEV_PORT,
  DEV_BABEL_CACHE_ENABLED: process.env.DEV_BABEL_CACHE_ENABLED || envFile.DEV_BABEL_CACHE_ENABLED,
  DEV_WEBPACK_CACHE_ENABLED: process.env.DEV_WEBPACK_CACHE_ENABLED || envFile.DEV_WEBPACK_CACHE_ENABLED,
  DEV_SPRING_CLEANING: process.env.DEV_SPRING_CLEANING || envFile.DEV_SPRING_CLEANING,
  PROD_ANALYZE_BUNDLES: process.env.PROD_ANALYZE_BUNDLES || envFile.PROD_ANALYZE_BUNDLES,
  NODE_ENV: mode,
  PACKAGE_AUTHOR_EMAIL: process.env.npm_package_author_email,
  PACKAGE_AUTHOR_NAME: process.env.npm_package_author_name,
  PACKAGE_DESCRIPTION: process.env.npm_package_description,
  PACKAGE_NAME: process.env.npm_package_name || 'showdex',
  PACKAGE_URL: process.env.npm_package_homepage,
  PACKAGE_VERSION: process.env.npm_package_version,
  PACKAGE_VERSION_SUFFIX: sanitizeEnv(process.env.PACKAGE_VERSION_SUFFIX),
};

if (!buildTargets.includes(finalEnv.BUILD_TARGET)) {
  console.error(
    'Received an invalid BUILD_TARGET:', finalEnv.BUILD_TARGET,
    '\n', 'Valid build targets are:', buildTargets.join(', '),
  );

  process.exit(1);
}

finalEnv.UUID_NAMESPACE = (
  (finalEnv.BUILD_TARGET === 'chrome' && finalEnv.UUID_CHROME_NAMESPACE)
    || (finalEnv.BUILD_TARGET === 'firefox' && finalEnv.UUID_FIREFOX_NAMESPACE)
    || (finalEnv.BUILD_TARGET === 'standalone' && finalEnv.UUID_STANDALONE_NAMESPACE)
) || finalEnv.UUID_NAMESPACE;

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

export const env = Object.entries(finalEnv)
  .sort(([a], [b]) => a - b)
  .reduce((prev, [key, value]) => {
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
if (finalEnv.BUILD_TARGET === 'firefox') {
  delete entry.background;
}

if (finalEnv.BUILD_TARGET === 'standalone') {
  delete entry.content;
  delete entry.background;
}

const output = {
  path: path.join(__dirname, __DEV__ ? 'build' : 'dist', finalEnv.BUILD_TARGET),
  filename: '[name].js',
  clean: false, // clean output.path dir before emitting files (update: cleaning it up ourselves via rimraf)
  publicPath: 'auto',
};

const moduleRules = [
  {
    test: /\.s?css$/i,
    use: [
      'style-loader',
      {
        loader: 'css-loader',
        options: {
          sourceMap: true,
          modules: {
            auto: true, // only files ending in .module.s?css will be treated as CSS modules
            localIdentName: '[name]-[local]--[hash:base64:5]', // e.g., 'Caldex-module-content--mvN2w'
          },
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          sourceMap: true,
          postcssOptions: {
            // autoprefixer so we don't ever need to specify CSS prefixes like `-moz-` and `-webkit-`
            path: path.join(__dirname, 'postcss.config.cjs'),
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          sourceMap: true,
          sassOptions: {
            // allows for `@use 'mixins/flex';` instead of `@use '../../../styles/mixins/flex';`
            includePaths: [path.join(__dirname, 'src', 'styles')],
          },
        },
      },
    ],
  },
  {
    test: /\.(?:jpe?g|jpf|png|gifv?|webp|svg|eot|[ot]tf|woff2?)$/i,
    loader: 'file-loader',
    options: { name: '[name].[ext]' },
    exclude: /node_modules/,
  },
  {
    test: /\.html$/i,
    loader: 'html-loader',
    exclude: /node_modules/,
  },
  {
    test: /\.(?:jsx?|tsx?)$/i,
    use: [
      {
        loader: 'babel-loader',
        options: {
          cacheDirectory: __DEV__
            && finalEnv.DEV_BABEL_CACHE_ENABLED === 'true'
            && path.join(__dirname, 'node_modules', '.cache', 'babel'), // default: false
          // cacheCompression: false, // default: true
        },
      },
      'source-map-loader',
    ],
    exclude: /node_modules/,
  },
];

const resolve = {
  alias: {
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

// dynamically built bundles, i.e., bundled presets & translations
// type string[]; e.g., ['i18n.en.json', 'i18n.fr.json', 'd45db13d-567e-4b41-91d4-268cc83e1ce6.json']
const dynamicResources = [];

// determine all the languages we'll merge into a single minified json
// (each language needs at least a common.json, so we'll glob based on that)
const i18nGlob = new Glob('src/assets/i18n/**/common.json', {
  posix: true, // true = 'C:\Users\keith\showdex' -> '//?/C:/Users/keith/showdex' (no-op on Unix-based systems)
  // absolute: false, // false = absolute or relative depending on the provided pattern arg
});

for await (const filepath of i18nGlob) {
  // e.g., filePath = 'src/assets/i18n/en/some/nesting/maybe/common.json'
  // paths = ['src', 'assets', 'i18n', 'en', 'some', 'nesting', 'maybe', 'common.json']
  // paths.indexOf('i18n') = 2 -> locale = paths[3] -> 'en'
  const paths = filepath.split('/');
  const locale = paths[paths.indexOf('i18n') + 1];
  const basename = `i18n.${locale || 'uwu'}.json`; // TIL 'bad' refers to Banda LOL so 'uwu' it is!

  if (!locale || dynamicResources.includes(basename)) {
    continue;
  }

  dynamicResources.push(basename);
}

const copyPatterns = [
  // merge translation files into one big ass minified one for each language
  // name of json file inside locale directory is the name of the i18next namespace (without the extension, of course)
  ...dynamicResources.filter((r) => r.startsWith('i18n')).map((to) => ({
    from: `src/assets/i18n/${to.split('.')[1]}/**/*.json`,
    to,
    // warning: to() & transformAll() don't play nicely with each other; the function itself is serialized into a string,
    // then output as the filename, resulting in 1000 directories being created LOL
    // see: https://github.com/webpack-contrib/copy-webpack-plugin/blob/74a366655deb33a435d281225bc581d338e45fca/src/index.js#L927-L935
    // to: (data) => {
    //   const {
    //     context, // string, e.g., '/Users/keith/showdex'
    //     absoluteFilename, // string, e.g., '/Users/keith/showdex/src/assets/i18n/en/some/nesting/maybe/common.json'
    //   } = data;
    //
    //   if (!absoluteFilename?.endsWith('.json')) {
    //     return 'i18n.bad.json';
    //   }
    //
    //   const paths = absoluteFilename.split('/');
    //   const locale = paths[paths.indexOf('i18n') + 1];
    //   const basename = `i18n.${locale || 'bad'}.json`;
    //
    //   if (locale) {
    //     dynamicResources.push(basename);
    //   }
    //
    //   return basename;
    // },
    // toType: 'file',
    transformAll: (assets) => {
      const merged = assets.reduce((prev, asset) => {
        const {
          data, // Buffer
          sourceFilename, // string, e.g., 'src/assets/i18n/some/nesting/maybe/common.json'
          // absoluteFilename, // string
        } = asset;

        const key = sourceFilename.split('/').pop().replace('.json', '');
        const parsed = JSON.parse(data.toString());

        if (!key || !Object.keys(parsed || {}).length) {
          return prev;
        }

        if (key === 'common' && typeof parsed['--meta'] === 'object') {
          parsed['--meta'].built = new Date().toISOString();
        }

        // e.g., prev = { common: { ... }, pokedex: { ... }, ... }
        prev[key] = parsed;

        return prev;
      }, {
        // just making sure common is always the first entry
        common: {},
      });

      return Buffer.from(JSON.stringify(merged));
    },
  })),

  // copy assets matched by the file-loader regex (pretty much all image & font files)
  {
    from: 'src/assets/**/*',
    to: '[name][ext]',
    filter: (path) => moduleRules[1].test.test(path) && [
      ...manifest.web_accessible_resources.flatMap((r) => r.resources),
      ...Object.values(manifest.icons),
    ].some((name) => path.includes(name)),
  },

  // pre-bundle Bakedex bundles (in case the Bakedex API is down or something o_O)
  {
    from: 'src/assets/bundles/*.json',
    to: (data) => {
      const { absoluteFilename } = data;
      const basename = absoluteFilename.split('/').pop();

      if (/\.json$/.test(basename)) {
        dynamicResources.push(basename);
      }

      return '[name][ext]';
    },
    transform: (content) => {
      const parsed = JSON.parse(content.toString());

      // 10/10 instant minification ggez
      return Buffer.from(JSON.stringify(parsed));
    },
  },

  // fill in fields from package.json into manifest and transform it depending on finalEnv.BUILD_TARGET
  {
    from: 'src/manifest.json',
    to: 'manifest.json',
    transform: (content) => {
      const parsed = JSON.parse(content.toString());

      // should be set according to finalEnv.BUILD_TARGET below (in the `switch` block)
      // (purposefully given an erroneous value to indicate some transformation was done)
      parsed.manifest_version = -1;

      parsed.version = finalEnv.PACKAGE_VERSION;
      parsed.description = finalEnv.PACKAGE_DESCRIPTION;
      // parsed.author = { email: finalEnv.PACKAGE_AUTHOR_EMAIL };
      parsed.homepage_url = finalEnv.PACKAGE_URL;

      // if (finalEnv.PACKAGE_AUTHOR_NAME) {
      //   parsed.author.name = finalEnv.PACKAGE_AUTHOR_NAME;
      // }

      // update (2023/12/26): actually, better to not include this so that none of the web stores freak out lol
      delete parsed.author;

      const {
        applications,
        permissions: matches = [],
        web_accessible_resources,
      } = parsed;

      switch (finalEnv.BUILD_TARGET) {
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
          parsed.web_accessible_resources[0].resources.push(
            'background.js.map',
            'content.js.map',
            'main.js.map',
            ...dynamicResources,
          );

          if (__DEV__) {
            parsed.web_accessible_resources[0].resources.push(
              '*.hot-update.js.map',
              '*.hot-update.json',
            );
          }

          // sort the resources list in ABC order for easier debugging
          parsed.web_accessible_resources[0].resources.sort();

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
            ...dynamicResources,
          ];

          if (__DEV__) {
            parsed.web_accessible_resources.push(
              '*.hot-update.js.map',
              '*.hot-update.json',
            );
          }

          // sort the resources list in ABC order for easier debugging
          parsed.web_accessible_resources.sort();

          break;
        }

        default: {
          break;
        }
      }

      return Buffer.from(JSON.stringify(parsed));
    },
  },
];

if (finalEnv.BUILD_TARGET === 'standalone') {
  const manifestIndex = copyPatterns.findIndex((p) => (
    typeof p.to === 'string'
      && p.to.includes('manifest.json')
  ));

  if (manifestIndex > -1) {
    copyPatterns.splice(manifestIndex, 1);
  }
}

const plugins = [
  new webpack.ProgressPlugin(),
  new webpack.DefinePlugin(webpackEnv),
  new CopyWebpackPlugin({ patterns: copyPatterns }),

  ...[
    __DEV__
      && finalEnv.DEV_SPRING_CLEANING === 'true'
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

    (finalEnv.BUILD_TARGET !== 'standalone' && (!__DEV__ || finalEnv.BUILD_TARGET === 'firefox'))
      && new ZipPlugin({
        // spit out the file in either `build` or `dist`
        path: '..',

        // extension will be appended to the end of the filename
        filename: finalEnv.BUILD_NAME,
        extension: finalEnv.BUILD_TARGET === 'firefox' ? 'xpi' : 'zip',
      }),

    !__DEV__
      && finalEnv.PROD_ANALYZE_BUNDLES === 'true'
      && new VisualizerPlugin({
        // per the doc: this is relative to the webpack output dir
        filename: path.join('..', `${finalEnv.BUILD_NAME}.html`),
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
  ...(__DEV__ && finalEnv.DEV_WEBPACK_CACHE_ENABLED === 'true' && {
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
