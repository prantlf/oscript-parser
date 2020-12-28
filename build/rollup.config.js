import cleanup from 'rollup-plugin-cleanup'
import { terser } from 'rollup-plugin-terser'

const name = 'oscript'
const sourcemap = true
const external = ['chevrotain', 'fs', 'path', 'perf_hooks', 'tiny-glob/sync', 'oscript-parser']
const plugins = [cleanup()]

function library (index) {
  return {
    input: `lib/${index}.js`,
    output: [
      {
        file: `dist/${index}.js`,
        format: 'cjs',
        sourcemap
      },
      {
        file: `dist/${index}.mjs`,
        format: 'esm',
        sourcemap
      },
      {
        file: `dist/${index}.umd.js`,
        format: 'umd',
        name,
        sourcemap
      },
      {
        file: `dist/${index}.umd.min.js`,
        format: 'umd',
        name,
        sourcemap,
        plugins: [terser()]
      }
    ],
    plugins
  }
}

function script (index) {
  return {
    input: `lib/bin/${index}.js`,
    output: {
      file: `dist/bin/${index}`,
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      paths: { 'oscript-parser': '..' },
      sourcemap
    },
    external,
    plugins
  }
}

export default [library('index'), script('osparse'), script('oslint')]
