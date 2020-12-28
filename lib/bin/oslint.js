import globSync from 'tiny-glob/sync'
import { readFileSync } from 'fs'
import { join, extname } from 'path'
import { performance } from 'perf_hooks'
import { parseText } from 'oscript-parser'

const { version } = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))
const args = process.argv
let errorsOnly = false
let silent = false
let verbose = false
let measure = false
const defines = {}
const options = { defines }
const patterns = []
let source, sourceType

function usage () {
  console.log(`Checks the syntax of OScript programs.

Usage: oslint [option...] [pattern ...]

Options:
  -D|--define <name>  define a named value for preprocessor
  -S|--source <type>  source type is object, script (default) or dump
  -O|--old-version    expect the old version of OScript. defaults to false
  -e|--errors-only    print only files that failed the check
  -s|--silent         suppress output
  -v|--verbose        print error stacktrace
  -p|--performance    print parsing timing
  -V|--version        print version number
  -h|--help           print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e" -> script, ".osx" -> dump. The source type object will enable the new
OScript language and source type dump the old one by default.
  
Examples:
  echo 'foo = "bar"' | oslint -S script
  oslint -p foo.os`)
  process.exit(0)
}

if (!args.length) usage()

for (let i = 2, l = args.length; i < l; ++i) {
  const arg = args[i]
  let match
  if ((match = /^(?:-|--)(?:(no)-)?(\w+)$/.exec(arg))) {
    const flag = match[2]
    switch (flag) {
      case 'e': case 'errors-only':
        errorsOnly = true
        continue
      case 's': case 'silent':
        silent = true
        continue
      case 'v': case 'verbose':
        verbose = true
        continue
      case 'p': case 'performance':
        measure = true
        continue
      case 'D': case 'define':
        defines[args[++i]] = true
        continue
      case 'S': case 'source':
        sourceType = options.sourceType = args[++i]
        continue
      case 'O': case 'old-version':
        options.oldVersion = true
        continue
      case 'V': case 'version':
        console.log(version)
        process.exit(0)
      case 'h': case 'help':
        usage()
    }
    if (!silent) console.error(`Unknown option: "${match[0]}".`)
    process.exit(2)
  }
  patterns.push(arg)
}

if (patterns.length) {
  const start = measure && performance.now()
  for (const pattern of patterns) {
    const names = globSync(pattern, { filesOnly: true })
    for (const name of names) {
      source = { name, code: readFileSync(name, 'utf-8') }
      if (sourceType === undefined) {
        const ext = extname(name)
        switch (ext) {
          case '.os': options.sourceType = 'object'; break
          case '.osx': options.sourceType = 'dump'; break
          case '.e': options.sourceType = 'script'; break
        }
      }
      run()
    }
  }
  if (start) {
    let total = performance.now() - start
    if (total > 100) total = `${(total / 1000).toFixed(3)}s`
    else total = `${Math.round(total)}ms`
    process.stderr.write(`total time: ${total}\n`)
  }
  source = null
}

function run () {
  try {
    options.sourceFile = source.name
    const start = measure && performance.now()
    parseText(source.code, options)
    let time
    if (start) {
      const end = performance.now()
      time = ` in ${Math.round(end - start)}ms`
    } else {
      time = ''
    }
    if (!silent && !errorsOnly) console.log(`${source.name} succeeded${time}`)
  } catch (error) {
    if (!silent) {
      const location = error.line ? `:${error.line}:${error.column}` : ''
      console.error(`${source.name}${location}: ${error.message}`)
    }
    if (verbose) console.log(error.stack)
    process.exitCode = 1
  }
}

if (source) {
  run()
} else if (source === undefined) {
  let input = ''
  process.stdin.setEncoding('utf8')
  process.stdin
    .on('data', chunk => (input += chunk))
    .on('end', () => {
      source = { name: 'snippet', code: input }
      run()
    })
    .resume()
}
