/* eslint-disable camelcase */

import { checkType, checkList } from './checks'

export const ascending = 1
export const descending = 2

export function allocate (size) {
  checkType(size, 'number', 1)
  return new Array(size)
}

export function create (...values) {
  return values
}

export function max (list) {
  checkList(list, 1)
  let max = list[0]
  for (let i = 1, l = list.length; i < l; ++i) {
    const value = list[i]
    if (value > max) max = value
  }
  return max
}

export function min (list) {
  checkList(list, 1)
  let min = list[0]
  for (let i = 1, l = list.length; i < l; ++i) {
    const value = list[i]
    if (value < min) min = value
  }
  return min
}

export function setadd (list, item) {
  checkList(list, 1)
  if (list.some(value => value === item)) return list
  return list.concat(item)
}

export function setremove (list, item) {
  checkList(list, 1)
  const index = list.findIndex(value => value === item)
  if (index < 0) return list
  if (index === 0) return list.slice(1)
  const start = list.slice(0, index)
  return index === list.length - 1 ? start : start.concat(list.slice(index + 1))
}

export function setunion (left, right) {
  checkList(left, 1)
  checkList(right, 2)
  const result = left.slice()
  for (const item of right) if (left.every(value => value !== item)) result.push(item)
  return result
}

const compares = [
  undefined,
  function ascending (left, right) {
    return left < right ? -1 : left > right ? 1 : 0
  },
  function descending (left, right) {
    return left < right ? 1 : left > right ? -1 : 0
  }
]

export function sort (list, order) {
  checkList(list, 1)
  const compare = compares[order]
  if (!compare) throw new TypeError(`ASCENDING or DESCENDING expected, but ${typeof order}" found in the second argument`)
  return list.sort(compare)
}
