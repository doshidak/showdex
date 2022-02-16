process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const config = require('../webpack.config');

if ('chromeExtension' in config) {
  delete config.chromeExtension;
}

config.mode = 'production';

console.log('Building for production...');

console.log('entry:', config.entry);
console.log('output:', config.output);

webpack(config, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});

console.log('Build successful!');
