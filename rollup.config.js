import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import pkg from './package.json';

export default [
  {
    input: 'src/protocol/index.js',
    output: [
      {
        file: `build/js/${pkg.name}.min.js`,
        format: 'esm',
      },
    ],
    plugins: [
      nodeResolve(),
      babel({
        babelHelpers: 'bundled',
      }),
      terser(),
      commonJS({
        preserveSymlinks: true,
      }),
      json(),
    ],
  },
  {
    input: 'src/protocol/index.js',
    plugins: [
      nodeResolve(),
      commonJS({
        preserveSymlinks: true,
      }),
      json(),
    ],
    output: [
      {
        dir: 'build/js/esm',
        format: 'esm',
        exports: 'named',
      },
      {
        dir: 'build/js/cjs',
        format: 'cjs',
        exports: 'named',
      },
    ],
  },
];
