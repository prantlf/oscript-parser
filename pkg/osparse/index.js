import { performance } from 'perf_hooks'
import { options as colors, bold, white, yellow } from 'colorette'
import { parseText, tokenize } from 'oscript-parser'
import {
  version, matchArgument, toCamelCase, slurpStdin, readSource,
  printError, printWarnings
} from './console'

const args = process.argv
let tokens = false
let compact = false
let considerWarnings = false
let context = true
let silent = false
let verbose = false
let measure = false
const defines = {}
const options = { defines }
let source, sourceType

function usage () {
  console.log(`Parses OScript programs to Abstract Syntax Tree.

${bold(yellow('Usage:'))} ${bold(white('osparse [option...] [file]'))}

${bold(yellow('Options:'))}
  --[no]-tokens           include lexer tokens. defaults to false
  --[no]-preprocessor     include preprocessor directives. defaults to false
  --[no]-comments         include comments. defaults to false
  --[no]-whitespace       include whitespace. defaults to false
  --[no]-locations        store location of parsed nodes. defaults to false
  --[no]-ranges           store start and end token ranges. defaults to false
  --[no]-raw              store raw identifiers & literals. defaults to false
  --[no]-raw-identifiers  store raw identifiers & literals. defaults to false
  --[no]-raw-literals     store raw identifiers & literals. defaults to false
  --[no]-context          show near source as error context. defaults to true
  --[no]-colors           enable colors in the terminal. default is auto
  -D|--define <name>      define a named value for preprocessor
  -S|--source <type>      source type is object, script (default) or dump
  -O|--old-version        expect an old version of OScript. defaults to false
  -t|--tokenize           print tokens instead of AST
  -c|--compact            print without indenting and whitespace
  -w|--warnings           consider warnings as failures too
  -s|--silent             suppress output
  -v|--verbose            print error stacktrace
  -p|--performance        print parsing timing
  -V|--version            print version number
  -h|--help               print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e"lxe" -> script, ".osx" -> dump. The source type object will enable the
new OScript language and source type dump the old one by default.

${bold(yellow('Examples:'))}
  echo 'foo = "bar"' | osparse --no-comments -S script
  osparse -t foo.os`)
  process.exit(0)
}

if (!args.length) usage()

for (let i = 2, l = args.length; i < l; ++i) {
  const arg = args[i]
  const match = matchArgument(arg)
  if (match) {
    const flag = match[2]
    switch (flag) {
      case 't': case 'tokenize':
        tokens = true
        continue
      case 'c': case 'compact':
        compact = true
        continue
      case 'w': case 'warnings':
        considerWarnings = true
        continue
      case 'context':
        context = match[1] !== 'no'
        continue
      case 'colors':
        colors.enabled = match[1] !== 'no'
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
      case 'locations': case 'ranges': case 'raw': case 'raw-identifiers':
      case 'raw-iterals':
        options[toCamelCase(flag)] = match[1] !== 'no'
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
        break
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
  source = readSource(arg, sourceType, options)
}

function run () {
  let start
  try {
    options.sourceFile = source.name
    start = measure && performance.now()
    const result = tokens
      ? tokenize(source.code, options)
      : parseText(source.code, options)
    const end = start && performance.now()
    if (!silent) {
      if (considerWarnings && result.warnings.length) {
        printWarnings(process.stderr, source, result.warnings, { context })
        process.exitCode = 1
      } else {
        process.stdout.write(`${JSON.stringify(result, null, compact ? undefined : '  ')}\n`)
      }
    } else if (considerWarnings && result.warnings.length) {
      process.exitCode = 1
    }
    if (start) process.stderr.write(`time: ${Math.round(end - start)}ms\n`)
  } catch (error) {
    if (!silent) printError(process.stderr, source, start, error, { context, verbose })
    process.exitCode = 1
  }
}

if (source) {
  run()
} else {
  slurpStdin(result => {
    source = result
    run()
  })
}
