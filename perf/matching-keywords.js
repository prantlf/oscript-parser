import createSuite from './create-suite'

function isKeywordDividedByLength (id) {
  switch (id.length) {
    case 2:
      return id === 'by' || id === 'do' || id === 'eq' || id === 'ge' ||
        id === 'gt' || id === 'if' || id === 'in' || id === 'le' ||
        id === 'lt' || id === 'ne' || id === 'or' || id === 'to'
    case 3:
      return id === 'and' || id === 'end' || id === 'for' || id === 'not'
    case 4:
      return id === 'case' || id === 'else' || id === 'goto' ||
        id === 'none' || id === 'then'
    case 5:
      return id === 'break' || id === 'final' || id === 'until' ||
        id === 'using' || id === 'while'
    case 6:
      return id === 'downto' || id === 'elseif' || id === 'object' ||
        id === 'public' || id === 'repeat' || id === 'return' ||
        id === 'script' || id === 'switch'
    case 7:
      return id === 'breakif' || id === 'default' || id === 'nodebug' ||
        id === 'package' || id === 'private'
    case 8:
      return id === 'continue' || id === 'function' || id === 'inherits' ||
        id === 'override'
    case 9:
      return id === 'endscript' || id === 'interface'
    case 10:
      return id === 'continueif'
  }
  return false
}

function isKeywordWithOneCondition (id) {
  return id === 'by' || id === 'do' || id === 'eq' || id === 'ge' ||
    id === 'gt' || id === 'if' || id === 'in' || id === 'le' ||
    id === 'lt' || id === 'ne' || id === 'or' || id === 'to' ||
    id === 'and' || id === 'end' || id === 'for' || id === 'not' ||
    id === 'case' || id === 'else' || id === 'goto' ||
    id === 'none' || id === 'then' ||
    id === 'break' || id === 'final' || id === 'until' ||
    id === 'using' || id === 'while' ||
    id === 'downto' || id === 'elseif' || id === 'object' ||
    id === 'public' || id === 'repeat' || id === 'return' ||
    id === 'script' || id === 'switch' ||
    id === 'breakif' || id === 'default' || id === 'nodebug' ||
    id === 'package' || id === 'private' ||
    id === 'continue' || id === 'function' || id === 'inherits' ||
    id === 'override' ||
    id === 'endscript' || id === 'interface' ||
    id === 'continueif'
}

function isKeywordUsingRegularExpression (id) {
  return /^by|do|eq|ge|gt|if|in|le|lt|ne|or|to|and|end|for|not|case|else|goto|none|then|break|final|until|using|while|downto|elseif|object|public|repeat|return|script|switch|breakif|default|nodebug|package|private|continue|function|inherits|override|endscript|interface|continueif$/.test(id)
}

const set = new Set(['by', 'do', 'eq', 'ge', 'gt', 'if', 'in', 'le', 'lt', 'ne', 'or', 'to', 'and', 'end', 'for', 'not', 'case', 'else', 'goto', 'none', 'then', 'break', 'final', 'until', 'using', 'while', 'downto', 'elseif', 'object', 'public', 'repeat', 'return', 'script', 'switch', 'breakif', 'default', 'nodebug', 'package', 'private', 'continue', 'function', 'inherits', 'override', 'endscript', 'interface', 'continueif'])

function isKeywordUsingSet (id) {
  return set.has(id)
}

function dividedByLength () {
  isKeywordDividedByLength('')
  isKeywordDividedByLength('by')
  isKeywordDividedByLength('object')
  isKeywordDividedByLength('continueif')
  isKeywordDividedByLength('test')
}

function withOneCondition () {
  isKeywordWithOneCondition('')
  isKeywordWithOneCondition('by')
  isKeywordWithOneCondition('object')
  isKeywordWithOneCondition('continueif')
  isKeywordWithOneCondition('test')
}

function usingRegularExpression () {
  isKeywordUsingRegularExpression('')
  isKeywordUsingRegularExpression('by')
  isKeywordUsingRegularExpression('object')
  isKeywordUsingRegularExpression('continueif')
  isKeywordUsingRegularExpression('test')
}

function usingSet () {
  isKeywordUsingSet('')
  isKeywordUsingSet('by')
  isKeywordUsingSet('object')
  isKeywordUsingSet('continueif')
  isKeywordUsingSet('test')
}

createSuite('Matching keywords...')
  .add('divided by length', dividedByLength)
  .add('with one condition', withOneCondition)
  .add('using set', usingSet)
  .add('using regular expression', usingRegularExpression)
  .start()
