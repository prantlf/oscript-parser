import globSync from 'tiny-glob/sync'
import { performance } from 'perf_hooks'
import { options as colors, bold, white, yellow, green } from 'colorette'
import { parseText } from 'oscript-parser'
import {
  version, matchArgument, slurpStdin, readSource,
  printError, printWarnings, formatTime, formatWarningCount
} from '../osparse/console'

const args = process.argv
let errorsOnly = false
let considerWarnings = false
let context = true
let silent = false
let verbose = false
let measure = false
const defines = {}
const options = { defines }
const patterns = []
let source, sourceType

function usage () {
  console.log(`Checks the syntax of OScript programs.

${bold(yellow('Usage:'))} ${bold(white('oslint [option...] [pattern ...]'))}

${bold(yellow('Options:'))}
  --[no]-context      show near source as error context. defaults to true
  --[no]-colors       enable colors in the terminal. default is auto
  -D|--define <name>  define a named value for preprocessor
  -S|--source <type>  source type is object, script (default) or dump
  -O|--old-version    expect an old version of OScript. defaults to false
  -e|--errors-only    print only files that failed the check
  -w|--warnings       consider warnings as failures too
  -s|--silent         suppress output
  -v|--verbose        print error stacktrace
  -p|--performance    print parsing timing
  -V|--version        print version number
  -h|--help           print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e|lxe" -> script, ".osx" -> dump. The source type object will enable the
new OScript language and source type dump the old one by default.

${bold(yellow('Examples:'))}
  echo 'foo = "bar"' | oslint -S script
  oslint -p foo.os`)
  process.exit(0)
}

if (!args.length) usage()

for (let i = 2, l = args.length; i < l; ++i) {
  const arg = args[i]
  const match = matchArgument(arg)
  if (match) {
    const flag = match[2]
    switch (flag) {
      case 'context':
        context = match[1] !== 'no'
        continue
      case 'colors':
        colors.enabled = match[1] !== 'no'
        continue
      case 'e': case 'errors-only':
        errorsOnly = true
        continue
      case 'w': case 'warnings':
        considerWarnings = true
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
        break
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
      source = readSource(name, sourceType, options)
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
  let start
  try {
    options.sourceFile = source.name
    start = measure && performance.now()
    const { warnings } = parseText(source.code, options)
    const time = formatTime(start)
    if (considerWarnings && warnings.length) {
      if (!silent) {
        process.stdout.write(`${source.name} ${bold(yellow('failed'))} with ${formatWarningCount(warnings)}${time}\n`)
        printWarnings(process.stdout, source, warnings, { context })
      }
      process.exitCode = 1
    } else {
      if (!silent && !errorsOnly) process.stdout.write(`${source.name} ${bold(green('succeeded'))}${time}\n`)
    }
  } catch (error) {
    if (!silent) printError(process.stdout, source, start, error, { context, verbose })
    process.exitCode = 1
  }
}

if (source) {
  run()
} else if (source === undefined) {
  slurpStdin(result => {
    source = result
    run()
  })
}
