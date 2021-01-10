import json from '@rollup/plugin-json'
import cleanup from 'rollup-plugin-cleanup'
import { terser } from 'rollup-plugin-terser'

const globals = { fs: 'fs', 'oscript-ast-walker': 'oscriptAstWalker' }
const sourcemap = true
const external = [
  'colorette', 'fs', 'oscript-ast-walker', 'oscript-interpreter',
  'oscript-parser', 'path', 'perf_hooks', 'tiny-glob/sync'
]

function library () {
  const name = 'oscript'
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

function subpkg (name, variable) {
  const outprefix = `pkg/${name}/dist/index`
  return {
    input: `pkg/${name}/src/index.js`,
    output: [
      { file: `${outprefix}.js`, format: 'cjs', sourcemap },
      { file: `${outprefix}.mjs`, format: 'esm', sourcemap },
      { file: `${outprefix}.umd.js`, format: 'umd', name: variable, globals, sourcemap },
      {
        file: `${outprefix}.umd.min.js`,
        format: 'umd',
        name: variable,
        globals,
        sourcemap,
        plugins: [terser()]
      }
    ],
    external,
    plugins: [cleanup()]
  }
}

function script (name, paths, pkg) {
  const input = pkg ? `pkg/${pkg}/src/${name}.js` : `pkg/${name}/index.js`
  const file = pkg ? `pkg/${pkg}/dist/bin/${name}` : `dist/bin/${name}`
  return {
    input,
    output: {
      file,
      format: 'cjs',
      banner: '#!/usr/bin/env node',
      paths,
      sourcemap
    },
    external,
    plugins: [json(), cleanup()]
  }
}

export default [
  library(),
  subpkg('walker', 'oscriptAstWalker'),
  subpkg('interpreter', 'oscriptInterpreter'),
  script('osparse', { 'oscript-parser': '..' }),
  script('oslint', { 'oscript-parser': '..' }),
  script('osexec', { 'oscript-interpreter': '..' }, 'interpreter')
]
