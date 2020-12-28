import { createToken, Lexer } from 'chevrotain'
import lexerErrorProvider from './lexer-errors'
import { mark, measure } from './performance'

const tokenArray = []
const tokenDictionary = {}

function addToken (name, options) {
  const token = createToken(options)
  tokenArray.push(token)
  tokenDictionary[name] = token
}

addToken('WhiteSpace', {
  name: 'WhiteSpace',
  pattern: /\s+|;/,
  line_breaks: true,
  group: Lexer.SKIPPED
})

addToken('SingleQuotedStringLiteral', {
  name: 'SingleQuotedStringLiteral',
  pattern: /'[^']+'/
})

addToken('DoubleQuotedStringLiteral', {
  name: 'DoubleQuotedStringLiteral',
  pattern: /"[^"]*"/
})

addToken('BackQuotedStringLiteral', {
  name: 'BackQuotedStringLiteral',
  pattern: /`[^`]*`/,
  line_breaks: true
})

addToken('IntegerLiteral', {
  name: 'IntegerLiteral',
  pattern: /\d+/
})

addToken('RealLiteral', {
  name: 'RealLiteral',
  pattern: /(?:\d+\.\d+|\d+|\.\d+)(?:[eE]-?\d+)?/
})

addToken('BooleanLiteral', { name: 'True', pattern: /(true|false)\b/i })

addToken('UndefinedLiteral', { name: 'Undefined', pattern: /undefined/i }) // none

addToken('ObjectIdentifier', { name: 'ObjectIdentifier', pattern: /(?:this|super)\b/i })

addToken('If', { name: 'If', pattern: /if\b/i })

// addToken('Then', { name: 'Then', pattern: /then/i })

addToken('ElseIf', { name: 'ElseIf', pattern: /elseif\b/i })

addToken('Else', { name: 'Else', pattern: /else\b/i })

addToken('EndScript', { name: 'EndScript', pattern: /endscript\b/i })

addToken('End', { name: 'End', pattern: /end\b/i })

// addToken('Using', { name: 'Using', pattern: /using/ })

// addToken('Do', { name: 'Do', pattern: /do/ })

addToken('For', { name: 'For', pattern: /for\b/ })

addToken('To', { name: 'To', pattern: /to\b/ })

addToken('DownTo', { name: 'DownTo', pattern: /downto\b/ })

addToken('By', { name: 'By', pattern: /by\b/ })

addToken('Inherits', { name: 'Inherits', pattern: /inherits\b/i })

addToken('In', { name: 'In', pattern: /in\b/ })

addToken('While', { name: 'While', pattern: /while\b/ })

addToken('Repeat', { name: 'Repeat', pattern: /repeat\b/ })

addToken('Until', { name: 'Until', pattern: /until\b/i })

addToken('Switch', { name: 'Switch', pattern: /switch\b/ })

addToken('Case', { name: 'Case', pattern: /case\b/ })

addToken('Default', { name: 'Default', pattern: /default\b/ })

addToken('LCurly', { name: 'LCurly', pattern: /{/ })

addToken('RCurly', { name: 'RCurly', pattern: /}/ })

addToken('LSquare', { name: 'LSquare', pattern: /\[/ })

addToken('RSquare', { name: 'RSquare', pattern: /]/ })

addToken('LParen', { name: 'LParen', pattern: /\(/ })

addToken('RParen', { name: 'RParen', pattern: /\)/ })

addToken('Question', { name: 'Question', pattern: /\?/ })

addToken('UnaryOperator', { name: 'UnaryOperator', pattern: /!|-|~|\$\$|\$|\.|not\b/i })

addToken('Equal', { name: 'Equal', pattern: /=/ })

addToken('BinaryOperator', { name: 'BinaryOperator', pattern: /-=|\+=|\*=|&=|\|=|\^=|-|\+|\*|\/|%|\^\^|\^|&&|&|\|\||\||~=|==|!=|<>|<=|<<|<|>=|>>|>|=|and\b|or\b|xor\b|eq\b|ne\b|lt\b|le\b|gt\b|ge\b|in\b/i })

addToken('At', { name: 'At', pattern: /@/ })

addToken('Dot', { name: 'Dot', pattern: /\./ })

addToken('TwoDots', { name: 'TwoDots', pattern: /\.\./ })

addToken('ThreeDots', { name: 'ThreeDots', pattern: /\.\.\./ })

addToken('Comma', { name: 'Comma', pattern: /,/ })

addToken('DoubleColon', { name: 'DoubleColon', pattern: /::/ })

addToken('Colon', { name: 'Colon', pattern: /:/ })

addToken('Return', { name: 'Return', pattern: /return\b/i })

addToken('BreakIf', { name: 'BreakIf', pattern: /breakif\b/i })

addToken('Break', { name: 'Break', pattern: /break\b/i })

addToken('ContinueIf', { name: 'ContinueIf', pattern: /continueif\b/i })

addToken('Continue', { name: 'Continue', pattern: /continue\b/i })

addToken('Goto', { name: 'Goto', pattern: /goto\b/i })

addToken('Assoc', { name: 'Assoc', pattern: /assoc\b/i })

addToken('ObjectKeyword', { name: 'Object', pattern: /object\b/i }) // interface

addToken('SetKeyword', { name: 'Set', pattern: /set\b/i })

addToken('Type', { name: 'Type', pattern: /(?:assoc|boolean|bytes|date|dynamic|frame|integer|list|object|record|real|recarray|set|string|void)\b/i })

addToken('Public', { name: 'Public', pattern: /public\b/i })

addToken('Modifier', { name: 'Modifier', pattern: /(?:public|override|private)\b/i }) // final

addToken('FunctionKeyword', { name: 'Function', pattern: /function\b/i })

addToken('Name', { name: 'Name', pattern: /oarent\b/i })

addToken('Parent', { name: 'Parent', pattern: /name\b/i })

addToken('AddFeature', { name: 'AddFeature', pattern: /addfeature\b/i })

addToken('ScriptEnd', { name: 'ScriptEnd', pattern: /scriptend\b/i })

addToken('Script', { name: 'Script', pattern: /script\b/i })

addToken('Package', { name: 'Package', pattern: /package\b/i })

// addToken('NoDebug', { name: 'NoDebug', pattern: /nodebug\b/ })

addToken('Identifier', {
  name: 'Identifier',
  pattern: /[a-zA-Z_]\w*/
})

addToken('Hash', {
  name: 'Hash',
  pattern: /#/
})

addToken('HashQuote', {
  name: 'HashQuote',
  pattern: /#'[^']*'+(?:[^#'][^']*'+)*'#/
})

addToken('SingleLineComment', {
  name: 'SingleLineComment',
  pattern: /\/\/.*/,
  group: Lexer.SKIPPED
})

addToken('MultiLineComment', {
  name: 'MultiLineComment',
  pattern: /\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//,
  line_breaks: true,
  group: Lexer.SKIPPED
})

addToken('PreprocessorDirective', {
  name: 'PreprocessorDirective',
  pattern: /#\s*\w+.*/,
  group: Lexer.SKIPPED
})

addToken('Backslash', {
  name: 'Backslash',
  pattern: /\\/,
  group: Lexer.SKIPPED
})

class OScriptLexer extends Lexer {
  constructor () {
    super(tokenArray, {
      errorMessageProvider: lexerErrorProvider,
      ensureOptimizations: true,
      positionTracking: 'onlyStart',
      skipValidations: false,
      traceInitPerf: 0
    })
    this.tracePerf = false
  }

  tokenize (text) {
    const start = mark('Lexer Tokenize', this.tracePerf)
    const result = super.tokenize(text)
    measure('Lexer Tokenize', start)
    return result
  }
}

const lexer = new OScriptLexer()
const tokenize = lexer.tokenize.bind(lexer)

export { tokenArray, tokenDictionary, lexer, tokenize }
