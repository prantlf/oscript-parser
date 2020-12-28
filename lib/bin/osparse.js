import { readFileSync } from 'fs'
import { join, extname } from 'path'
import { performance } from 'perf_hooks'
import { parseText, tokenize } from 'oscript-parser'

const { version } = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))
const args = process.argv
let tokens = false
let compact = false
let silent = false
let verbose = false
let measure = false
const defines = {}
const options = { defines }
let source, sourceType

function usage () {
  console.log(`Parses OScript programs to Abstract Syntax Tree.

Usage: osparse [option...] [file]

Options:
  --[no]-tokens        include lexer tokens. defaults to false
  --[no]-preprocessor  include preprocessor directives. defaults to false
  --[no]-comments      include comments. defaults to false
  --[no]-whitespace    include whitespace. defaults to false
  --[no]-locations     store location data on syntax nodes. defaults to false
  --[no]-ranges        store start and end token ranges. defaults to false
  --[no]-raw           store raw literals. defaults to false
  -D|--define <name>   define a named value for preprocessor
  -S|--source <type>   source type is object, script (default) or dump
  -O|--old-version     expect the old version of OScript. defaults to false
  -t|--tokenize        print tokens instead of AST
  -c|--compact         print without indenting and whitespace
  -s|--silent          suppress output
  -v|--verbose         print error stacktrace
  -p|--performance     print parsing timing
  -V|--version         print version number
  -h|--help            print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e" -> script, ".osx" -> dump. The source type object will enable the new
OScript language and source type dump the old one by default.
  
Examples:
  echo 'foo = "bar"' | osparse --no-comments -S script
  osparse -t foo.os`)
  process.exit(0)
}

if (!args.length) usage()

for (let i = 2, l = args.length; i < l; ++i) {
  const arg = args[i]
  let match
  if ((match = /^(?:-|--)(?:(no)-)?(\w+)$/.exec(arg))) {
    const flag = match[2]
    switch (flag) {
      case 'c': case 'compact':
        compact = true
        continue
      case 't': case 'tokenize':
        tokens = true
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
      case 'tokens': case 'preprocessor': case 'comments': case 'whitespace':
      case 'locations': case 'ranges':
        options[flag] = match[1] !== 'no'
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
  if (source) {
    if (!silent) console.error('More than one file supplied.')
    process.exit(2)
  }
  source = { name: arg, code: readFileSync(arg, 'utf-8') }
  if (sourceType === undefined) {
    const ext = extname(arg)
    switch (ext) {
      case '.os': options.sourceType = 'object'; break
      case '.osx': options.sourceType = 'dump'; break
      case '.e': options.sourceType = 'script'; break
    }
  }
}

function run () {
  try {
    options.sourceFile = source.name
    const start = measure && performance.now()
    const result = tokens
      ? tokenize(source.code, options)
      : parseText(source.code, options)
    const end = start && performance.now()
    if (!silent) console.log(JSON.stringify(result, null, compact ? undefined : '  '))
    if (start) process.stderr.write(`time: ${Math.round(end - start)}ms\n`)
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
} else {
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
