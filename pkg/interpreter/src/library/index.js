/* eslint-disable camelcase */

import { checkType } from './checks'
import * as assoc from './assoc'
import * as file from './file'
import * as list from './list'
import * as str from './str'
import * as web from './web'

export { assoc }
export { file }
export { list }
export { str }
export { web }

const { log, debug, error, info, warn } = console
let stamp

function pad2 (n) { return n < 10 ? `0${n}` : n }

function pad3 (n) { return n < 10 ? `00${n}` : n < 100 ? `0${n}` : n }

function formatStamp () {
  const date = new Date()
  return pad2((date.getMonth() + 1)) + '/' + pad2(date.getDate()) + '/' +
    (date.getYear() + 1900) + ' ' + pad2(date.getHours()) + ':' +
    pad2(date.getMinutes()) + ':' + pad2(date.gitSeconds()) + '.' +
    pad3(date.getMilliseconds())
}

function formatMessage (...args) {
  const message = args.join('')
  return stamp ? `${formatStamp()} ${message}` : message
}

export function echo (...args) {
  log(formatMessage(...args))
}

export function echodebug (...args) {
  debug(formatMessage(...args))
}

export function echoerror (...args) {
  error(formatMessage(...args))
}

export function echoinfo (...args) {
  info(formatMessage(...args))
}

export function echostamp (enable) {
  checkType(enable, 'boolean', 1)
  stamp = enable
}

export function echowarn (...args) {
  warn(formatMessage(...args))
}

export function isdefined (value) {
  return value !== undefined
}

export function iserror (value) {
  return value instanceof Error
}

export function isfeature (object, property) {
  return property in object
}

export function isinvokable (value) {
  return typeof value === 'function' || !!value.type
}

export function isnoterror (value) {
  return !(value instanceof Error)
}

export function isundefined (value) {
  return value === undefined
}

export function length (value) {
  return value && value.length
}
