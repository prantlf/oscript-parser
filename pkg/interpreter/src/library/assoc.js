/* eslint-disable camelcase */

import { checkAssoc } from './checks'

export const ascending = 1
export const descending = 2

export function copy (assoc) {
  checkAssoc(assoc, 1)
  return { ...assoc }
}

// TODO: Implement the undefined value.
export function createassoc () {
  return {}
}

export function createfrompairs (...pairs) {
  const result = {}
  for (let i = 1, l = pairs.length; i < l; i += 2) result[pairs[i]] = pairs[i + 1]
  return result
}

export function remove (assoc, key) {
  checkAssoc(assoc, 1)
  delete assoc[key]
}

export { remove as delete }

export function iskey (assoc, key) {
  checkAssoc(assoc, 1)
  return key in assoc
}

export function items (assoc) {
  checkAssoc(assoc, 1)
  return Object.values(assoc)
}

export function keys (assoc) {
  checkAssoc(assoc, 1)
  return Object.keys(assoc)
}

export function merge (left, right) {
  checkAssoc(left, 1)
  checkAssoc(right, 2)
  return { ...left, ...right }
}

export function undefinedvalue (assoc) {
  checkAssoc(assoc, 1)
}
