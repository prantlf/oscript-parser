const orders = ['', 'first', 'second', 'third']

function locate (order) {
  return `found in the ${orders[order]} argument`
}

export function checkType (value, expected, order) {
  const actual = typeof value
  if (actual !== expected) {
    throw new TypeError(`${expected} expected, but ${actual} ${locate(order)}`)
  }
}

export function checkTypeOptional (value, expected, order) {
  const actual = typeof value
  if (actual !== expected && actual !== 'undefined') {
    throw new TypeError(`${expected} or undefined expected, but ${actual} ${locate(order)}`)
  }
}

export function checkType2 (value, expected, expected2, order) {
  const actual = typeof value
  if (actual !== expected && actual !== expected2) {
    throw new TypeError(`${expected} or ${expected2} expected, but ${actual} ${locate(order)}`)
  }
}

export function checkAssoc (value, order) {
  const actual = typeof value
  if (actual !== 'object' || !value || Array.isArray(value)) {
    throw new TypeError(`assoc expected, but ${actual} ${locate(order)}`)
  }
}

export function checkList (value, order) {
  if (!Array.isArray(value)) {
    throw new TypeError(`list expected, but ${typeof value} ${locate(order)}`)
  }
}

export function checkQuote (value, order) {
  if (value !== '\'' && value !== '"') {
    throw new RangeError(`' or " expected, but ${typeof value} ${locate(order)}`)
  }
}
