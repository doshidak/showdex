const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';
const mode = isDevelopment ? 'development' : 'production';

const env = Object.entries({
  ...dotenv.config({ path: path.join(__dirname, '.env') }).parsed,
  NODE_ENV: mode,
  PACKAGE_NAME: process.env.npm_package_name,
  PACKAGE_VERSION: process.env.npm_package_version,
  PACKAGE_URL: process.env.npm_package_homepage,
}).reduce((prev, [key, value]) => {
  if (key) {
    prev[`process.env.${key}`] = JSON.stringify(value || '');
  }

  return prev;
}, {
  __DEV__: isDevelopment,
});

const entry = {
  main: path.join(__dirname, 'src/main.ts'),
  content: path.join(__dirname, 'src/content.ts'),
  background: path.join(__dirname, 'src/background.ts'),
  // devtools: path.join(__dirname, 'src/devtools.js'),
  // panel: path.join(__dirname, 'src/panel.js'),
};

const output = {
  path: path.join(__dirname, isDevelopment ? 'build' : 'dist'),
  filename: '[name].js',
  clean: true, // clean output.path dir before emitting files
  publicPath: '/',
};

const moduleRules = [{
  test: /\.s?css$/i,
  use: [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        sourceMap: true,
        modules: {
          localIdentName: '[name]-[local]--[hash:base64:5]',
        },
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        postcssOptions: {
          path: path.join(__dirname, 'postcss.config.js'),
        },
      },
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: true,
        sassOptions: { includePaths: [path.join(__dirname, 'src/styles')] },
      },
    },
  ],
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
    'react-dom': '@hot-loader/react-dom',
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
  // replace version and description in manifest.json w/ those of package.json
  from: 'src/manifest.json',
  transform: (content) => Buffer.from(JSON.stringify({
    ...JSON.parse(content.toString()),
    version: process.env.npm_package_version,
    description: process.env.npm_package_description,
  })),
}, {
  from: 'src/assets/**/*',
  to: '[name][ext]',
  filter: (path) => moduleRules[1].test.test(path),
}];

const plugins = [
  new webpack.ProgressPlugin(),
  new webpack.DefinePlugin(env),
  new CopyWebpackPlugin({ patterns: copyPatterns }),
];

const config = {
  mode,
  entry,
  output,
  module: { rules: moduleRules },
  resolve,
  plugins,

  chromeExtension: {
    hmrExclude: [
      'content',
      // 'devtools',
    ],
  },
};

if (isDevelopment) {
  config.devtool = 'cheap-module-source-map';
} else {
  config.optimization = {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false })],
  };
}

module.exports = config;
