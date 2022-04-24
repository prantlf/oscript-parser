/* eslint-disable camelcase */

import { checkType } from './checks'

export const crlf = '\r\n'
export const js_encodeuri = 1
export const js_encodeuricomponent = 2
export const js_escape = 3

export function decodeforurl (text) {
  checkType(text, 'string', 1)
  return decodeURI(text)
}

export function encodeforurl (text) {
  checkType(text, 'string', 1)
  return encodeURI(text)
}

export function escape (text) {
  checkType(text, 'string', 1)
  return encodeURIComponent(text)
}

export function escapeforjs (text, mode) {
  checkType(text, 'string', 1)
  if (mode === js_escape) return escape(text)
  if (mode === js_encodeuri) return encodeURI(text)
  if (mode === js_encodeuricomponent) return encodeURIComponent(text)
  throw new TypeError(`JS_ESCAPE, JS_ENCODEURI or JS_ENCODEURICOMPONENT expected, but ${typeof mode}" found in the second argument`)
}

export function escapehtml (text) {
  checkType(text, 'string', 1)
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/</g, '&gt;')
}

export function escapejson (text, trim = true) {
  checkType(text, 'string', 1)
  checkType(text, 'boolean', 2)
  if (trim) text = text.trim()
  const string = JSON.stringify(text)
  return string.substr(1, string.length - 2)
}

export function escapexml (text) {
  checkType(text, 'string', 1)
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/</g, '&gt;')
    .replace(/'/g, '&apos;')
}

export function tojson (text, trim = true) {
  checkType(text, 'string', 1)
  checkType(text, 'boolean', 2)
  // TODO: Trim all strings in the serialized output.
  return JSON.parse(trimStrings(text))
}

export function unescape (text) {
  checkType(text, 'string', 1)
  return decodeURIComponent(text)
}

export function unescapejson (text) {
  checkType(text, 'string', 1)
  return JSON.parse(`"${text}}"`)
}

// ---------- other methods

function trimStrings (value) {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    for (let i = 0, l = value.length; i < l; ++i) value[i] = trimStrings(value[i])
  }
  if (value && typeof value === 'object') {
    for (const key in value) value[key] = trimStrings(value[key])
  }
  return value
}
