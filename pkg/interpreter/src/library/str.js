/* eslint-disable camelcase */
/* globals atob, btoa */

import { readFileSync, writeFileSync } from 'fs'
import {
  checkType, checkTypeOptional, checkType2, checkList, checkQuote
} from './checks'

export const cr = '\r'
export const crlf = '\r\n'
export const lf = '\n'
export const tab = '\t'

export function ascii (value) {
  checkType2(value, 'string', 'number', 1)
  return typeof value === 'number' ? String.fromCharCode(value) : value.charCodeAt(0)
}

export function bytelength (text) {
  checkType(text, 'string', 1)
  return typeof Buffer !== 'undefined'
    ? Buffer.from(text).length
    : new TextEncoder().encode(text).length
}

export function capitalize (text) {
  checkType(text, 'string', 1)
  return text.replace(/(\w+)/g, match =>
    match.charAt(0).toUpperCase() + match.substr(1).toLowerCase())
}

export function catenate (values, delimiter) {
  checkList(values, 1)
  checkType(delimiter, 'string', 2)
  const suffix = values.length ? delimiter : ''
  return `${values.join(delimiter)}${suffix}`
}

export function chr (hay, needle) {
  checkType(hay, 'string', 1)
  checkType(needle, 'string', 2)
  const index = hay.indexOf(needle.charAt(0))
  return index < 0 ? undefined : index + 1
}

export function cmp (left, right, length) {
  checkType(left, 'string', 1)
  checkType(right, 'string', 2)
  checkTypeOptional(length, 'number', 3)
  if (length !== undefined) {
    left = left.substr(0, length)
    right = right.substr(0, length)
  }
  return left < right ? -1 : left > right ? 1 : 0
}

export function cmpbe (left, right, length) {
  checkType(left, 'string', 1)
  checkType(right, 'string', 2)
  checkTypeOptional(length, 'number', 3)
  return cmp(left.trimEnd(), right.trimEnd(), length)
}

export function cmpi (left, right, length) {
  checkType(left, 'string', 1)
  checkType(right, 'string', 2)
  checkTypeOptional(length, 'number', 3)
  return cmp(left.toLowerCase(), right.toLowerCase(), length)
}

export function cmpibe (left, right, length) {
  checkType(left, 'string', 1)
  checkType(right, 'string', 2)
  checkTypeOptional(length, 'number', 3)
  return cmp(left.trimEnd().toLowerCase(), right.trimEnd().toLowerCase(), length)
}

export function collapse (text) {
  checkType(text, 'string', 1)
  return text.replace(/[ \t]/g, '')
}

export function compress (text) {
  checkType(text, 'string', 1)
  return text.replace(/[ \t]+/g, ' ')
}

export function cspn (text, chars) {
  checkType(text, 'string', 1)
  checkType(chars, 'string', 2)
  const regexp = new RegExp(`^[^${chars.split('').map(escapeRegExp).join('|')}]+`)
  const match = regexp.exec(text)
  return match ? match[0].length : 0
}

export function cstring (text, quote = '\'') {
  return text.replace(new RegExp(`[\r\n\t\\${quote}]`, 'g'), '\\$1')
}

export function elements (text, delimiter) {
  checkType(text, 'string', 1)
  checkType(delimiter, 'string', 2)
  return text.split(delimiter.charAt(0))
}

export function filetostring (name) {
  checkType(name, 'string', 1)
  try {
    return readFileSync(name, 'utf8')
  } catch (error) {
    return error
  }
}

export function format (format, ...args) {
  return format.replace(/%(\d)/g, (match, index) => '' + args[index - 1])
}

export function frombase64 (text) {
  checkType(text, 'string', 1)
  return typeof Buffer !== 'undefined'
    ? Buffer.from(text, 'base64').toString('ascii')
    : atob(text)
}

export function hyphenate (text, length) {
  checkType(text, 'string', 1)
  checkType(text, 'number', 2)
  const parts = []
  do {
    parts.push(text.substr(0, length))
    text = text.substr(length)
  } while (text.length)
  return parts
}

export function join (values, delimiter) {
  checkList(values, 1)
  checkType(delimiter, 'string', 2)
  return values.join(delimiter)
}

export function locate (hay, needle) {
  checkType(hay, 'string', 1)
  checkType(needle, 'string', 2)
  const index = hay.indexOf(needle)
  return index < 0 ? undefined : index + 1
}

export function locatei (hay, needle) {
  checkType(hay, 'string', 1)
  checkType(needle, 'string', 2)
  const index = hay.toLowerCase().indexOf(needle.toLowerCase())
  return index < 0 ? undefined : index + 1
}

export function lower (text) {
  checkType(text, 'string', 1)
  return text.toLowerCase()
}

export function quote (text, quote = '\'') {
  checkType(text, 'string', 1)
  checkQuote(quote, 2)
  return `${quote}${text.replace(new RegExp(quote, 'g'), `\\${quote}`)}${quote}`
}

export function rchr (hay, needle) {
  checkType(hay, 'string', 1)
  checkType(needle, 'string', 2)
  const index = hay.lastIndexOf(needle.charAt(0))
  return index < 0 ? undefined : index + 1
}

export function replace (text, find, replace) {
  checkType(text, 'string', 1)
  checkType(find, 'string', 2)
  checkType(replace, 'string', 3)
  return text.replace(find, replace)
}

export function replaceall (text, find, replace) {
  checkType(text, 'string', 1)
  checkType(find, 'string', 2)
  checkType(replace, 'string', 3)
  const regexp = new RegExp(`${find.split('').map(escapeRegExp).join('')}`, 'g')
  return text.replace(regexp, replace)
}

export function set (length, text) {
  checkType2(text, 'string', 'number', 1)
  checkType(text, 'string', 2)
  if (typeof length === 'string') length = length.length
  else if (length < 0) length = 0
  return text.charAt(0).repeat(length)
}

export function spn (text, chars) {
  checkType(text, 'string', 1)
  checkType(chars, 'string', 2)
  const regexp = new RegExp(`^[${chars.split('').map(escapeRegExp).join('')}]+`)
  const match = regexp.exec(text)
  return match ? match[0].length : 0
}

export function string (value, raw = false) {
  checkType(raw, 'boolean', 2)
  return !raw && value instanceof Error ? value.message : valuetostring(value)
}

export function stringtofile (name, content) {
  checkType(name, 'string', 1)
  checkType(content, 'string', 1)
  try {
    writeFileSync(name, content)
    return true
  } catch (error) {
    return error
  }
}

export function stringtointegher (text) {
  return parseInt(text)
}

export function stringtoreal (text) {
  checkType(text, 'string', 1)
  return parseFloat(text)
}

export function stringtovalue (text) {
  checkType(text, 'string', 1)
  const number = parseInt(text)
  if (isNaN(number)) return number
  const normalized = text.toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  if (normalized === 'undefined') return undefined
  return text
}

export function strip (text, chars) {
  checkType(text, 'string', 1)
  checkType(chars, 'string', 2)
  const regexp = new RegExp(`[${chars.split('').map(escapeRegExp).join('')}]`, 'g')
  return text.replace(regexp, '')
}

export function tobase64 (text) {
  checkType(text, 'string', 1)
  return typeof Buffer !== 'undefined'
    ? Buffer.from(text).toString('base64')
    : btoa(text)
}

export function upper (text) {
  checkType(text, 'string', 1)
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
