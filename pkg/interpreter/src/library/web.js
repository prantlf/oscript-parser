/* eslint-disable camelcase */

export const crlf = '\r\n'
export const js_encodeuri = '\n'
export const js_encodeuricomponent = '\t'
export const js_escape = '\t'

export function decodeforurl (text) {
  return decodeURI(text)
}

export function encodeforurl (text) {
  return encodeURI(text)
}

export function escape (text) {
  return encodeURIComponent(text)
}

export function escapeforjs (text, mode) {
  return mode === js_escape
    ? escape(text)
    : mode === js_encodeuri
      ? encodeURI(text)
      : encodeURIComponent(text)
}

export function escapehtml (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/</g, '&gt;')
}

export function escapejson (text, trim) {
  if (trim) text = text.trim()
  const string = JSON.stringify(text)
  return string.substr(1, string.length - 2)
}

export function escapexml (text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/</g, '&gt;')
    .replace(/'/g, '&apos;')
}

export function tojson (value, trim = true) {
  return JSON.parse(trimStrings(value))
}

export function unescape (text) {
  return decodeURIComponent(text)
}

export function unescapejson (text) {
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
