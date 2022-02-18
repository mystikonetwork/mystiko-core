const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function getOptimization() {
  if (isProduction()) {
    return {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    };
  }
  return {};
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'mystiko.[contenthash].js',
  },
  devtool: isProduction() ? undefined : 'source-map',
  mode: isProduction() ? 'production' : 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            sourceType: 'unambiguous',
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
      url: require.resolve('url'),
      https: require.resolve('https-browserify'),
      http: require.resolve('stream-http'),
      assert: require.resolve('assert-browserify'),
      util: require.resolve('util'),
      events: require.resolve('events/'),
      fs: false,
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['safe-buffer', 'Buffer'],
      process: 'process',
    }),
  ],
  optimization: getOptimization(),
};
