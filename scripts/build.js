process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const config = require('../webpack.config');

if ('chromeExtension' in config) {
  delete config.chromeExtension;
}

config.mode = 'production';

webpack(config, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
