import json from '@rollup/plugin-json'
import cleanup from 'rollup-plugin-cleanup'
import { terser } from 'rollup-plugin-terser'

const name = 'oscript'
const sourcemap = true
const external = [
  'colorette', 'fs', 'oscript-parser', 'path', 'perf_hooks', 'tiny-glob/sync'
]

function library () {
  const outprefix = 'dist/index'
  return {
    input: 'pkg/parser/index.js',
    output: [
      { file: `${outprefix}.js`, format: 'cjs', sourcemap },
      { file: `${outprefix}.mjs`, format: 'esm', sourcemap },
      { file: `${outprefix}.umd.js`, format: 'umd', name, sourcemap },
      {
        file: `${outprefix}.umd.min.js`,
        format: 'umd',
        name,
        sourcemap,
        plugins: [terser()]
      }
    ],
    plugins: [cleanup()]
  }
}

function subpkg (name) {
  const outprefix = `pkg/${name}/dist/index`
  return {
    input: `pkg/${name}/index.js`,
    output: [
      { file: `${outprefix}.js`, format: 'cjs', sourcemap },
      { file: `${outprefix}.mjs`, format: 'esm', sourcemap },
      { file: `${outprefix}.umd.js`, format: 'umd', name, sourcemap },
      {
        file: `${outprefix}.umd.min.js`,
        format: 'umd',
        name,
        sourcemap,
        plugins: [terser()]
      }
    ],
    plugins: [cleanup()]
  }
}

function script (name) {
  return {
    input: `pkg/${name}/index.js`,
    output: {
      file: `dist/bin/${name}`,
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      paths: { 'oscript-parser': '..' },
      sourcemap
    },
    external,
    plugins: [json(), cleanup()]
  }
}

export default [library(), subpkg('walker'), script('osparse'), script('oslint')]
