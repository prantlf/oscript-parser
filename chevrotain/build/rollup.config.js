import cleanup from 'rollup-plugin-cleanup'

const sourcemap = true
const external = ['chevrotain', 'fs', 'path', 'perf_hooks', 'tiny-glob/sync', 'oscript-parser']
const plugins = [cleanup()]

function library (name) {
  return {
    input: `lib/${name}.js`,
    output: [
      {
        file: `dist/${name}.js`,
        format: 'cjs',
        sourcemap
      },
      {
        file: `dist/${name}.mjs`,
        format: 'esm',
        sourcemap
      }
    ],
    external,
    plugins
  }
}

function script (name) {
  return {
    input: `lib/bin/${name}.js`,
    output: {
      file: `dist/bin/${name}`,
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
