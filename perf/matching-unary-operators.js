import createSuite from './create-suite'

function isUnaryOperatorDividedByLength (symbol) {
  switch (symbol.length) {
    case 1:
      return symbol === '!' || symbol === '-' || symbol === '~' ||
        symbol === '$'
    case 2:
      return symbol === '$$'
    case 3:
      return symbol === 'not'
  }
  return false
}

function isUnaryOperatorWithOneCondition (symbol) {
  return symbol === '!' || symbol === '-' || symbol === '~' ||
    symbol === '$' || symbol === '$$' || symbol === 'not'
}

function isUnaryOperatorUsingRegularExpression (symbol) {
  return /^!|-|~|\$\$|\$|not$/.test(symbol)
}

const set = new Set(['!', '-', '~', '$$', '$', 'not'])

function isUnaryOperatorUsingSet (symbol) {
  return set.has(symbol)
}

function dividedByLength () {
  isUnaryOperatorDividedByLength('')
  isUnaryOperatorDividedByLength('!')
  isUnaryOperatorDividedByLength('~')
  isUnaryOperatorDividedByLength('not')
  isUnaryOperatorDividedByLength('test')
}

function withOneCondition () {
  isUnaryOperatorWithOneCondition('')
  isUnaryOperatorWithOneCondition('!')
  isUnaryOperatorWithOneCondition('~')
  isUnaryOperatorWithOneCondition('not')
  isUnaryOperatorWithOneCondition('test')
}

function usingSet () {
  isUnaryOperatorUsingSet('')
  isUnaryOperatorUsingSet('!')
  isUnaryOperatorUsingSet('~')
  isUnaryOperatorUsingSet('not')
  isUnaryOperatorUsingSet('test')
}

function usingRegularExpression () {
  isUnaryOperatorUsingRegularExpression('')
  isUnaryOperatorUsingRegularExpression('!')
  isUnaryOperatorUsingRegularExpression('~')
  isUnaryOperatorUsingRegularExpression('not')
  isUnaryOperatorUsingRegularExpression('test')
}

createSuite('Matching unary operators...')
  .add('divided by length', dividedByLength)
  .add('with one condition', withOneCondition)
  .add('using set', usingSet)
  .add('using regular expression', usingRegularExpression)
  .start()
