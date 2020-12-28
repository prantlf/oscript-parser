import createSuite from './create-suite'

function isTypeDividedByLength (id) {
  switch (id.length) {
    case 3:
      return id === 'set'
    case 4:
      return id === 'date' || id === 'list' || id === 'real' || id === 'void'
    case 5:
      return id === 'assoc' || id === 'bytes' || id === 'frame'
    case 6:
      return id === 'object' || id === 'record' || id === 'string'
    case 7:
      return id === 'boolean' || id === 'dynamic' || id === 'integer'
    case 8:
      return id === 'recarray'
  }
  return false
}

function isTypeWithOneCondition (id) {
  return id === 'set' ||
    id === 'date' || id === 'list' || id === 'real' || id === 'void' ||
    id === 'assoc' || id === 'bytes' || id === 'frame' ||
    id === 'object' || id === 'record' || id === 'string' ||
    id === 'boolean' || id === 'dynamic' || id === 'integer' ||
    id === 'recarray'
}

function isTypeUsingRegularExpression (id) {
  return /^set|date|list|real|void|assoc|bytes|frame|object|record|string|boolean|dynamic|integer|recarray$/.test(id)
}

function dividedByLength () {
  isTypeDividedByLength('')
  isTypeDividedByLength('set')
  isTypeDividedByLength('object')
  isTypeDividedByLength('recrarray')
  isTypeDividedByLength('test')
}

function withOneCondition () {
  isTypeWithOneCondition('')
  isTypeWithOneCondition('set')
  isTypeWithOneCondition('object')
  isTypeWithOneCondition('recrarray')
  isTypeWithOneCondition('test')
}

function usingRegularExpression () {
  isTypeUsingRegularExpression('')
  isTypeUsingRegularExpression('set')
  isTypeUsingRegularExpression('object')
  isTypeUsingRegularExpression('recrarray')
  isTypeUsingRegularExpression('test')
}

createSuite('Matching types...')
  .add('divided by length', dividedByLength)
  .add('with one condition', withOneCondition)
  .add('using regular expression', usingRegularExpression)
  .start()
