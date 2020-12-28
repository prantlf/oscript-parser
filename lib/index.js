import errors from './errors'
import ast from './ast'
import * as tokenTypes from './tokens'
import {
  isLineTerminator, isWhitespace, isDecimalDigit, isHexadecimalDigit,
  isIdentifierStart, isIdentifierPart, isKeyword, isType, isUnaryOperator,
  isBinaryOperator
} from './validation'
import sprintf from './sprintf'
import defaultOptions from './default-options'

const {
  EOF, Punctuator, Keyword, Identifier, KeywordOrIdentifier,
  Literal, StringLiteral, IntegerLiteral, RealLiteral, DateLiteral,
  BooleanLiteral, UndefinedLiteral, ObjRef, LegacyAlias,
  Whitespace, Comment, PreprocessorDirective, PreprocessedAway
} = tokenTypes

const slice = Array.prototype.slice

// ============================================================
// Error Handling

let sourceFile, input, lineStart, offset, line, tokens

// Create a lexing or parsing error.
//
// Ensures properties offset, like, column and source on the error instance.

function createError (message, offset, line, column) {
  const error = new SyntaxError(message)
  const properties = {
    source: { writable: true, value: sourceFile },
    offset: { writable: true, value: offset },
    line: { writable: true, value: line },
    column: { writable: true, value: column },
    tokens: { writable: true, value: tokens }
  }
  return Object.create(error, properties)
}

// Throw an error.
//
// Expects a token, a string format and its parameters.
//
// Example:
//
//   // Say "expected [ near ("
//   throwError(token, "expected %1 near %2", '[', token.value)

function throwError (token) {
  const message = sprintf.apply(null, slice.call(arguments, 1))
  let column

  if (token === null || typeof token.line === 'undefined') {
    column = offset - lineStart + 1
  } else {
    offset = token.range[0]
    line = token.line
    column = offset - token.lineStart
  }

  throw createError(message, offset, line, column)
}

function tokenValue (token) {
  return input.slice(token.range[0], token.range[1]) || token.value
}

// Throw an unexpected token error.
//
// Usage should pass either a token object or a symbol string which was
// expected or both. We can also specify a nearby token such as <eof>,
// this will default to the currently active token.
//
// Examples:
//
//   // Say "Unexpected symbol 'end' near '<eof>'"
//   handleUnexpectedToken(token)
//   // Say "expected <name> near '0'"
//   handleUnexpectedToken(token, '<name>')

function handleUnexpectedToken (found, expected) {
  if (expected) {
    throwError(found, errors.expectedToken, expected, tokenValue(tokenAhead))
  }
  if (typeof found.type !== 'undefined') {
    let type
    switch (found.type) {
      case EOF: throwError(found, errors.unexpectedEOF); break
      case Punctuator: type = 'symbol'; break
      case Keyword: type = 'keyword'; break
      case Identifier: type = 'identifier'; break
      case StringLiteral: type = 'string'; break
      case IntegerLiteral: type = 'integer'; break
      case RealLiteral: type = 'real'; break
      case DateLiteral: type = 'date'; break
      case BooleanLiteral: type = 'boolean'; break
      case ObjRef: type = 'objref'; break
      case LegacyAlias: type = 'legacyalias'; break
      case UndefinedLiteral:
        throwError(found, errors.unexpected, 'literal', 'undefined', tokenValue(tokenAhead))
    }
    throwError(found, errors.unexpected, type, tokenValue(found), tokenValue(tokenAhead))
  }
  throwError(found, errors.unexpected, 'symbol', found, tokenValue(tokenAhead))
}

// ============================================================
// Lexer

// ---------- Token extraction

let length, tokenStart, afterLineBreak, afterScript
let enableTokenization, includeWhitespace, includePreprocessor, onCreateToken

// Scans the input at the current offset and returns a token lexed from it.
// Skips white space, comments, preprocessor directives and the content
// enclosed in the alternative part of the preprocessor condition

function getTokenFromInput () {
  let charCode, peekCharCode, token
  let offsetWhitespace, lineStartWhitespace, lineWhitespace
  let offsetToSkip, lineStartToSkip, lineToSkip

  let joinLines = false
  afterLineBreak = false
  do {
    // Whitespace has no semantic meaning in OScript so simply skip ahead while
    // tracking the encountered newlines. Any kind of eol sequence is counted as
    // a single line break.
    offsetWhitespace = offset
    lineStartWhitespace = lineStart
    lineWhitespace = line
    while (offset < length) {
      charCode = input.charCodeAt(offset)
      peekCharCode = input.charCodeAt(offset + 1)
      switch (charCode) {
        case 32: case 9: case 0xB: case 0xC:
          ++offset
          continue
        case 10: case 13:
          // Count \r\n as one newline.
          if (charCode === 13 && peekCharCode === 10) ++offset
          ++line
          lineStart = ++offset
          if (!joinLines) afterLineBreak = true
          else joinLines = false
          continue
        case 47:
          if (peekCharCode === 42) { // *
            scanComment(true)
            joinLines = false
            offsetWhitespace = offset
            continue
          } else if (peekCharCode === 47) { // /
            scanComment(false)
            joinLines = false
            offsetWhitespace = offset
            continue
          }
          break
        case 35: // #
          if (!((peekCharCode === 39 && !oldVersion) || isDecimalDigit(peekCharCode))) { // '
            const include = scanPreprocessorDirective()
            if (include === false) {
              offsetToSkip = offset
              lineStartToSkip = lineStart
              lineToSkip = line
            } else if (include === true) {
              if (onCreateToken && includePreprocessor) {
                onCreateToken({
                  type: PreprocessedAway,
                  value: input.slice(offsetToSkip, offset),
                  line: lineToSkip,
                  lineStart: lineStartToSkip,
                  lastLine: line,
                  lastLineStart: lineStart,
                  range: [offsetToSkip, offset],
                  afterLineBreak
                })
              }
            }
            offsetWhitespace = offset
            joinLines = false
            continue
          }
          break
        case 92: // \
          if (isWhitespace(peekCharCode)) joinLines = true
          ++offset
          continue
      }
      break
    }

    if (!enableTokenization) {
      // text in an ignored preprocessor scope cannot be fully tokenised
      // because it may contain invalid code
      while (offset < length && !isLineTerminator(input.charCodeAt(++offset)));
      continue
    }

    // Memorize the range offset where the token begins.
    tokenStart = offset

    if (offset >= length) {
      const token = finishToken({ type: EOF, value: '<eof>' })
      if (onCreateToken) onCreateToken(token)
      return token
    }

    if (onCreateToken && includeWhitespace && offsetWhitespace < offset) {
      onCreateToken({
        type: Whitespace,
        value: input.slice(offsetWhitespace, offset),
        line: lineWhitespace,
        lineStart: lineStartWhitespace,
        lastLine: line,
        lastLineStart: lineStart,
        range: [offsetWhitespace, offset],
        afterLineBreak
      })
    }

    if (isIdentifierStart(charCode)) {
      const token = scanIdentifierOrKeyword()
      // const value = identifierOrKeyword.value
      // afterScript = value === 'script' || value === 'name'
      afterScript = token.value === 'script'
      if (onCreateToken) onCreateToken(token)
      return token
    }

    switch (charCode) {
      case 39: case 34: // '"
        token = scanStringLiteral()
        break

      case 96: // `
        if (oldVersion) break
        token = scanStringLiteral()
        break

      case 35: // #
        if (peekCharCode === 39 && !oldVersion) token = scanHashQuote() // '
        else if (isHexadecimalDigit(peekCharCode)) token = scanObjRef()
        else throwError(null, errors.malformedNumber, input.slice(offset, offset + 1))
        break

      case 48: case 49: case 50: case 51: case 52: case 53:
      case 54: case 55: case 56: case 57: // 0-9
        token = scanNumericOrDateLiteral(true)
        break

      case 46: // .
        // If the dot is followed by a digit it's a float.
        if (isDecimalDigit(peekCharCode)) {
          token = scanNumericOrDateLiteral(false)
        } else if (peekCharCode === 46) {
          if (input.charCodeAt(offset + 2) === 46) token = scanPunctuator('...')
          else token = scanPunctuator('..')
        } else {
          token = scanPunctuator('.')
        }
        break

        // case 36: // $
        //   if (peekCharCode === 36) token = scanPunctuator('$$')
        //   else token = scanPunctuator('$')
        //   break

      case 58: // :
        if (!oldVersion && peekCharCode === 58) token = scanPunctuator('::')
        else token = scanPunctuator(':')
        break

      case 60: // <
        if (peekCharCode === 60) token = scanPunctuator('<<')
        else if (peekCharCode === 62) token = scanPunctuator('<>')
        else if (peekCharCode === 61) token = scanPunctuator('<=')
        else token = scanPunctuator('<')
        break

      case 62: // >
        if (peekCharCode === 62) token = scanPunctuator('>>')
        else if (peekCharCode === 61) token = scanPunctuator('>=')
        else token = scanPunctuator('>')
        break

      case 38: // &
        if (peekCharCode === 38) token = scanPunctuator('&&')
        else if (peekCharCode === 61) token = scanPunctuator('&=')
        else if (isHexadecimalDigit(peekCharCode)) token = scanLegacyAlias()
        else token = scanPunctuator('&')
        break

      case 94: // ^
        if (peekCharCode === 94) token = scanPunctuator('^^')
        else if (peekCharCode === 61) token = scanPunctuator('^=')
        else token = scanPunctuator('^')
        break

      case 124: // |
        if (peekCharCode === 124) token = scanPunctuator('||')
        else if (peekCharCode === 61) token = scanPunctuator('|=')
        else token = scanPunctuator('|')
        break

      case 33: // !
        if (peekCharCode === 61) token = scanPunctuator('!=')
        else token = scanPunctuator('!')
        break

      case 42: // *
        if (peekCharCode === 61) token = scanPunctuator('*=')
        else token = scanPunctuator('*')
        break

      case 43: // +
        if (peekCharCode === 61) token = scanPunctuator('+=')
        else token = scanPunctuator('+')
        break

      case 45: // -
        if (peekCharCode === 61) token = scanPunctuator('-=')
        else token = scanPunctuator('-')
        break

      case 61: // =
        if (peekCharCode === 61) token = scanPunctuator('==')
        else token = scanPunctuator('=')
        break

      case 126: // ~
        if (peekCharCode === 61) token = scanPunctuator('~=')
        else token = scanPunctuator('~')
        break

      case 37: case 44: case 47: case 63: case 64: case 123: case 125: case 91:
      case 92: case 93: case 40: case 41: case 59: // % , / ? @ { } [ \ ] ( ) ;
        token = scanPunctuator(input.charAt(offset))
        break

      default: handleUnexpectedToken(input.charAt(offset))
    }
  } while (!enableTokenization) // eslint-disable-line no-unmodified-loop-condition

  afterScript = false
  if (onCreateToken) onCreateToken(token)
  return token
}

// General names:      ($?$? *)? [a-z_] [a-z_0-9]*
// Script names:       [a-z_] ( *[-] *) [a-z_0-9]*
// Converted literals: true, false and undefined

function scanIdentifierOrKeyword () {
  const startsWithDollar = input.charCodeAt(offset) === 36 // $
  let value, type

  if (afterScript) {
    let wordEnd = offset
    let charCode, space, dash
    for (;;) {
      charCode = input.charCodeAt(++offset)
      if (charCode === 32 || charCode === 9) {
        space = true
        continue
      }
      if (charCode === 45) {
        dash = true
        continue
      }
      if (space && !dash) {
        offset = wordEnd + 1
        break
      }
      if (!isIdentifierPart(charCode)) break
      space = dash = false
      wordEnd = offset
    }
    value = input.slice(tokenStart, offset).toLowerCase().replace(/ /g, '')
  } else if (startsWithDollar) {
    let charCode
    do {
      charCode = input.charCodeAt(++offset)
    } while (charCode === 32 || charCode === 9 || charCode === 36)
    const nameStart = offset
    while (isIdentifierPart(input.charCodeAt(offset))) ++offset
    value = input.slice(tokenStart, nameStart).replace(/ /g, '') +
      input.slice(nameStart, offset).toLowerCase()
  } else {
    while (isIdentifierPart(input.charCodeAt(++offset)));
    value = input.slice(tokenStart, offset).toLowerCase()
  }

  // Identifiers, keywords, booleans and undefined all look the same syntax wise.
  // We simply go through them one by one and defaulting to an identifier if no
  // previous case matched.
  if (isKeyword(value, oldVersion)) {
    type = Keyword
  } else if (value === 'true' || value === 'false') {
    type = BooleanLiteral
    value = value === 'true'
  } else if (value === 'undefined') {
    type = UndefinedLiteral
    value = null
  } else {
    type = Identifier
  }

  return finishToken({ type, value })
}

// #' .* '#

function scanHashQuote () {
  const stringStart = offset
  let charCode

  offset += 2 // #'
  for (;;) {
    charCode = input.charCodeAt(offset++)
    if (charCode === 39 && input.charCodeAt(offset) === 35) { // '#
      ++offset
      break
    }
    if (offset > length || isLineTerminator(charCode)) {
      throwError(null, errors.unfinishedHashQuote, input.slice(tokenStart, offset - 1))
    }
  }

  const value = input.slice(stringStart + 2, offset - 2).toLowerCase()

  return finishToken({ type: Identifier, value, hashQuote: true })
}

// # [0-9a-f]+

function scanObjRef () {
  const stringStart = ++offset // #
  while (isHexadecimalDigit((input.charCodeAt(offset)))) ++offset
  const value = parseInt(input.slice(stringStart, offset), 16)
  return finishToken({ type: ObjRef, value })
}

// & [0-9a-f]+

function scanLegacyAlias () {
  const stringStart = ++offset // &
  while (isHexadecimalDigit((input.charCodeAt(offset)))) ++offset
  const value = parseInt(input.slice(stringStart, offset), 16)
  return finishToken({ type: LegacyAlias, value })
}

// [:symbol:]

function scanPunctuator (value) {
  offset += value.length
  return finishToken({ type: Punctuator, value })
}

// Single-line: ' .* '
// Single-line: " .* "
// Multi-line:  ` .* `

function scanStringLiteral () {
  const delimiter = input.charCodeAt(offset++)
  const multiline = true // delimiter === 96 // `
  const beginLine = line
  const beginLineStart = lineStart
  let stringStart = offset
  let string = ''

  for (;;) {
    const charCode = input.charCodeAt(offset++)
    if (delimiter === charCode) {
      if (input.charCodeAt(offset) === delimiter) {
        string += input.slice(stringStart, offset)
        stringStart = ++offset
      } else {
        break
      }
    // } else if (charCode === 92) { // \
    //   string += input.slice(stringStart, offset)
    //   stringStart = ++offset
    }
    if (offset > length || (!multiline && isLineTerminator(charCode))) {
      if (multiline) throwError(token, errors.unfinishedLongString, beginLineStart, tokenValue(token))
      throwError(null, errors.unfinishedString, input.slice(tokenStart, offset - 1))
    }
  }
  string += input.slice(stringStart, offset - 1)

  return {
    type: StringLiteral,
    value: string,
    line: beginLine,
    lineStart: beginLineStart,
    lastLine: line,
    lastLineStart: lineStart,
    range: [tokenStart, offset],
    afterLineBreak
  }
}

// Integer: [0-9]+
// Real: [0-9](\.[0-9]+)?(e[-+]p0-9]+)?
// Date: [0-9]{4}-[0-9]{2}}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}

function scanNumericOrDateLiteral (allowDate) {
  let charCode, real
  while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
  // try date literal
  const beforeDate = offset
  if (charCode === 45 && allowDate) { // -
    ++offset
    while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
    if (charCode === 45) { // -
      ++offset
      while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
      if (charCode === 84) { // T
        ++offset
        while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
        if (charCode !== 58) { // :
          throwError(null, errors.malformedDate, input.slice(tokenStart, offset))
        }
        ++offset
        while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
        if (charCode !== 58) { // :
          throwError(null, errors.malformedDate, input.slice(tokenStart, offset))
        }
        ++offset
        while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset

        return finishToken({ type: DateLiteral, value: input.slice(tokenStart, offset) })
      }
    }
    offset = beforeDate
  }
  // Fraction part is optional
  if (charCode === 46) { // .
    real = true
    ++offset
    // Fraction part defaults to 0
    while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
  }
  // Exponent part is optional.
  if (charCode === 101 || charCode === 69) { // e or E
    real = true
    ++offset
    // Sign part is optional.
    if (input.charCodeAt(offset) === 45) ++offset // -
    // An exponent is required to contain at least one decimal digit.
    if (!isDecimalDigit(input.charCodeAt(offset))) {
      throwError(null, errors.malformedNumber, input.slice(tokenStart, offset))
    }
    while (isDecimalDigit(input.charCodeAt(offset))) ++offset
  }

  let type, parseNumber
  if (real) {
    type = RealLiteral
    parseNumber = parseFloat
  } else {
    type = IntegerLiteral
    parseNumber = parseInt
  }
  const value = parseNumber(input.slice(tokenStart, offset))

  return finishToken({ type, value })
}

// ---------- Comment scanning

let includeComments

// Single-line: // .*
// Multi-line:  /* .* */

function scanComment (multiline) {
  tokenStart = offset
  offset += 2 // /* or //

  const lineStartComment = lineStart
  const lineComment = line
  const [commentStart, commentEnd] = (multiline ? scanMultilineComment : scanSingleLineComment)()

  if (onCreateToken && includeComments) {
    onCreateToken({
      type: Comment,
      value: input.slice(commentStart, commentEnd),
      line: lineComment,
      lineStart: lineStartComment,
      lastLine: line,
      lastLineStart: lineStart,
      range: [tokenStart, offset],
      afterLineBreak
    })
  }
}

// // .*

function scanSingleLineComment () {
  const commentStart = offset

  while (offset < length) {
    if (isLineTerminator(input.charCodeAt(offset))) break
    ++offset
  }

  return [commentStart, offset]
}

// /* .* */

function scanMultilineComment () {
  const firstLine = line
  const commentStart = offset
  let charCode

  while (offset < length) {
    charCode = input.charCodeAt(offset++)
    switch (charCode) {
      case 42: // *
        if (input.charCodeAt(offset) === 47) { // /
          ++offset
          return [commentStart + 2, offset - 2]
        }
        break
      case 10: case 13:
        // Count \r\n as one newline.
        if (charCode === 13 && input.charCodeAt(offset) === 10) ++offset
        ++line
        lineStart = offset
        break
    }
  }

  throwError(null, errors.unfinishedLongComment, firstLine, '<eof>')
}

// ---------- Preprocessor directive scanning

let defines

// Defining variables:  # (define|undef) NAME [VALUE]
// Conditional content: # (ifdef|ifndef) .* [#else .*] .* #endif

function scanPreprocessorDirective () {
  tokenStart = offset
  ++offset // #

  const preprocessorDirectiveStart = offset

  out: while (offset < length) {
    const charCode = input.charCodeAt(offset)
    let peekCharCode
    switch (charCode) {
      case 47: // /
        peekCharCode = input.charCodeAt(offset)
        if (peekCharCode === 47 || peekCharCode === 42) break out // / or *
        break
      case 10: case 13:
        break out
    }
    ++offset
  }

  const content = input.slice(preprocessorDirectiveStart, offset)
  const [type, name, value] = splitPreprocessorDirective(content)

  if (onCreateToken && includePreprocessor) {
    onCreateToken(finishToken({
      type: PreprocessorDirective,
      value: content,
      directive: type,
      name,
      namedValue: value
    }))
  }
  return executePreprocessorDirective(type, name, value)
}

function splitPreprocessorDirective (content) {
  let [, type, name, value] = /^\s*(\w+)(?:\s+(\w+))?(?:\s+(.+))?\s*$/.exec(content) || []
  if (!type) {
    throwError(null, errors.unfinishedPreprocessorDirective, line, input.slice(tokenStart, offset - 1))
  }
  type = type.toLowerCase()
  if (type === 'define' || type === 'undef' || type === 'ifdef' || type === 'ifndef') {
    if (name) {
      name = name.toLowerCase()
      if (type === 'define' && value === undefined) value = '1'
    } else if (type === 'define' || type === 'undef') {
      throwError(null, errors.unfinishedPreprocessorDirective, line, input.slice(tokenStart, offset - 1))
    }
  } else if (!(type === 'else' || type === 'endif')) {
    throwError(null, errors.unfinishedPreprocessorDirective, line, input.slice(tokenStart, offset - 1))
  }
  return [type, name, value]
}

function executePreprocessorDirective (directive, name, value) {
  const previousIncludeContent = enableTokenization
  if (directive === 'define') {
    defines.set(name, value.replace(/^'|"/, '').replace(/'|"$/, ''))
  } else if (directive === 'undef') {
    delete defines.get(name)
  } else if (directive === 'ifdef') {
    enterIncludeScope(defines.has(name))
  } else if (directive === 'ifndef') {
    enterIncludeScope(!defines.has(name))
  } else if (directive === 'else') {
    flipIncludeScope()
  } else { // endif
    leaveIncludeScope()
  }
  return previousIncludeContent !== enableTokenization ? enableTokenization : undefined
}

// ---------- Preprocessor directive scoping

let includeScope, inclusionScopes
let tokenBackup, previousTokenBackup, tokenAheadBackup

// After ifdef or ifndef

function enterIncludeScope (_include) {
  inclusionScopes.push(includeScope)
  includeScope = _include
  updateIncludeScope()
}

// After endif

function leaveIncludeScope () {
  checkIncludeScope()
  includeScope = inclusionScopes.pop()
  updateIncludeScope()
}

// After else

function flipIncludeScope () {
  checkIncludeScope()
  includeScope = !includeScope
  updateIncludeScope()
}

function checkIncludeScope () {
  if (inclusionScopes.length === 0) {
    throwError(null, errors.unfinishedPreprocessorDirective, line, input.slice(tokenStart, offset - 1))
  }
}

function updateIncludeScope () {
  const previousIncludeContent = enableTokenization
  enableTokenization = includeScope && inclusionScopes.every(scope => scope)
  if (previousIncludeContent !== enableTokenization) {
    if (enableTokenization) {
      previousToken = previousTokenBackup
      token = tokenBackup
      tokenAhead = tokenAheadBackup
    } else {
      previousTokenBackup = previousToken
      tokenBackup = token
      tokenAheadBackup = tokenAhead
    }
  }
}

// ---------- Lexing helpers

function finishToken (token) {
  token.line = line
  token.lineStart = lineStart
  token.range = [tokenStart, offset]
  token.afterLineBreak = afterLineBreak
  return token
}

// ============================================================
// Parser

let token, previousToken, tokenAhead

// Read the next token.

let nextToken

function nextTokenFromInput () {
  previousToken = token
  token = tokenAhead
  tokenAhead = getTokenFromInput()
}

function getTokenFromTokens () {
  if (offset >= length) return { type: EOF, value: '<eof>' }
  return tokens[offset++]
}

function nextTokenFromTokens () {
  previousToken = token
  token = tokenAhead
  tokenAhead = getTokenFromTokens()
}

// Consume a token if its value matches the expected one and advance to
// the next one. Once consumed or not, return the success of the operation.

function consumePunctuator (value) {
  if (token.type === Punctuator && value === token.value) {
    nextToken()
    return true
  }
  return false
}

function consumeKeyword (value) {
  if (token.type & KeywordOrIdentifier && value === token.value) {
    nextToken()
    return true
  }
  return false
}

// Expect the next token value to match the specified one and advance to
// the next one if it does. If not, throw an exception.

function expectPunctuator (value) {
  if (token.type === Punctuator && value === token.value) nextToken()
  else throwError(token, errors.expected, value, tokenValue(token))
}

function expectKeyword (value) {
  if (token.type & KeywordOrIdentifier && value === token.value) nextToken()
  else throwError(token, errors.expected, value, tokenValue(token))
}

function requirePrecedingLineBreak () {
  if (!token.afterLineBreak) {
    throwError(token, errors.expected, 'line break', tokenValue(token))
  }
}

function advanceToNextStatement () {
  if (token.afterLineBreak) return
  expectPunctuator(';')
}

function canAdvanceToNextStatement () {
  if (token.afterLineBreak) return true
  return consumePunctuator(';')
}

// ---------- Location tracking

let locationsOrRanges, includeLocations, includeRanges, onCreateNode

function getStartPosition (startToken = token) {
  if (!locationsOrRanges) return
  const position = {}
  if (includeLocations) {
    position.start = {
      line: startToken.line,
      column: startToken.range[0] - startToken.lineStart
    }
  }
  if (includeRanges) position.offset = startToken.range[0]
  return position
}

// Wrap up the node object.

function finishNode (node, position) {
  if (locationsOrRanges) {
    if (includeLocations) {
      node.loc = {
        start: position.start,
        end: { line, column: offset - lineStart }
      }
    }
    if (includeRanges) node.range = [position.offset, offset]
  }
  if (onCreateNode) onCreateNode(node)
  return node
}

let includeRaw, sourceType, oldVersion

// <Program> ::=
//   <PackageDeclaration> | <ScriptSource> | <DumpSource>

function parseProgram () {
  nextToken() // <bof>
  const position = getStartPosition()
  let body
  switch (sourceType) {
    case 'object': body = parsePackageDeclaration(); break
    case 'script': body = parseScriptSource(); break
    case 'dump': body = parseDumpSource(); break
  }
  if (EOF !== token.type) handleUnexpectedToken(token)
  return finishNode(ast.program(body), position)
}

// <PackageDeclaration> :=
//   "package" <ObjectName>
//   <ObjectDeclaration>

function parsePackageDeclaration () {
  const position = getStartPosition()
  expectKeyword('package')
  const name = parseObjectName()
  const object = parseObjectDeclaration()
  return finishNode(ast.packageDeclaration(name, object), position)
}

// <ScriptSource> ::=
//   <Statement>*
//   <FunctionDeclaration>*

function parseScriptSource () {
  const body = []
  let encounteredFunction
  const position = getStartPosition()
  while (token.type !== EOF) {
    let node
    if (consumeKeyword('function')) {
      const position = getStartPosition(previousToken)
      parseFunctionDeclaration(position)
      encounteredFunction = true
    } else {
      if (encounteredFunction) handleUnexpectedToken(token, 'function')
      node = parseStatement()
    }
    body.push(node)
  }
  return finishNode(ast.scriptSource(body), position)
}

// <DumpSource> ::=
//   "name" <Identifier>
//   "parent" <ObjRef>
//   "addFeature" <Identifier> *
//   "set" <Identifier> "=" <Literal> *
//   <ScriptDeclaration>*

function parseDumpSource () {
  const position = getStartPosition()
  expectKeyword('name')
  convertSpecialLiteralsToIdentifier()
  const id = parseIdentifier()
  expectKeyword('parent')
  const parent = parseObjRef()
  const features = []
  while (consumeKeyword('addFeature')) {
    const position = getStartPosition(previousToken)
    const id = parseIdentifier()
    features.push(finishNode(ast.featureAddition(id), position))
  }
  const assignments = []
  while (consumeKeyword('set')) {
    const position = getStartPosition(previousToken)
    const id = parseIdentifier()
    expectPunctuator('=')
    const value = parseLiteral(true)
    assignments.push(finishNode(ast.featureInitialization(id, value), position))
  }
  const scripts = []
  while (consumeKeyword('script')) {
    const position = getStartPosition(previousToken)
    scripts.push(parseScriptDeclaration(position))
  }
  return finishNode(ast.dumpSource(id, parent, features, assignments, scripts), position)
}

// <ObjectDeclaration> ::=
//   <Modifier>
//   "object" <Identifier> | <HashQuote> ["inherits" <ObjectName>]
//   [<Modifier>] <FunctionDeclaration> | <ScriptDeclaration> | <FeatureDeclaration> *
//   "end"

function parseObjectDeclaration () {
  const position = getStartPosition()
  if (!(token.type & KeywordOrIdentifier)) handleUnexpectedToken(token, '<modifier>')
  const modifier = tryModifier()
  if (!modifier) handleUnexpectedToken(token, '<modifier>')
  expectKeyword('object')
  convertSpecialLiteralsToIdentifier()
  const id = parseIdentifierOrHashQuote()
  const superObject = consumeKeyword('inherits') ? parseObjectName() : []
  requirePrecedingLineBreak()
  const body = []
  while (!consumeKeyword('end')) {
    if (!(token.type & KeywordOrIdentifier)) handleUnexpectedToken(token, '<modifier>, <type>, function, script or end')
    const position = getStartPosition()
    const modifier = tryModifier()
    if (!(token.type & KeywordOrIdentifier)) {
      let expected = '<type>, function or script'
      if (!modifier) expected = `<modifier>, ${expected}`
      handleUnexpectedToken(token, expected)
    }
    let node
    switch (token.value) {
      case 'function':
        nextToken()
        node = parseFunctionDeclaration(position, modifier)
        break
      case 'script':
        nextToken()
        node = parseScriptDeclaration(position, modifier)
        break
      default: node = parseFeatureDeclaration(position, modifier)
    }
    body.push(node)
    while (consumePunctuator(';')) body.push(parseEmptyStatement())
  }
  return finishNode(ast.objectDeclaration(id, modifier, superObject, body), position)
}

// <ObjectDeclaration> ::=
//   <Type> <Identifier> | <HashQuote> ["=" <Expression>]

function parseFeatureDeclaration (position, modifier) {
  const type = checkType()
  const id = parseIdentifierOrHashQuote()
  let init
  if (consumePunctuator('=')) init = parseExpression()
  return finishNode(ast.featureDeclaration(id, type, modifier, init), position)
}

// <FunctionDeclaration> ::=
//   "function" ["nodebug"] [<Type>] <Identifier> | <HashQuote>
//   "(" [<Parameter> ["," <Parameter>]*] [[","] "..."] ")"
//   <Statement>*
//   "end"

function parseFunctionDeclaration (position, modifier) {
  let nodebug
  if (token.type === Keyword && token.value === 'nodebug') {
    nextToken()
    nodebug = true
  }
  const type = tryType()
  const id = parseIdentifierOrHashQuote()
  const parameters = []
  let variadic
  if (!token.afterLineBreak) {
    expectPunctuator('(')
    while (!consumePunctuator(')')) {
      if (parameters.length) expectPunctuator(',')
      if (consumePunctuator('...')) {
        variadic = true
        expectPunctuator(')')
        break
      }
      parameters.push(parseParameter())
    }
    requirePrecedingLineBreak()
  }
  const body = []
  while (!consumeKeyword('end')) {
    body.push(parseStatement())
  }
  return finishNode(ast.functionDeclaration(id, type, modifier, parameters, variadic, nodebug, body), position)
}

// <Parameter> ::=
//   [<Type>] <Identifier> ["=" <Expression>]

function parseParameter () {
  const position = getStartPosition()
  let type = tryType()
  let id
  if (type && token.type === Punctuator) {
    id = type
    type = undefined
  } else {
    id = parseIdentifier()
  }
  let init
  if (consumePunctuator('=')) init = parseExpression()
  return finishNode(ast.parameter(id, type, init), position)
}

// <ScriptDeclaration> ::=
//   "script" <Identifier> | <HashQuote>
//   <Statement> | <FunctionDeclaration> *
//   "endscript" | "scriptend"

function parseScriptDeclaration (position, modifier) {
  const id = parseIdentifierOrHashQuote()
  requirePrecedingLineBreak()
  const body = []
  out: for (;;) {
    if (Keyword === token.type) {
      let position
      switch (token.value) {
        case 'function':
          position = getStartPosition()
          nextToken()
          body.push(parseFunctionDeclaration(position))
          continue
        case 'endscript': case 'scriptend':
          requirePrecedingLineBreak()
          nextToken()
          break out
      }
    }
    body.push(parseStatement())
  }
  return finishNode(ast.scriptDeclaration(id, modifier, body), position)
}

// <Statement> ::=
//   <Label> |
//   <IfStatement> | <SwitchStatement> |
//   <WhileStatement> | <RepeatStatement> | <ForStatements> |
//   <GotoStatement> | <ReturnStatement> |
//   <BreakStatement> | <ContinueStatement> |
//   <BreakIfStatement> | <ContinueIfStatement> |
//   <VariableDeclaration> |
//   <Expression> |
//   <EmptyStatement>

function parseStatement () {
  if (token.type & KeywordOrIdentifier &&
      tokenAhead.type === Punctuator && tokenAhead.value === ':') {
    return parseLabel()
  }

  if (Keyword === token.type) {
    switch (token.value) {
      case 'if': return parseIfStatement()
      case 'switch': return parseSwitchStatement()
      case 'while': return parseWhileStatement()
      case 'repeat': return parseRepeatStatement()
      case 'for': return parseForStatements()
      case 'goto': return parseGotoStatement()
      case 'return': return parseReturnStatement()
      case 'break': return parseBreakStatement()
      case 'continue': return parseContinueStatement()
      case 'breakif': return parseBreakIfStatement()
      case 'continueif': return parseContinueIfStatement()
    }
  }

  const type = tryTypeOfVariable()
  if (type) return parseVariableDeclaration(type)

  if (consumePunctuator(';')) return parseEmptyStatement()

  return parseExpression()
}

// <EmptyStatement> ::=
//   ";"

function parseEmptyStatement () {
  const position = getStartPosition(previousToken)
  return finishNode(ast.emptyStatement(), position)
}

// <VariableDeclaration> ::=
//   <Type> [<Identifier> ["=" <Expression>] [","]?]+

function parseVariableDeclaration (type) {
  const position = getStartPosition(previousToken)
  const variables = []
  do {
    const position = getStartPosition(previousToken)
    const id = parseIdentifier()
    let init
    if (consumePunctuator('=')) init = parseExpression()
    variables.push(finishNode(ast.variableDeclarator(id, init), position))
  } while (consumePunctuator(','))
  return finishNode(ast.variableDeclaration(type, variables), position)
}

// <IfStatement> ::=
//   "if" <Expression> <Statement>*
//   ["elseif" <Expression> <Statement>*]*
//   ["else" <Statement>*]
//   "end"

function parseIfStatement () {
  const position = getStartPosition()
  nextToken() // if
  const test = parseExpression()
  advanceToNextStatement()
  let consequent, alternate
  let otherPosition, otherTest
  const otherClauses = []
  let statements = []
  for (;;) {
    if (Keyword === token.type) {
      switch (token.value) {
        case 'elseif':
          if (alternate) throwError(token, errors.expected, 'end', tokenValue(token))
          savePreviousClause()
          statements = []
          otherPosition = getStartPosition()
          nextToken()
          otherTest = parseExpression()
          advanceToNextStatement()
          continue
        case 'else':
          savePreviousClause()
          statements = []
          nextToken()
          advanceToNextStatement()
          continue
        case 'end':
          savePreviousClause()
          nextToken()
          return finishNode(ast.ifStatement(test, consequent, otherClauses, alternate), position)
      }
    }
    statements.push(parseStatement())
  }

  function savePreviousClause () {
    if (!consequent) {
      consequent = statements
    } else if (otherTest) {
      otherClauses.push(finishNode(ast.elseifClause(otherTest, statements), otherPosition))
      otherTest = undefined
    } else {
      alternate = statements
    }
  }
}

// <SwitchStatement> ::=
//   "switch" <Expression>
//   ["case" [<Expression> ","]+ <Statement>* "end"]*
//   ["default" <Statement>* "end"]
//   "end"

function parseSwitchStatement () {
  const position = getStartPosition()
  nextToken() // switch
  const discriminant = parseExpression()
  advanceToNextStatement()
  let caseOrDefault, defaultCase
  let casePosition, tests, statements
  const cases = []
  for (;;) {
    if (Keyword === token.type) {
      switch (token.value) {
        case 'case':
          if (defaultCase) throwError(token, errors.expected, 'end', tokenValue(token))
          startCase()
          do {
            tests.push(parseExpression())
          } while (consumePunctuator(','))
          break
        case 'default':
          startCase()
          defaultCase = true
          break
        case 'end':
          if (caseOrDefault) {
            endCase()
            continue
          }
          nextToken()
          return finishNode(ast.switchStatement(discriminant, cases), position)
      }
      if (Keyword === token.type && token.value === 'end') {
        endCase()
        continue
      }
    }
    statements.push(parseStatement())
  }

  function startCase () {
    savePreviousCase()
    casePosition = getStartPosition()
    nextToken()
    tests = []
    statements = []
    caseOrDefault = true
  }

  function endCase () {
    savePreviousCase()
    caseOrDefault = false
    nextToken()
  }

  function savePreviousCase () {
    cases.push(finishNode(ast.switchCase(tests, statements), casePosition))
  }
}

// <WhileStatement> ::=
//   "while" <Expression>
//   <LoopBody>

function parseWhileStatement () {
  const position = getStartPosition()
  nextToken() // while
  const test = parseExpression()
  advanceToNextStatement()
  const body = parseLoopBody()
  return finishNode(ast.whileStatement(test, body), position)
}

// <WhileStatement> ::=
//   "repeat"
//   <Statement>*
//   "until" <Expression>

function parseRepeatStatement () {
  const position = getStartPosition()
  nextToken() // repeat
  advanceToNextStatement()
  const statements = []
  for (;;) {
    if (consumeKeyword('until')) {
      const test = parseExpression()
      return finishNode(ast.repeatStatement(test, statements), position)
    }
    statements.push(parseStatement())
  }
}

// <ForStatements> ::=
//   <ForStatement> | <ForEachStatement> | <StructuredForStatement>

function parseForStatements () {
  const position = getStartPosition()
  nextToken() // for
  if (consumePunctuator('(')) {
    return parseForStatement(position)
  }
  const id = parseIdentifier()
  if (consumeKeyword('in')) {
    return parseForEachStatement(position, id)
  }
  expectPunctuator('=')
  return parseStructuredForStatement(position, id)
}

// <ForStatement> ::=
//   "for" "(" [<Expression>] ";" [<Expression>] ";" [<Expression>] ")"
//   <LoopBody>

function parseForStatement (position) {
  let init, test, update
  if (!canAdvanceToNextStatement()) {
    init = parseExpression()
    advanceToNextStatement()
  }
  if (!canAdvanceToNextStatement()) {
    test = parseExpression()
    advanceToNextStatement()
  }
  if (!consumePunctuator(')')) {
    update = parseExpression()
    expectPunctuator(')')
  }
  // advanceToNextStatement()
  const body = parseLoopBody()
  return finishNode(ast.forStatement(init, test, update, body), position)
}

// <ForStatement> ::=
//   "for" <Identifier> "in" <Expression>
//   <LoopBody>

function parseForEachStatement (position, left) {
  const right = parseExpression()
  advanceToNextStatement()
  const body = parseLoopBody()
  return finishNode(ast.forEachStatement(left, right, body), position)
}

// <ForStatement> ::=
//   "for" <Identifier> "=" <Expression> "to" | "downto" <Expression>
//     ["by" <Expression>]
//   <LoopBody>

function parseStructuredForStatement (position, variable) {
  const start = parseExpression()
  let down
  if (consumeKeyword('downto')) {
    down = true
  } else if (!consumeKeyword('to')) {
    throwError(token, errors.expected, 'to or downto', tokenValue(token))
  }
  const end = parseExpression()
  let step
  if (consumeKeyword('by')) {
    step = parseExpression()
  }
  advanceToNextStatement()
  const body = parseLoopBody()
  return finishNode(ast.structuredForStatement(variable, start, end, down, step, body), position)
}

// <LoopBody> ::=
//   <Statement>*
//   "end"

function parseLoopBody () {
  const body = []
  while (!consumeKeyword('end')) {
    body.push(parseStatement())
  }
  return body
}

// <GotoStatement> ::=
//   "goto" <Identifier>

function parseGotoStatement () {
  const position = getStartPosition()
  nextToken() // goto
  const label = parseIdentifier()
  return finishNode(ast.gotoStatement(label), position)
}

// <Label> ::=
//   <Identifier> ":"

function parseLabel () {
  const position = getStartPosition()
  const id = parseIdentifier()
  nextToken() // :
  return finishNode(ast.labelStatement(id), position)
}

// <ReturnStatement> ::=
//   "return" [<Expression>]

function parseReturnStatement () {
  const position = getStartPosition()
  nextToken() // return
  const argument = token.afterLineBreak || (token.type === Punctuator && token.value === ';')
    ? undefined
    : parseExpression()
  return finishNode(ast.returnStatement(argument), position)
}

// <BreakStatement> ::=
//   "break"

function parseBreakStatement () {
  const position = getStartPosition()
  nextToken() // break
  return finishNode(ast.breakStatement(), position)
}

// <ContinueStatement> ::=
//   "continue"

function parseContinueStatement () {
  const position = getStartPosition()
  nextToken() // continue
  return finishNode(ast.continueStatement(), position)
}

// <BreakIfStatement> ::=
//   "breakif" <Expression>

function parseBreakIfStatement () {
  const position = getStartPosition()
  nextToken() // breakif
  const test = parseExpression()
  return finishNode(ast.breakIfStatement(test), position)
}

// <ContinueIfStatement> ::=
//   "continueif" <Expression>

function parseContinueIfStatement () {
  const position = getStartPosition()
  nextToken() // continueif
  const test = parseExpression()
  return finishNode(ast.continueIfStatement(test), position)
}

// <PrimaryExpression> ::=
//   <ParenthesisExpression> | <Xlate> |
//   <ListExpressionOrComprehension> | <AssocExpression> |
//   <SpecialIdentifier> | <ObjectName> | <Literal>

function parsePrimaryExpression () {
  const tokenType = token.type
  if (tokenType === Punctuator) {
    switch (token.value) {
      case '[': return parseXlate()
      case '{': return parseListExpressionOrComprehension()
      case '(': return parseParenthesisExpression()
    }
  } else if (tokenType & KeywordOrIdentifier) {
    switch (token.value) {
      case 'this': return parseSpecialIdentifier('thisExpression')
      case 'super': return parseSpecialIdentifier('superExpression')
      case 'assoc':
        if (tokenAhead.type === Punctuator && tokenAhead.value === '{') {
          nextToken()
          return parseAssocExpression()
        }
    }
    return parseObjectName()
  }
  return parseLiteral()
}

// <SpecialIdentifier> ::=
//   "this" | "super"

function parseSpecialIdentifier (type) {
  const position = getStartPosition()
  nextToken() // this or super
  return finishNode(ast[type](), position)
}

// <ListExpressionOrComprehension> ::=
//   "{" [<ListElement>] ["," <ListElement>]* |
//       ["for" <Identifier> "in" <Expression> ["if" <Expression>]] "}"

function parseListExpressionOrComprehension () {
  const position = getStartPosition()
  nextToken() // {
  if (consumePunctuator('}')) {
    return finishNode(ast.listExpression([]), position)
  }
  const firstElement = parseListElement()
  if (consumePunctuator('}')) {
    return finishNode(ast.listExpression([firstElement]), position)
  }
  if (consumePunctuator(',')) {
    for (const elements = [firstElement]; ;) {
      elements.push(parseListElement())
      if (token.type === Punctuator) {
        switch (token.value) {
          case ',': nextToken(); continue
          case '}':
            nextToken()
            return finishNode(ast.listExpression(elements), position)
        }
      }
    }
  }
  expectKeyword('for')
  const left = parseIdentifier()
  expectKeyword('in')
  const right = parseExpression()
  let test
  if (consumeKeyword('if')) {
    test = parseExpression()
  }
  expectPunctuator('}')
  return finishNode(ast.listComprehension(firstElement, left, right, test), position)
}

// <ListElement> ::=
// ["@"] <Expression>

function parseListElement () {
  if (consumePunctuator('@')) {
    const position = getStartPosition(previousToken)
    return finishNode(ast.atExpression(parseExpression()), position)
  }
  return parseExpression()
}

// <AssocExpression> ::=
//   "assoc{" [<Expression> ":" <Expression> [","]]* "}"

function parseAssocExpression () {
  const position = getStartPosition()
  nextToken() // {
  const properties = []
  while (!consumePunctuator('}')) {
    if (properties.length) expectPunctuator(',')
    const position = getStartPosition()
    const key = parseExpression()
    expectPunctuator(':')
    const value = parseExpression()
    properties.push(finishNode(ast.property(key, value), position))
  }
  return finishNode(ast.assocExpression(properties), position)
}

// <ParenthesisExpression> ::=
//   "(" <Expression> ")"

function parseParenthesisExpression () {
  const position = getStartPosition()
  nextToken() // (
  const expression = parseExpression()
  expectPunctuator(')')
  return finishNode(ast.parenthesisExpression(expression), position)
}

// <MemberSliceCallExpression> ::=
//   [<PrimaryExpression>]
//   [[<MemberExpression>] [<SliceExpression>] [<CallExpression>]]*

function parseMemberSliceCallExpression () {
  let position = getStartPosition()
  let left = consumePunctuator('.')
    ? parseMemberExpression(ast.thisExpression(), position)
    : parsePrimaryExpression()
  for (;; position = getStartPosition()) {
    if (consumePunctuator('.')) {
      left = parseMemberExpression(left, position)
    } else if (consumePunctuator('[')) {
      left = parseSliceExpression(left, position)
    } else if (consumePunctuator('(')) {
      left = parseCallExpression(left, position)
    } else {
      return left
    }
  }
}

// <MemberExpression> ::=
//   "." ["(" <Expression> ")"] | <Identifier> | <StringLiteral>

function parseMemberExpression (object, position) {
  if (consumePunctuator('(')) {
    const property = parseExpression()
    expectPunctuator(')')
    return finishNode(ast.memberExpression(object, property, true), position)
  }
  let property
  switch (token.type) {
    case Keyword: case Identifier:
      property = parseIdentifier()
      break
    default: // StringLiteral
      property = parseLiteral()
  }
  return finishNode(ast.memberExpression(object, property), position)
}

// <SliceExpression> ::=
//   "[" <Expression> | (<Expression> ":" [<Expression>]) | (":" <Expression>) "]"

function parseSliceExpression (object, position) {
  let start, end
  if (consumePunctuator(':')) {
    end = parseExpression()
    expectPunctuator(']')
  } else {
    start = parseExpression()
    if (consumePunctuator(':')) {
      if (!consumePunctuator(']')) {
        end = parseExpression()
        expectPunctuator(']')
      }
    } else {
      expectPunctuator(']')
    }
  }
  return end
    ? finishNode(ast.sliceExpression(object, start, end), position)
    : finishNode(ast.indexExpression(object, start), position)
}

// <CallExpression> ::=
//   "(" <Expression> ["," <Expression>]* ")"

function parseCallExpression (callee, position) {
  const args = []
  while (!consumePunctuator(')')) {
    if (args.length) expectPunctuator(',')
    args.push(parseExpression())
  }
  return finishNode(ast.callExpression(callee, args), position)
}

// <UnaryExpression> ::=
//   [<UnaryOperator>]+ <MemberSliceCallExpression>

function parseUnaryExpression () {
  if ((token.type === Punctuator || token.type === Keyword) &&
      isUnaryOperator(token.value)) {
    const position = getStartPosition()
    const operator = token.value
    nextToken()
    const argument = parseUnaryExpression()
    return finishNode(ast.unaryExpression(operator, argument), position)
  }
  return parseMemberSliceCallExpression()
}

// <BinaryExpression> ::=
//   <UnaryExpression> [<BinaryOperator> <UnaryExpression>]+

function parseBinaryExpression () {
  let position = getStartPosition()
  let left = parseUnaryExpression()
  for (let previousPosition; ; position = previousPosition) {
    if (!((token.type === Punctuator || token.type === Keyword) &&
        isBinaryOperator(token.value))) return left
    const operator = token.value
    nextToken()
    previousPosition = getStartPosition()
    const right = parseUnaryExpression()
    left = finishNode(ast.binaryExpression(operator, left, right), position)
  }
}

// <Expression> ::=
//   <BinaryExpression> ["?" <Expression> ":" <Expression>]

function parseExpression () {
  const position = getStartPosition()
  const test = parseBinaryExpression()
  if (consumePunctuator('?')) {
    const consequent = parseExpression()
    expectPunctuator(':')
    const alternate = parseExpression()
    return finishNode(ast.conditionalExpression(test, consequent, alternate), position)
  }
  return test
}

// <Xlate> ::=
//   "[" <Identifier> ":" <Identifier> "]"

function parseXlate () {
  const position = getStartPosition()
  nextToken() // [
  const ospace = parseIdentifier()
  expectPunctuator('.')
  convertSpecialLiteralsToIdentifier()
  const string = parseIdentifier()
  expectPunctuator(']')
  return finishNode(ast.xlateExpression(ospace, string), position)
}

// <ObjectName> ::=
//   <Identifier> ["::" <IdentifierOrHashQuoteOrLegacyAlias>]*

function parseObjectName () {
  const position = getStartPosition()
  convertSpecialLiteralsToIdentifier()
  const name = [parseIdentifier()]
  while (consumePunctuator('::')) {
    convertSpecialLiteralsToIdentifier()
    name.push(parseIdentifierOrHashQuoteOrLegacyAlias())
  }
  return finishNode(ast.objectName(name), position)
}

// <Identifier> ::=
//   {($?$? *)? [a-z_] [a-z_0-9]*} |
//   {[a-z_] ( *[-] *) [a-z_0-9]*} |

function parseIdentifier () {
  if (!(token.type & KeywordOrIdentifier)) handleUnexpectedToken(token, '<identifier>')
  if (token.hashQuote) handleUnexpectedToken(token)
  return finishIdentifier()
}

// <IdentifierOrHashQuote> ::=
//   {($?$? *)? [a-z_] [a-z_0-9]*} |
//   {[a-z_] ( *[-] *) [a-z_0-9]*} |
//   {#' .* '#}

function parseIdentifierOrHashQuote () {
  if (!(token.type & KeywordOrIdentifier)) handleUnexpectedToken(token, '<identifier>')
  return finishIdentifier()
}

// <Identifier> ::=
//   {($?$? *)? [a-z_] [a-z_0-9]*} |
//   {[a-z_] ( *[-] *) [a-z_0-9]*} |
//   {#' .* '#} |
//   {& [0-9a-f]+}

function parseIdentifierOrHashQuoteOrLegacyAlias () {
  const tokenType = token.type
  if (!(tokenType & KeywordOrIdentifier || tokenType === LegacyAlias)) handleUnexpectedToken(token, '<identifier>')
  return finishIdentifier()
}

function finishIdentifier () {
  const position = getStartPosition()
  nextToken() // identifier or hashquote or legacyalias
  const raw = includeRaw && (previousToken.hashQuote || previousToken.type === LegacyAlias)
    ? input.slice(previousToken.range[0], previousToken.range[1])
    : undefined
  return finishNode(ast.identifier(previousToken.value, raw), position)
}

function convertSpecialLiteralsToIdentifier () {
  switch (token.type) {
    case UndefinedLiteral:
      token.type = Identifier
      token.value = 'Undefined'
      break
    case BooleanLiteral:
      token.type = Identifier
      token.value = token.value ? 'True' : 'False'
  }
}

// <Literal> ::=
//   <ListExpressionOrComprehension> | <AssocExpression> | <Xlate> |
//   ["-"] {[0-9]+} |
//   ["-"] {[0-9](\.[0-9]+)?(e[-+]p0-9]+)?} |
//   {[0-9]{4}-[0-9]{2}}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}} |
//   "#" {[0-9a-f]+} |
//   "true" | "false" | "undefined"

function parseLiteral (allowXlate) {
  let tokenType = token.type
  let tokenValue = token.value
  let negative
  if (tokenType === Punctuator) {
    if (tokenValue === '{') return parseListExpressionOrComprehension()
    if (allowXlate && tokenValue === '[') return parseXlate()
    if (tokenValue === '-') {
      nextToken()
      tokenType = token.type
      tokenValue = token.value
      negative = true
    }
  } else if (tokenType & KeywordOrIdentifier && tokenValue === 'assoc' &&
      tokenAhead.type === Punctuator && tokenAhead.value === '{') {
    nextToken()
    return parseAssocExpression()
  }
  if (!(tokenType & Literal)) handleUnexpectedToken(token, '<literal>')
  const position = getStartPosition()
  nextToken()
  let raw = includeRaw ? input.slice(previousToken.range[0], previousToken.range[1]) : undefined
  if (negative) {
    tokenValue = -tokenValue
    if (includeRaw) raw = `-${raw}`
    if (position) --position.start.column
  }
  return finishNode(ast.literal(tokenType, tokenValue, raw), position)
}

// <ObjRef> ::=
//   "#" {[0-9a-f]+}

function parseObjRef () {
  if (token.type !== ObjRef) handleUnexpectedToken(token, '<objref>')
  return parseLiteral()
}

// <Modifier> ::=
//   "override" | "public" | "private"

function tryModifier () {
  const value = token.value
  switch (value) {
    case 'override': case 'public': case 'private':
      nextToken()
      return value
  }
}

// <Type> ::=
//   "boolean" | ...

function tryType () {
  const value = token.value
  if (value !== null && isType(value)) {
    nextToken()
    return value
  }
}

// <TypeOfVariable> ::=
//   ("boolean" | ...) <Identifier>

function tryTypeOfVariable () {
  const value = token.value
  if (value !== null && isType(value) && (tokenAhead.type & KeywordOrIdentifier)) {
    nextToken()
    return value
  }
}

// <Type> ::=
//   "boolean" | ...

function checkType () {
  const type = tryType()
  if (!type) handleUnexpectedToken(token, '<type>')
  return type
}

// ============================================================
// Public API

// Export the main parser.
//
//   - `defines` Named preprocessor values. Empty by default.
//   - `tokens` Include lexer tokens in the output object. Defaults to false.
//   - `preprocessor` Include tokens of preprocessor directives and the content skipped by the preprocessor. Defaults to false.
//   - `comments` Include comments. Defaults to false.
//   - `whitespace` Include whitespace. Defaults to false.
//   - `locations` Store location information. Defaults to false.
//   - `ranges` Store the start and end character locations. Defaults to false.
//   - `raw` Store the raw original of literals. Defaults to false.
//   - `sourceType` Set the source type to `object`, `script` or `dump` (the old object format).
//   - `oldVersion` Expect the old version of the OScript language. Defaults to false.
//   - `sourceFile` File name to refer in source locations to. Defaults to "snippet".
//   - `onCreateNode` Callback which will be invoked when a parser node is created.
//   - `onCreateToken` Callback which will be invoked when a lexer token is created.
//
// Example:
//
//     import { parseText } from 'oscript-parser'
//     const program = parseText('i = 0')

let includeTokens

function parseText (_input, _options) {
  initialize(_input, _options)

  if (includeTokens) {
    tokens = []
    onCreateToken = token => tokens.push(token)
  }

  nextToken = nextTokenFromInput
  tokenAhead = getTokenFromInput()

  const program = parseProgram()
  program.tokens = tokens && tokens.slice(0, tokens.length - 1)
  return program
}

function parseTokens (_input, _tokens, _options) {
  tokens = _tokens
  initialize(_input, _options)

  length = tokens.length
  nextToken = nextTokenFromTokens
  tokenAhead = getTokenFromTokens()

  return parseProgram()
}

function tokenize (_input, _options) {
  initialize(_input, _options)

  const tokens = []
  onCreateToken = token => tokens.push(token)

  while (getTokenFromInput().type !== EOF);
  return tokens.slice(0, tokens.length - 1)
}

function startTokenization (_input, _options) {
  initialize(_input, _options)

  return iterate()
}

function initialize (_input, _options) {
  // Transfer the input options to global variables
  const options = Object.assign({}, defaultOptions, _options);
  ({
    tokens: includeTokens,
    preprocessor: includePreprocessor,
    comments: includeComments,
    whitespace: includeWhitespace,
    locations: includeLocations,
    ranges: includeRanges,
    raw: includeRaw,
    sourceType,
    oldVersion,
    sourceFile,
    onCreateNode,
    onCreateToken
  } = options)

  if (sourceType !== 'object' && sourceType !== 'script' && sourceType !== 'dump') {
    throw new Error(`Source type "${sourceType}" not supported.`)
  }
  if (oldVersion === undefined) {
    oldVersion = sourceType === 'dump'
  } else if (oldVersion && sourceType === 'object') {
    throw new Error('Source type "object" requires the new OScript version.')
  } else if (!oldVersion && sourceType === 'dump') {
    throw new Error('Source type "dump" requires the old OScript version.')
  }

  if (includePreprocessor || includeComments || includeWhitespace) includeTokens = true
  locationsOrRanges = includeLocations || includeRanges

  const _defines = options.defines
  defines = new Map(_defines && Object.keys(_defines).map(key => [key, _defines[key]]))

  input = _input

  // Rewind the lexer
  offset = 0
  line = 1
  lineStart = 0
  length = input.length
  enableTokenization = includeScope = true
  afterLineBreak = afterScript = false
  inclusionScopes = []
}

function * iterate () {
  const tokens = []
  onCreateToken = token => tokens.push(token)

  for (;;) {
    const token = getTokenFromInput()
    if (tokens.length) {
      for (const token of tokens) yield token
      tokens.length = 0
    }
    if (token.type === EOF) break
    yield token
  }
}

export {
  defaultOptions, tokenTypes, startTokenization, tokenize, parseText, parseTokens
}
