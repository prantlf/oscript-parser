import assert from 'assert'
import createSuite from './create-suite'

const operatorPrecedences = [
  ['=', 13],
  ['+', 2],
  ['-', 2],
  ['*', 1],
  ['/', 1],
  ['<', 5],
  ['>', 5],
  ['%', 1],
  ['&', 7],
  ['|', 9],
  ['^', 8],
  ['==', 6],
  ['!=', 6],
  ['<>', 6],
  ['<=', 5],
  ['>=', 5],
  ['&&', 10],
  ['||', 12],
  ['in', 4],
  ['+=', 14],
  ['-=', 14],
  ['*=', 14],
  ['&=', 14],
  ['|=', 14],
  ['^=', 14],
  ['<<', 3],
  ['>>', 3],
  ['or', 12],
  ['eq', 6],
  ['ne', 6],
  ['lt', 5],
  ['le', 5],
  ['gt', 5],
  ['ge', 5],
  ['and', 10],
  ['xor', 11]
]

function isBinaryOperator (symbol) {
  switch (symbol.length) {
    case 1:
      return symbol === '=' || symbol === '+' || symbol === '-' ||
        symbol === '*' || symbol === '/' || symbol === '<' || symbol === '>' ||
        symbol === '%' || symbol === '&' || symbol === '|' || symbol === '^'
    case 2:
      return symbol === '==' || symbol === '!=' || symbol === '<>' ||
        symbol === '<=' || symbol === '>=' || symbol === '&&' ||
        symbol === '||' || symbol === 'in' || symbol === '+=' ||
        symbol === '-=' || symbol === '*=' || symbol === '&=' ||
        symbol === '|=' || symbol === '^=' || symbol === '<<' ||
        symbol === '>>' || symbol === 'or' || symbol === 'eq' ||
        symbol === 'ne' || symbol === 'lt' || symbol === 'le' ||
        symbol === 'gt' || symbol === 'ge'
    case 3:
      return symbol === 'and' || symbol === 'xor'
  }
  return false
}

function getPrecedenceWithAllStrings (symbol) {
  switch (symbol) {
    case '=': return 13
    case '+': case '-': return 2
    case '*': case '/': case '%': return 1
    case '<': case '>': case '<=': case '>=': case 'lt': case 'le': case 'gt':
    case 'ge': return 5
    case '&': return 7
    case '|': return 9
    case '^': return 8
    case '==': case '!=': case '<>': case 'eq': case 'ne': return 6
    case '&&': case 'and': return 10
    case '||': case 'or': return 12
    case 'in': return 4
    case '+=': case '-=': case '*=': case '&=': case '|=': case '^=': return 14
    case '<<': case '>>': return 3
    case 'xor': return 11
  }
}

function getPrecedenceWithGroupedStrings (symbol) {
  switch (symbol.length) {
    case 1:
      switch (symbol) {
        case '=': return 13
        case '+': case '-': return 2
        case '*': case '/': case '%': return 1
        case '<': case '>': return 5
        case '&': return 7
        case '|': return 9
        case '^': return 8
      }
      break
    case 2:
      switch (symbol) {
        case '==': case '!=': case '<>': case 'eq': case 'ne': return 6
        case '<=': case '>=': case 'lt': case 'le': case 'gt': case 'ge': return 5
        case '&&': return 10
        case '||': return 12
        case 'in': return 4
        case '+=': case '-=': case '*=': case '&=': case '|=': case '^=': return 14
        case '<<': case '>>': return 3
        case 'or': return 12
      }
      break
    case 3:
      switch (symbol) {
        case 'and': return 10
        case 'xor': return 11
      }
      break
  }
}

function getPrecedenceWithNumbers (symbol) {
  switch (symbol.length) {
    case 1:
      switch (symbol.charCodeAt(0)) {
        case 61: return 13                  // =
        case 43: case 45: return 2          // + -
        case 60: case 62: return 5          // < >
        case 38: return 7                   // &
        case 124: return 9                  // |
        case 94: return 8                   // ^
        case 42: case 47: case 37: return 1 // * / %
      }
      break
    case 2:
      switch (symbol.charCodeAt(0)) {
        case 60: // <
          switch (symbol.charCodeAt(1)) {
            case 62: return 6 // >
            case 61: return 5 // =
            case 60: return 3 // <
          }
          break
        case 62: // >
          switch (symbol.charCodeAt(1)) {
            case 61: return 5 // =
            case 62: return 3 // >
          }
          break
        case 38: // &
          switch (symbol.charCodeAt(1)) {
            case 38: return 10 // &
            case 61: return 14 // =
          }
          break
        case 124: // |
          switch (symbol.charCodeAt(1)) {
            case 124: return 10 // |
            case 61: return 14  // =
          }
          break
        case 108: case 103: return 5                   // lt le gt ge
        case 61: case 33: case 101: case 110: return 6 // == != eq ne
        case 105: return 4                             // in
        case 111: return 12                            // or
        case 43: case 45: case 42: case 94: return 14  // + - * ^
      }
      break
    case 3:
      switch (symbol.charCodeAt(0)) {
        case 97: return 10  // and
        case 120: return 11 // xor
      }
      break
  }
}

const object = operatorPrecedences.reduce((result, [operator, precedence]) => {
  result[operator] = precedence
  return result
}, {})
const map = new Map(operatorPrecedences)
const set = new Set(operatorPrecedences.map(([operator]) => operator))

assert(Object.keys(object).length === 36)
assert(map.size === 36)
assert(set.size === 36)

let precedence

function lookupObject () {
  precedence = object['=']
  precedence = object['>']
  precedence = object['&&']
  precedence = object['ne']  // eslint-disable-line dot-notation
  precedence = object['xor'] // eslint-disable-line dot-notation
  precedence = object['fb']  // eslint-disable-line dot-notation
}

function lookupMap () {
  precedence = map.get('=')
  precedence = map.get('>')
  precedence = map.get('&&')
  precedence = map.get('ne')
  precedence = map.get('xor')
  precedence = set.has('fb')
}

function lookupSet () {
  precedence = set.has('=')
  precedence = set.has('>')
  precedence = set.has('&&')
  precedence = set.has('ne')
  precedence = set.has('xor')
  precedence = set.has('fb')
}

function lookupConditionsWithAllStrings () {
  precedence = getPrecedenceWithAllStrings('=')
  precedence = getPrecedenceWithAllStrings('>')
  precedence = getPrecedenceWithAllStrings('&&')
  precedence = getPrecedenceWithAllStrings('ne')
  precedence = getPrecedenceWithAllStrings('xor')
  precedence = getPrecedenceWithAllStrings('^^')
}

function lookupConditionsWithGroupedStrings () {
  precedence = getPrecedenceWithGroupedStrings('=')
  precedence = getPrecedenceWithGroupedStrings('>')
  precedence = getPrecedenceWithGroupedStrings('&&')
  precedence = getPrecedenceWithGroupedStrings('ne')
  precedence = getPrecedenceWithGroupedStrings('xor')
  precedence = getPrecedenceWithGroupedStrings('^^')
}

function lookupConditionsWithNumbers () {
  precedence = getPrecedenceWithNumbers('=')
  precedence = getPrecedenceWithNumbers('>')
  precedence = getPrecedenceWithNumbers('&&')
  precedence = getPrecedenceWithNumbers('ne')
  precedence = getPrecedenceWithNumbers('xor')
  precedence = getPrecedenceWithNumbers('^^')
}

function validate () {
  precedence = isBinaryOperator('=')
  precedence = isBinaryOperator('>')
  precedence = isBinaryOperator('&&')
  precedence = isBinaryOperator('ne')
  precedence = isBinaryOperator('xor')
  precedence = isBinaryOperator('^^')
}

createSuite('Look an operator precedence up...')
  .add('in an object', lookupObject)
  .add('in a map', lookupMap)
  .add('in a set', lookupSet)
  .add('by conditions with all strings', lookupConditionsWithAllStrings)
  .add('by conditions with grouped strings', lookupConditionsWithGroupedStrings)
  .add('by conditions with numbers', lookupConditionsWithNumbers)
  .add('only a validation', validate)
  .start()

assert(precedence === false)
