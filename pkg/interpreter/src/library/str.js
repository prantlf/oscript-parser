/* eslint-disable camelcase */
/* globals atob, btoa */

import { readFileSync } from 'fs'

export const cr = '\r'
export const crlf = '\r\n'
export const lf = '\n'
export const tab = '\t'

export function ascii (value) {
  return typeof value === 'number' ? String.fromCharCode(value) : value.charCodeAt(0)
}

export function bytelength (text) {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(text).length
    : new TextEncoder().encode(text).length
}

export function capitalize (text) {
  return text.replace(/(\w+)/g, match =>
    match.charAt(0).toUpperCase() + match.substr(1).toLowerCase())
}

export function catenate (values, delimiter) {
  const suffix = values.length ? delimiter : ''
  return `${values.join(delimiter)}${suffix}`
}

export function chr (hay, needle) {
  const index = hay.indexOf(needle.charAt(0))
  return index < 0 ? undefined : index + 1
}

export function cmp (left, right, length) {
  if (length !== undefined) {
    left = left.substr(0, length)
    right = right.substr(0, length)
  }
  return left < right ? -1 : left > right ? 1 : 0
}

export function cmpbe (left, right, length) {
  return cmp(left.trimEnd(), right.trimEnd(), length)
}

export function cmpi (left, right, length) {
  return cmp(left.toLowerCase(), right.toLowerCase(), length)
}

export function cmpibe (left, right, length) {
  return cmp(left.trimEnd().toLowerCase(), right.trimEnd().toLowerCase(), length)
}

export function collapse (text) {
  return text.replace(/[ \t]/g, '')
}

export function compress (text) {
  return text.replace(/[ \t]+/g, ' ')
}

export function cspn (text, chars) {
  const regexp = new RegExp(`^[^${chars.split('').map(escapeRegExp).join('|')}]+`)
  const match = regexp.exec(text)
  return match ? match[0].length : 0
}

export function cstring (text, quote = '\'') {
  return text.replace(new RegExp(`[\r\n\t\\${quote}]`, 'g'), '\\$1')
}

export function elements (text, delimiter) {
  return text.split(delimiter.charAt(0))
}

export function filetostring (name) {
  return readFileSync(name, 'utf8')
}

export function format (format, ...args) {
  return format.replace(/%(\d)/g, (match, index) => '' + args[index - 1])
}

export function frombase64 (text) {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(text, 'base64').toString('ascii')
    : atob(text)
}

export function hyphenate (text, length) {
  const parts = []
  do {
    parts.push(text.substr(0, length))
    text = text.substr(length)
  } while (text.length)
  return parts
}

export function join (values, delimiter) {
  return values.join(delimiter)
}

export function locate (hay, needle) {
  const index = hay.indexOf(needle)
  return index < 0 ? undefined : index + 1
}

export function locatei (hay, needle) {
  const index = hay.toLowerCase().indexOf(needle.toLowerCase())
  return index < 0 ? undefined : index + 1
}

export function lower (text) {
  return text.toLowerCase()
}

export function quote (text, quote = '\'') {
  return `${quote}${text.replace(new RegExp(quote, 'g'), `\\${quote}`)}${quote}`
}

export function rchr (hay, needle) {
  const index = hay.lastIndexOf(needle.charAt(0))
  return index < 0 ? undefined : index + 1
}

export function replace (text, find, replace) {
  return text.replace(find, replace)
}

export function replaceall (text, find, replace) {
  const regexp = new RegExp(`${find.split('').map(escapeRegExp).join('')}`, 'g')
  return text.replace(regexp, replace)
}

export function set (length, text) {
  return text.charAt(0).repeat(length)
}

export function spn (text, chars) {
  const regexp = new RegExp(`^[${chars.split('').map(escapeRegExp).join('')}]+`)
  const match = regexp.exec(text)
  return match ? match[0].length : 0
}

export function string (value, raw) {
  return !raw && value instanceof Error ? value.message : valuetostring(value)
}

export function stringtointegher (text) {
  return parseInt(text)
}

export function stringtoreal (text) {
  return parseFloat(text)
}

export function stringtovalue (text) {
  const number = parseInt(text)
  if (isNaN(number)) return number
  const normalized = text.toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  if (normalized === 'undefined') return undefined
  return text
}

export function strip (text, chars) {
  const regexp = new RegExp(`[${chars.split('').map(escapeRegExp).join('')}]`, 'g')
  return text.replace(regexp, '')
}

export function tobase64 (text) {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(text).toString('base64')
    : btoa(text)
}

export function upper (text) {
  return text.toUpperCase()
}

export function valuetostring (value) {
  return String(value)
}

// ---------- other methods

function escapeRegExp (char) {
  return char === '*' || char === '+' || char === '.' || char === '?' ||
      char === '[' || char === ']' || char === '(' || char === ')' ||
      char === '{' || char === '}' || char === '^' || char === '$'
    ? `\\${char}`
    : char
}
