import { performance } from 'perf_hooks'
import { options as colors, bold, white, yellow } from 'colorette'
import { parseText } from 'oscript-parser'
import { interpret } from 'oscript-interpreter'
import {
  version, matchArgument, slurpStdin, readSource, printError, printWarnings
} from '../../osparse/console'

const args = process.argv
let considerWarnings = false
let context = true
let silent = false
let verbose = false
let measure = false
const defines = {}
const options = { defines, locations: true, ranges: true }
let source, sourceType

function usage () {
  console.log(`Executes OScript programs.

${bold(yellow('Usage:'))} ${bold(white('osexec [option...] [file]'))}

${bold(yellow('Options:'))}
  --[no]-context          show near source as error context. defaults to true
  --[no]-colors           enable colors in the terminal. default is auto
  -D|--define <name>      define a named value for preprocessor
  -S|--source <type>      source type is object, script (default) or dump
  -O|--old-version        expect an old version of OScript. defaults to false
  -w|--warnings           consider warnings as failures too
  -s|--silent             suppress error output
  -v|--verbose            print error stacktrace
  -p|--performance        print parsing timing
  -V|--version            print version number
  -h|--help               print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e" -> script, ".osx" -> dump. The source type object will enable the new
OScript language and source type dump the old one by default.
  
${bold(yellow('Examples:'))}
  echo 'echo("foo")' | osexec -S script
  osexec -w foo.e`)
  process.exit(0)
}

if (!args.length) usage()

for (let i = 2, l = args.length; i < l; ++i) {
  const arg = args[i]
  const match = matchArgument(arg)
  if (match) {
    const flag = match[2]
    switch (flag) {
      case 'w': case 'warnings':
        considerWarnings = options.warnings = true
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
  source = readSource(arg, sourceType, options)
}

function run () {
  let start, ast
  try {
    options.sourceFile = source.name
    start = measure && performance.now()
    ast = parseText(source.code, options)
    const end = start && performance.now()
    let end2
    if (considerWarnings && ast.warnings.length) {
      if (!silent) printWarnings(process.stderr, source, ast.warnings, { context })
      process.exitCode = 1
    } else {
      interpret(ast, options)
      end2 = start && performance.now()
    }
    if (start) {
      const time = end2
        ? `parsing ${Math.round(end - start)}, executing ${Math.round(end2 - end)})`
        : `${Math.round(end - start)}ms`
      process.stderr.write(`time: ${time}\n`)
    }
  } catch (error) {
    if (!silent) {
      if (!error.warnings) error.warnings = ast && ast.warnings
      printError(process.stderr, source, start, error, { context, verbose })
    }
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
