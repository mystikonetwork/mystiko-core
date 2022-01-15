const path = require('path');
const webpack = require('webpack');
module.exports = {
  output: {
    path: path.resolve(__dirname, 'build/js'),
    library: 'mystiko',
    libraryTarget: 'umd',
    libraryExport: 'default',
    filename: 'mystiko.js',
  },
  mode: 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['@babel/plugin-transform-runtime'],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      fs: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['safe-buffer', 'Buffer'],
      process: 'process',
    }),
  ],
};
