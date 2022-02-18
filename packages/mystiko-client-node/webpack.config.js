const path = require('path');
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

function getCJSFileName() {
  return isProduction() ? 'mystiko.min.cjs' : 'mystiko.cjs';
}

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    library: 'mystiko',
    libraryTarget: 'commonjs',
    libraryExport: 'default',
    filename: getCJSFileName(),
  },
  resolve: {
    extensions: ['.node', '...'],
  },
  devtool: isProduction() ? undefined : 'source-map',
  mode: isProduction() ? 'production' : 'development',
  target: 'node',
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
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
  optimization: getOptimization(),
};
