const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
module.exports = [
  {
    output: {
      path: path.resolve(__dirname, 'dist'),
      library: 'mystiko',
      libraryTarget: 'umd',
      libraryExport: 'default',
      filename: 'mystiko.js',
    },
    mode: 'production',
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
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
  },
  {
    output: {
      path: path.resolve(__dirname, 'dist'),
      library: 'mystiko',
      libraryTarget: 'commonjs',
      libraryExport: 'default',
      filename: 'mystiko.cjs',
    },
    resolve: {
      extensions: ['.node', '...'],
    },
    mode: 'production',
    target: 'node',
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
        {
          test: /\.node$/,
          loader: 'node-loader',
        },
      ],
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
        }),
      ],
    },
  },
];
