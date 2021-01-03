import { readFileSync } from 'fs'
import { extname } from 'path'
import { performance } from 'perf_hooks'
import { bold, white, yellow, red } from 'colorette'
import { formatErrorContext, colorizeErrorContext, shrinkWhitespace } from './error-context'
export { version } from '../../package.json'

export function matchArgument (arg) {
  return /^(?:-|--)(?:(no)-)?([-a-z]+)$/.exec(arg)
}

export function toCamelCase (arg) {
  return arg.replace(/-\w/g, match => match.substr(1).toUpperCase())
}

export function slurpStdin (done) {
  let input = ''
  process.stdin.setEncoding('utf8')
  process.stdin
    .on('data', chunk => (input += chunk))
    .on('end', () => done({ name: 'snippet', code: input }))
    .resume()
}

export function readSource (name, sourceType, options) {
  const source = { name, code: readFileSync(name, 'utf8') }
  if (sourceType === undefined) {
    const ext = extname(name)
    switch (ext) {
      case '.os': options.sourceType = 'object'; break
      case '.osx': options.sourceType = 'dump'; break
      case '.e': options.sourceType = 'script'; break
    }
  }
  return source
}

export function printError (output, source, start, error, { context, verbose } = {}) {
  const time = formatTime(start)
  const { message, line, column, warnings } = error
  output.write(`${source.name} ${bold(red('failed'))} with 1 error and ${formatWarningCount(warnings)}${time}\n`)
  const location = line ? `:${line}:${column}` : ''
  output.write(bold(white(`${source.name}${location}: `)) +
    bold(red('error: ')) + bold(white(shrinkWhitespace(message))) + '\n')
  if (context) printErrorContext(output, source, error)
  printWarnings(output, source, warnings, { context })
  if (verbose) console.log(error.stack)
}

export function printWarnings (output, source, warnings, { context } = {}) {
  for (const warning of warnings) {
    const { message, line, column } = warning
    output.write(bold(white(`${source.name}:${line}:${column}: `)) +
      bold(yellow('warning: ')) + bold(white(shrinkWhitespace(message))) + '\n')
    if (context) printErrorContext(output, source, warning)
  }
}

export function printErrorContext (output, source, error) {
  const text = formatErrorContext(error, source.code)
  if (text) output.write(`${colorizeErrorContext(text)}\n`)
}

export function formatTime (start) {
  if (!start) return ''
  const end = performance.now()
  return ` in ${Math.round(end - start)}ms`
}

export function formatWarningCount (warnings) {
  return `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`
}
