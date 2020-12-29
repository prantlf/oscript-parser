import * as tokenTypes from './tokens'
import {
  isLineTerminator, isWhitespace, isDecimalDigit, isHexadecimalDigit,
  isIdentifierStart, isIdentifierPart, isKeyword, isType, isUnaryOperator,
  isBinaryOperator
} from './validation'
import ast from './ast'
import messages from './messages'
import formatMessage from './format-message'
import defaultOptions from './default-options'

const {
  EOF, Punctuator, Keyword, PunctuatorOrKeyword, Identifier,
  KeywordOrIdentifier, Literal, StringLiteral, IntegerLiteral, RealLiteral,
  DateLiteral, BooleanLiteral, UndefinedLiteral, ObjRef, LegacyAlias,
  Whitespace, Comment, PreprocessorDirective, PreprocessedAway
} = tokenTypes

const slice = Array.prototype.slice // optimize the often access

// ============================================================
// Error Handling

let sourceFile // name of the parsed source file
let input      // input text to parse
let offset     // offset of the currently evaluated character in the input text
let lineStart  // offset in the input text where the current line starts
let line       // currently parsed line in the input text (1-based)
let tokens     // an array of tokens created since the tokenizing started
let warnings   // an array of warnings encountered during parsing so far

// Creates a lexing or parsing error.
//
// Ensures properties offset, like, column and source on the error instance.

function createError (message, offset, line, column, warning) {
  const error = new SyntaxError(message)
  const properties = {
    source: { writable: true, value: sourceFile },
    offset: { writable: true, value: offset },
    line: { writable: true, value: line },
    column: { writable: true, value: column }
  }
  if (!warning) {
    properties.tokens = { writable: true, value: tokens }
    properties.warnings = { writable: true, value: warnings }
  }
  return Object.create(error, properties)
}

// Creates an error or a warning about an unexpected or invalid token.
//
// Expects a token, a flag if a warning should be created, a message format
// and optionally parameters for the message.
//
// Example:
//
//   // Say "expected [ near ("
//   createErrorForToken(token, false, "expected %1 near %2", '[', token.value)

function createErrorForToken (token, warning) {
  const message = formatMessage.apply(null, slice.call(arguments, 2))
  // offset is 0-based, line and column are 1-based
  let errorOffset, errorLine, errorColumn

  if (token === null || typeof token.line === 'undefined') {
    errorOffset = offset
    errorLine = line
    errorColumn = offset - lineStart + 1
  } else {
    errorOffset = token.range[0]
    errorLine = token.line
    errorColumn = offset - token.lineStart
  }

  return createError(message, errorOffset, errorLine, errorColumn, warning)
}

// Throws an error and interrupt parsing or tokenizing.

function throwError (token) {
  throw createErrorForToken.apply(this, [token, false].concat(slice.call(arguments, 1)))
}

// Gets a raw value of a token.

function tokenValue (token) {
  return input.slice(token.range[0], token.range[1]) || token.value
}

// Throws an unexpected token error.
//
// The caller should pass either a token object or a symbol string which was
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
  if (expected) throwError(found, messages.expectedToken, expected, tokenValue(nextToken))
  if (typeof found.type !== 'undefined') {
    let type
    switch (found.type) {
      case EOF: throwError(found, messages.unexpectedEOF); break
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
        throwError(found, messages.unexpected, 'literal', 'undefined', tokenValue(nextToken))
    }
    throwError(found, messages.unexpected, type, tokenValue(found), tokenValue(nextToken))
  }
  throwError(found, messages.unexpected, 'symbol', found, tokenValue(nextToken))
}

// ============================================================
// Lexer

// ---------- Token extraction

let length              // the length of the input text to parse
let tokenStart          // offset of the currently parsed token in the input text
let afterLineBreak      // if the current token occurs after a line break
let afterScript         // if the current token occurs after a "script" keyword
let enableTokenization  // if the upcoming tokens should be processed or ignored
let includeWhitespace   // if whitespace should be included in tokens for onCreateToken
let includePreprocessor // if preprocessor directives and the source content ignored by them should be included in tokens for onCreateToken
let onCreateToken       // callback for getting informed about any new token

// Scans the input at the current offset and returns a token lexed from it.
// Skips white space, comments, preprocessor directives and the content
// enclosed in the alternative part of the preprocessor condition

function getTokenFromInput () {
  let charCode, peekCharCode, token
  // the beginning of a currently parsed whitespace
  let offsetWhitespace, lineStartWhitespace, lineWhitespace
  // the beginning of a currently parsed code to be skipped by the preprocessor
  let offsetToSkip, lineStartToSkip, lineToSkip

  let joinLines = false
  afterLineBreak = false
  do {
    // Whitespace, comments and the code maked to ignor by the preprocessor has
    // no semantic meaning in OScript so simply skip ahead while tracking the
    // encountered newlines.
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
          // Count two characters \r\n as one line break
          if (charCode === 13 && peekCharCode === 10) ++offset
          ++line
          lineStart = ++offset
          // Do not make it a significant line break if preceded by \
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
            if (include === false) { // ifdef or ifndef evaluated to false
              offsetToSkip = offset
              lineStartToSkip = lineStart
              lineToSkip = line
            } else if (include === true) {
              // endif or else evaluated to true after an earlier ifdef
              // or ifndef evaluated to false
              if (onCreateToken && includePreprocessor) {
                onCreateToken({
                  type: PreprocessedAway,
                  value: input.slice(offsetToSkip, offset),
                  line: lineToSkip,
                  lineStart: lineStartToSkip,
                  lastLine: line,
                  lastLineStart: lineStart,
                  range: [offsetToSkip, offset]
                })
              }
            }
            offsetWhitespace = offset
            joinLines = false
            continue
          }
          break
        case 92: // \
          if (isWhitespace(peekCharCode)) {
            joinLines = true
          } else if (peekCharCode !== '/') {
            // If the next character is not a line break, consider this
            // a useless escaping and ignore the character. Comment will
            // be ignored in the check.
            const peekAnotherCharCode = input.charCodeAt(offset + 2)
            if (peekAnotherCharCode !== 47 && peekAnotherCharCode !== 42) { // /*
              warnings.push(createErrorForToken({
                type: Whitespace,
                value: '\\',
                line,
                lineStart,
                range: [offset, offset + 1]
              }, true, messages.uselessBackslash, '\\'))
            }
          }
          ++offset
          continue
      }
      break
    }

    if (!enableTokenization) {
      // Text in an ignored preprocessor scope cannot be fully tokenised
      // because it may contain invalid code. Start looking for the ending
      // preprocessor directive on the next line.
      while (offset < length && !isLineTerminator(input.charCodeAt(++offset)));
      continue
    }

    // Memorize the range offset where the token begins.
    tokenStart = offset

    // Inform the caller about the end of the input text
    if (offset >= length) {
      const token = placeToken({ type: EOF, value: '<eof>' })
      if (onCreateToken) onCreateToken(token)
      return token
    }

    // Notify the caller about a white space
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
      // Script identifiers can contain white space and dashes. Remember
      // if the last keyword was "script" for the next tokenizing step.
      afterScript = token.value === 'script'
      if (onCreateToken) onCreateToken(token)
      return token
    }

    switch (charCode) {
      case 39: case 34: // '"
        token = scanStringLiteral(false)
        break

      case 96: // `
        if (oldVersion) break
        token = scanStringLiteral(true)
        break

      case 35: // #
        if (peekCharCode === 39 && !oldVersion) token = scanHashQuote() // '
        else if (isHexadecimalDigit(peekCharCode)) token = scanObjRef()
        else throwError(null, messages.malformedHash, input.slice(offset, offset + 2))
        break

      case 48: case 49: case 50: case 51: case 52: case 53:
      case 54: case 55: case 56: case 57: // 0-9
        token = scanNumericOrDateLiteral(true)
        break

      case 46: // .
        // If the dot is followed by a digit it's a float.
        if (isDecimalDigit(peekCharCode)) {
          token = scanNumericOrDateLiteral(false)
        } else if (peekCharCode === 46) { // .
          if (input.charCodeAt(offset + 2) === 46) token = scanPunctuator('...')
          else token = scanPunctuator('..')
        } else {
          token = scanPunctuator('.')
        }
        break

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

  // do not tokenize code skipped by preprocessor
  } while (!enableTokenization) // eslint-disable-line no-unmodified-loop-condition

  afterScript = false // this token is not the "script" keyword
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
    // Script identifiers can contain white space and dashes
    let wordEnd = offset
    let charCode, space, dash
    for (;;) {
      charCode = input.charCodeAt(++offset)
      if (charCode === 32 || charCode === 9) { // [ ] \t
        space = true
        continue
      }
      if (charCode === 45) { // -
        dash = true
        continue
      }
      // Only identifiers with words separated by dashes can include whitespace
      if (space && !dash) {
        offset = wordEnd + 1
        break
      }
      if (!isIdentifierPart(charCode)) break
      space = dash = false
      wordEnd = offset
    }
    // Dashes are a part of the identifier, whitespace is not
    value = input.slice(tokenStart, offset).toLowerCase().replace(/ /g, '')
  } else if (startsWithDollar) {
    // Identifiers starting by one or two dollar-signs may include whitespace
    // between the dollar-signs and the rest of the identifier
    let charCode
    do {
      charCode = input.charCodeAt(++offset)
    } while (charCode === 32 || charCode === 9 || charCode === 36) // [ ] \t $
    const nameStart = offset
    while (isIdentifierPart(input.charCodeAt(offset))) ++offset
    // Dollar-signs are a part of the identifier, whitespace is not
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

  return placeToken({ type, value })
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
      throwError(null, messages.unfinishedHashQuote, input.slice(tokenStart, offset - 1))
    }
  }

  const value = input.slice(stringStart + 2, offset - 2).toLowerCase()
  return placeToken({ type: Identifier, value, hashQuote: true })
}

// # [0-9a-f]+

function scanObjRef () {
  const stringStart = ++offset // #
  while (isHexadecimalDigit((input.charCodeAt(offset)))) ++offset
  const value = parseInt(input.slice(stringStart, offset), 16)
  return placeToken({ type: ObjRef, value })
}

// & [0-9a-f]+

function scanLegacyAlias () {
  const stringStart = ++offset // &
  while (isHexadecimalDigit((input.charCodeAt(offset)))) ++offset
  const value = parseInt(input.slice(stringStart, offset), 16)
  return placeToken({ type: LegacyAlias, value })
}

// [:symbol:]

function scanPunctuator (value) {
  offset += value.length
  return placeToken({ type: Punctuator, value })
}

// Single-line: ' .* '
// Single-line: " .* "
// Multi-line:  ` .* `

function scanStringLiteral (multiline) {
  const delimiter = input.charCodeAt(offset++)
  const beginLine = line
  const beginLineStart = lineStart
  let stringStart = offset
  let string = ''
  let wrongMultiline

  for (;;) {
    const charCode = input.charCodeAt(offset++)
    if (delimiter === charCode) {
      if (input.charCodeAt(offset) !== delimiter) break
      // Two string delimiters within a string literal are recognized as
      // a single (escaped) string delimiter and included in the string.
      string += input.slice(stringStart, offset)
      stringStart = ++offset
    } else if (!multiline && isLineTerminator(charCode)) {
      // Be as forgiving as the OScript VM, although the language specification
      // allows only back-ticks as delimiters of multi-line strings
      wrongMultiline = true
    }
    if (offset > length) {
      if (multiline) throwError(token, messages.unfinishedLongString, beginLineStart, tokenValue(token))
      throwError(null, messages.unfinishedString, input.slice(tokenStart, offset - 1))
    }
  }

  string += input.slice(stringStart, offset - 1)
  const result = {
    type: StringLiteral,
    value: string,
    line: beginLine,
    lineStart: beginLineStart,
    lastLine: line,
    lastLineStart: lineStart,
    range: [tokenStart, offset],
    afterLineBreak
  }
  if (wrongMultiline) {
    const quote = String.fromCharCode(delimiter)
    warnings.push(createErrorForToken(result, true, messages.lineBreakInString, quote, string))
  }
  return result
}

// Integer: [0-9]+
// Real: [0-9](\.[0-9]+)?(e[-+]p0-9]+)?
// Date: [0-9]{4}-[0-9]{2}}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}

function scanNumericOrDateLiteral (allowDate) {
  let charCode, real
  while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
  // Try a date literal at first
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
          throwError(null, messages.malformedDate, input.slice(tokenStart, offset))
        }
        ++offset
        while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset
        if (charCode !== 58) { // :
          throwError(null, messages.malformedDate, input.slice(tokenStart, offset))
        }
        ++offset
        while (isDecimalDigit((charCode = input.charCodeAt(offset)))) ++offset

        return placeToken({ type: DateLiteral, value: input.slice(tokenStart, offset) })
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
  // Exponent is optional
  if (charCode === 101 || charCode === 69) { // e or E
    real = true
    ++offset
    // Sign is optional
    if (input.charCodeAt(offset) === 45) ++offset // -
    // An exponent is required to contain at least one decimal digit.
    if (!isDecimalDigit(input.charCodeAt(offset))) {
      throwError(null, messages.malformedNumber, input.slice(tokenStart, offset))
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

  return placeToken({ type, value })
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
        // Count two characters \r\n as a single line break.
        if (charCode === 13 && input.charCodeAt(offset) === 10) ++offset
        ++line
        lineStart = offset
        break
    }
  }

  throwError(null, messages.unfinishedLongComment, firstLine, '<eof>')
}

// ---------- Preprocessor directive scanning

let defines // map of name-value pairs of preprocessor variables

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
    onCreateToken(placeToken({
      type: PreprocessorDirective,
      value: content,
      directive: type,
      name,
      namedValue: value
    }))
  }
  return executePreprocessorDirective(type, name, value)
}

// (define|undef|ifdef|ifndef|endif) [:name:] [:value:]

function splitPreprocessorDirective (content) {
  let [, type, name, value] = /^\s*(\w+)(?:\s+(\w+))?(?:\s*(.+))?\s*$/.exec(content) || []
  if (!type) {
    throwError(null, messages.unfinishedPrepDirective, line, input.slice(tokenStart, offset - 1))
  }
  type = type.toLowerCase()
  if (value) {
    value = value.trim()
    // Ignore values containing only whitespace
    if (!value.length) value = undefined
  }
  if (type === 'define' || type === 'undef' || type === 'ifdef' || type === 'ifndef') {
    if (name) {
      name = name.toLowerCase()
      if (type === 'define' && value === undefined) value = '1'
    } else if (type === 'define' || type === 'undef') {
      throwError(null, messages.unfinishedPrepDirective, line, input.slice(tokenStart, offset - 1))
    } else {
      // Be as forgiving as the OScript VM, although the language specification
      // requires a name for a ifdef or ifndef directives
      const result = placeToken({ type: PreprocessorDirective, value: content })
      warnings.push(createErrorForToken(result, true, messages.prepDirectiveWithoutName, type, content))
    }
    if (value && (type === 'ifdef' || type === 'ifndef')) {
      // Be as forgiving as the OScript VM, although the language specification
      // forbids anything to follow "ifdef|ifndef <name>"
      const result = placeToken({ type: PreprocessorDirective, value: content })
      warnings.push(createErrorForToken(result, true, messages.charactersAfterPrepDirective, type, content))
    }
  } else if (type === 'else' || type === 'endif') {
    if (name || value) {
      // Be as forgiving as the OScript VM, although the language specification
      // forbids anything to follow else or endif directives
      const result = placeToken({ type: PreprocessorDirective, value: content })
      warnings.push(createErrorForToken(result, true, messages.charactersAfterPrepDirective, type, content))
    }
  } else {
    throwError(null, messages.unfinishedPrepDirective, line, input.slice(tokenStart, offset - 1))
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
  // Report only state changes by true - include or false - exclude the source
  return previousIncludeContent !== enableTokenization ? enableTokenization : undefined
}

// ---------- Preprocessor directive scoping

let includeScope        // if the current ifdef|ifndef|else region evaluated to true
let inclusionScopes     // array all nested ifdef|ifndef scopes so far
let tokenBackup         // the last token before a preprocessor scope to ignore started
let previousTokenBackup // the last previousToken before a preprocessor scope to ignore started
let nextTokenBackup     // the last nextToken before a preprocessor scope to ignore started

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
    throwError(null, messages.unfinishedPrepDirective, line, input.slice(tokenStart, offset - 1))
  }
}

function updateIncludeScope () {
  const previousIncludeContent = enableTokenization
  enableTokenization = includeScope && inclusionScopes.every(scope => scope)
  if (previousIncludeContent !== enableTokenization) {
    if (enableTokenization) {
      // If the tokenization was disabled, remember the current token
      // to be able to continue when the tokenization is re-enabled
      previousToken = previousTokenBackup
      token = tokenBackup
      nextToken = nextTokenBackup
    } else {
      // If the tokenization is re-enabled, continue from the last token
      // before the tokenization was disabled
      previousTokenBackup = previousToken
      tokenBackup = token
      nextTokenBackup = nextToken
    }
  }
}

// ---------- Lexing helpers

function placeToken (token) {
  token.line = line
  token.lineStart = lineStart
  token.range = [tokenStart, offset]
  token.afterLineBreak = afterLineBreak
  return token
}

// ============================================================
// Parser

let token         // the current token scheduled for processing
let previousToken // the token processed before the current one
let nextToken     // the token that will be processed after the current one

// ---------- Reading and checking tokens

let advanceToNextToken // function returning a next token to be processed

function advanceToNextTokenFromInput () {
  previousToken = token
  token = nextToken
  nextToken = getTokenFromInput()
}

function advanceToNextTokenFromTokens () {
  previousToken = token
  token = nextToken
  nextToken = getTokenFromTokens()
}

// Gets a new token from the input token array insted of the input text.

function getTokenFromTokens () {
  // An array of tokens does nto include an explicit <eof> token
  if (offset >= length) return { type: EOF, value: '<eof>' }
  return tokens[offset++]
}

// Consumes a token if its value matches the expected one and advance to
// the next one. Once consumed or not, returns the success of the operation.

function consumePunctuator (value) {
  if (token.type === Punctuator && value === token.value) {
    advanceToNextToken()
    return true
  }
  return false
}

function consumeKeyword (value) {
  if (token.type & KeywordOrIdentifier && value === token.value) {
    advanceToNextToken()
    return true
  }
  return false
}

// Expects the next token value to match the specified one and advances to
// the next one if it does. If not, throws an exception.

function expectPunctuator (value) {
  if (token.type === Punctuator && value === token.value) advanceToNextToken()
  else throwError(token, messages.expected, value, tokenValue(token))
}

function expectKeyword (value) {
  if (token.type & KeywordOrIdentifier && value === token.value) advanceToNextToken()
  else throwError(token, messages.expected, value, tokenValue(token))
}

function requirePrecedingLineBreak () {
  if (!token.afterLineBreak) {
    throwError(token, messages.expected, 'line break', tokenValue(token))
  }
}

// Expects either a line break occurring after the current statement,
// or a semicolon (;) to end it before the next statement can be parsed.

function advanceToNextStatement () {
  if (token.afterLineBreak) return
  expectPunctuator(';')
}

function canAdvanceToNextStatement () {
  if (token.afterLineBreak) return true
  return consumePunctuator(';')
}

// ---------- Location tracking

let locationsOrRanges // if locations or ranges should be stored in parsed nodes
let includeLocations  // if locations should be stored in parsed nodes
let includeRanges     // if ranges should be stored in parsed nodes
let onCreateNode      // callback for getting informed about any new parsed node

function getStartPosition (startToken = token) {
  // If locations and ranges are disabled, do not return anything; the result
  // will nopt be evaluated and stored on the parsed node anyway
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

// Optionally sets the location and range on the parsed node and notifies
// the caller that a new parsed node was created.

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

let includeRaw // if the raw source content should be attached to the parsed nodes
let sourceType // the type of the source code - script, object or dump
let oldVersion // if the old language version (before objects) should be parsed

// <Program> ::=
//   <PackageDeclaration> | <ScriptSource> | <DumpSource>

function parseProgram () {
  advanceToNextToken() // <bof>
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
      // Statements can be executed only before the first function is declared;
      // afterwards only function declarations are allowed.
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
  // Objects are specified to be public only, but the OScript VM is forgiving
  // and accepts at least the "override" modifier too
  const modifier = tryModifier()
  if (!modifier) handleUnexpectedToken(token, '<modifier>')
  if (modifier !== 'public') {
    // Be as forgiving as the OScript VM, although the language specification
    // requires a name for a ifdef or ifndef directive
    warnings.push(createErrorForToken(previousToken, true, messages.objectNotPublic, modifier))
  }
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
    let member = token.value
    let node
    switch (member) {
      case 'function':
        advanceToNextToken()
        node = parseFunctionDeclaration(position, modifier)
        break
      case 'script':
        advanceToNextToken()
        node = parseScriptDeclaration(position, modifier)
        break
      default:
        member = 'feature'
        node = parseFeatureDeclaration(position, modifier)
    }
    body.push(node)
    if (consumePunctuator(';')) {
      // Be as forgiving as the OScript VM, although the language specification
      // allows semicolons (;) only after statements
      warnings.push(createErrorForToken(previousToken, true, messages.unexpectedSemicolon, member, ';'))
      do { body.push(parseEmptyStatement()) } while (consumePunctuator(';'))
    }
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
    advanceToNextToken()
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
  // Type is optional; a variable identifier can be called as a type too
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
          advanceToNextToken()
          body.push(parseFunctionDeclaration(position))
          continue
        case 'endscript': case 'scriptend':
          requirePrecedingLineBreak()
          advanceToNextToken()
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
      nextToken.type === Punctuator && nextToken.value === ':') {
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
  advanceToNextToken() // if
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
          if (alternate) throwError(token, messages.expected, 'end', tokenValue(token))
          savePreviousClause()
          statements = []
          otherPosition = getStartPosition()
          advanceToNextToken()
          otherTest = parseExpression()
          advanceToNextStatement()
          continue
        case 'else':
          savePreviousClause()
          statements = []
          advanceToNextToken()
          advanceToNextStatement()
          continue
        case 'end':
          savePreviousClause()
          advanceToNextToken()
          return finishNode(ast.ifStatement(test, consequent, otherClauses, alternate), position)
      }
    }
    statements.push(parseStatement())
  }

  function savePreviousClause () {
    if (!consequent) { // after the (first) if clause
      consequent = statements
    } else if (otherTest) { // after an elseif clause
      otherClauses.push(finishNode(ast.elseifClause(otherTest, statements), otherPosition))
      otherTest = undefined
    } else { // after the (last) else clause
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
  advanceToNextToken() // switch
  const discriminant = parseExpression()
  advanceToNextStatement()
  let caseOrDefault, defaultCase
  let casePosition, tests, statements
  const cases = []
  for (;;) {
    if (Keyword === token.type) {
      switch (token.value) {
        case 'case':
          if (defaultCase) throwError(token, messages.expected, 'end', tokenValue(token))
          startCase()
          do { tests.push(parseExpression()) } while (consumePunctuator(','))
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
          advanceToNextToken()
          return finishNode(ast.switchStatement(discriminant, cases), position)
      }
      // Handle an end right after a case or default clauses
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
    advanceToNextToken()
    tests = []
    statements = []
    caseOrDefault = true
  }

  function endCase () {
    savePreviousCase()
    caseOrDefault = false
    advanceToNextToken()
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
  advanceToNextToken() // while
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
  advanceToNextToken() // repeat
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
  advanceToNextToken() // for
  if (consumePunctuator('(')) return parseForStatement(position)
  const id = parseIdentifier()
  if (consumeKeyword('in')) return parseForEachStatement(position, id)
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
  if (!canAdvanceToNextStatement()) {
    // Be as forgiving as the OScript VM, although the language specification
    // requires a line break or a semicolon (;) after the for statement
    warnings.push(createErrorForToken(previousToken, true, messages.unfinishedStatement, 'for', String(token.value)))
  }
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
    throwError(token, messages.expected, 'to or downto', tokenValue(token))
  }
  const end = parseExpression()
  let step
  if (consumeKeyword('by')) step = parseExpression()
  advanceToNextStatement()
  const body = parseLoopBody()
  return finishNode(ast.structuredForStatement(variable, start, end, down, step, body), position)
}

// <LoopBody> ::=
//   <Statement>*
//   "end"

function parseLoopBody () {
  const body = []
  while (!consumeKeyword('end')) body.push(parseStatement())
  return body
}

// <GotoStatement> ::=
//   "goto" <Identifier>

function parseGotoStatement () {
  const position = getStartPosition()
  advanceToNextToken() // goto
  const label = parseIdentifier()
  return finishNode(ast.gotoStatement(label), position)
}

// <Label> ::=
//   <Identifier> ":"

function parseLabel () {
  const position = getStartPosition()
  const id = parseIdentifier()
  advanceToNextToken() // :
  return finishNode(ast.labelStatement(id), position)
}

// <ReturnStatement> ::=
//   "return" [<Expression>]

function parseReturnStatement () {
  const position = getStartPosition()
  advanceToNextToken() // return
  // If a value should be returned, it has to follow the return keyword
  // on the same line, otherwise it will become the next statement and
  // an unreachable code. A semicolon can end the return statement without
  // returning a value too.
  const argument = token.afterLineBreak || (token.type === Punctuator && token.value === ';')
    ? undefined
    : parseExpression()
  return finishNode(ast.returnStatement(argument), position)
}

// <BreakStatement> ::=
//   "break"

function parseBreakStatement () {
  const position = getStartPosition()
  advanceToNextToken() // break
  return finishNode(ast.breakStatement(), position)
}

// <ContinueStatement> ::=
//   "continue"

function parseContinueStatement () {
  const position = getStartPosition()
  advanceToNextToken() // continue
  return finishNode(ast.continueStatement(), position)
}

// <BreakIfStatement> ::=
//   "breakif" <Expression>

function parseBreakIfStatement () {
  const position = getStartPosition()
  advanceToNextToken() // breakif
  const test = parseExpression()
  return finishNode(ast.breakIfStatement(test), position)
}

// <ContinueIfStatement> ::=
//   "continueif" <Expression>

function parseContinueIfStatement () {
  const position = getStartPosition()
  advanceToNextToken() // continueif
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
        if (nextToken.type === Punctuator && nextToken.value === '{') {
          advanceToNextToken()
          return parseAssocExpression()
        }
    }
    return parseObjectName()
  }
  return parseLiteral()
}

// <SpecialIdentifier> ::=
//   "this" | "super"

function parseSpecialIdentifier (type) { // thisExpression or superExpression
  const position = getStartPosition()
  advanceToNextToken() // this or super
  return finishNode(ast[type](), position)
}

// <ListExpressionOrComprehension> ::=
//   "{" [<ListElement>] ["," <ListElement>]* |
//       ["for" <Identifier> "in" <Expression> ["if" <Expression>]] "}"

function parseListExpressionOrComprehension () {
  const position = getStartPosition()
  advanceToNextToken() // {
  if (consumePunctuator('}')) { // an empty list
    return finishNode(ast.listExpression([]), position)
  }
  const firstElement = parseListElement()
  if (consumePunctuator('}')) { // a list with a single item
    return finishNode(ast.listExpression([firstElement]), position)
  }
  if (consumePunctuator(',')) { // a list with more than one item
    for (const elements = [firstElement]; ;) {
      elements.push(parseListElement())
      if (token.type === Punctuator) {
        switch (token.value) {
          case ',': advanceToNextToken(); continue
          case '}':
            advanceToNextToken()
            return finishNode(ast.listExpression(elements), position)
        }
      }
    }
  }
  expectKeyword('for') // a list comprehension <firstElement> for ...
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
  advanceToNextToken() // {
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
  advanceToNextToken() // (
  const expression = parseExpression()
  expectPunctuator(')')
  return finishNode(ast.parenthesisExpression(expression), position)
}

// <MemberSliceCallExpression> ::=
//   [<PrimaryExpression>]
//   [[<MemberExpression>] [<SliceExpression>] [<CallExpression>]]*

function parseMemberSliceCallExpression () {
  let position = getStartPosition()
  let left = consumePunctuator('.') // a starting dot alone dereferences this
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
      // A string can appear in the chain of dereferencing in place of an identifier
      property = parseLiteral()
  }
  return finishNode(ast.memberExpression(object, property), position)
}

// <SliceExpression> ::=
//   "[" <Expression> | (<Expression> ":" [<Expression>]) | (":" <Expression>) "]"

function parseSliceExpression (object, position) {
  let start, end
  if (consumePunctuator(':')) { // [ : 123 ]
    end = parseExpression()
    expectPunctuator(']')
  } else {
    start = parseExpression()
    if (consumePunctuator(':')) {  // [ 123 : ] or [ 123 : 456 ]
      if (!consumePunctuator(']')) {  // [ 123 : 456 ]
        end = parseExpression()
        expectPunctuator(']')
      }
    } else {
      expectPunctuator(']') // [ 123 ] (index, not slice)
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
  if (token.type & PunctuatorOrKeyword && isUnaryOperator(token.value)) {
    const position = getStartPosition()
    const operator = token.value
    advanceToNextToken()
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
    if (!(token.type & PunctuatorOrKeyword && isBinaryOperator(token.value))) return left
    const operator = token.value
    advanceToNextToken()
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
  advanceToNextToken() // [
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
  advanceToNextToken() // identifier or hashquote or legacyalias
  const raw = includeRaw && (previousToken.hashQuote || previousToken.type === LegacyAlias)
    ? input.slice(previousToken.range[0], previousToken.range[1])
    : undefined
  return finishNode(ast.identifier(previousToken.value, raw), position)
}

// Converts built-in identifiers, which are usually literals in the value
// context, to user identifiers if their context expects a variable or not
// a value.

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
      advanceToNextToken()
      tokenType = token.type
      tokenValue = token.value
      negative = true
    }
  } else if (tokenType & KeywordOrIdentifier && tokenValue === 'assoc' &&
      nextToken.type === Punctuator && nextToken.value === '{') {
    advanceToNextToken()
    return parseAssocExpression()
  }
  if (!(tokenType & Literal)) handleUnexpectedToken(token, '<literal>')
  const position = getStartPosition()
  advanceToNextToken()
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
      advanceToNextToken()
      return value
  }
}

// <Type> ::=
//   "boolean" | ...

function tryType () {
  const value = token.value
  if (value !== null && isType(value)) {
    advanceToNextToken()
    return value
  }
}

// <TypeOfVariable> ::=
//   ("boolean" | ...) <Identifier>

function tryTypeOfVariable () {
  const value = token.value
  // A type identifier will be recognized as a type only if it is followed
  // by a variable identifier (in a variable declaration statement)
  if (value !== null && isType(value) && (nextToken.type & KeywordOrIdentifier)) {
    advanceToNextToken()
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

let includeTokens // if an array of tokens should be attached to the parsed AST

function parseText (_input, _options) {
  initialize(_input, _options)

  if (includeTokens) {
    tokens = []
    onCreateToken = token => tokens.push(token)
  }

  advanceToNextToken = advanceToNextTokenFromInput
  nextToken = getTokenFromInput()

  const program = parseProgram()
  // Do not return the last <eof> token
  program.tokens = tokens && tokens.slice(0, tokens.length - 1)
  program.warnings = warnings
  return program
}

function parseTokens (_input, _tokens, _options) {
  initialize(_input, _options)

  tokens = _tokens
  length = tokens.length

  advanceToNextToken = advanceToNextTokenFromTokens
  nextToken = getTokenFromTokens()

  return parseProgram()
}

function tokenize (_input, _options) {
  initialize(_input, _options)

  const tokens = []
  onCreateToken = token => tokens.push(token)

  while (getTokenFromInput().type !== EOF);
  // Do not return the last <eof> token
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
  warnings = []
}

function * iterate () {
  const tokens = []
  onCreateToken = token => tokens.push(token)

  for (;;) {
    const token = getTokenFromInput()
    // Insignificant tokens (whitespace, comments, preprocessor directives
    // and the code skipped by the preprocessor) are returned only via the
    // onCreateToken callback before the getTokenFromInput function finishes.
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
