const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

function isProduction() {
  return !process.env.NODE_ENV || process.env.NODE_ENV === 'production';
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
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'build/browser'),
    filename: 'mystiko.[contenthash].js',
    library: {
      name: 'mystiko',
      type: 'window',
      export: 'default',
    },
  },
  devtool: isProduction() ? undefined : 'source-map',
  mode: isProduction() ? 'production' : 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                declaration: false,
                declarationMap: false,
                outDir: path.resolve(__dirname, 'build/browser'),
              },
              onlyCompileBundledFiles: true,
            },
          },
        ],
        exclude: /node_modules/,
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
      process: require.resolve('process/browser'),
      buffer: require.resolve('buffer/'),
      fs: false,
      readline: false,
      child_process: false,
    },
    extensions: ['.ts', '...'],
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['safe-buffer', 'Buffer'],
      process: 'process',
    }),
  ],
  optimization: getOptimization(),
  experiments: {
    asyncWebAssembly: true,
  }
};
