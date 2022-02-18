module.exports = {
  sourceType: 'unambiguous',
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
  plugins: ['@babel/plugin-transform-runtime']
};
