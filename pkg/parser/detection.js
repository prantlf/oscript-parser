function isLineTerminator (charCode) {
  return charCode === 10 || charCode === 13
}

function isWhitespace (charCode) {
  return charCode === 32 || isLineTerminator(charCode) || charCode === 9 ||
    charCode === 0xB || charCode === 0xC
}

function isDecimalDigit (charCode) {
  return charCode >= 48 && charCode <= 57
}

function isHexadecimalDigit (charCode) {
  return (charCode >= 48 && charCode <= 57) ||
    (charCode >= 65 && charCode <= 70) || (charCode >= 97 && charCode <= 102)
}

function isIdentifierStart (charCode) {
  return (charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode === 95 || charCode === 36
}

function isIdentifierPart (charCode) {
  return isIdentifierStart(charCode) || (charCode >= 48 && charCode <= 57)
}

// Checks if the identifier is a reserved keyword.
//
// `true`, `false` and `undefined` will not be considered keywords, but literals.

function isKeyword (id, oldVersion) {
  switch (id.length) {
    case 2:
      return id === 'if' || id === 'in' || id === 'to' || id === 'by' ||
        id === 'or' || id === 'eq' || id === 'ne' || id === 'lt' ||
        id === 'gt' || id === 'le' || id === 'ge' || id === 'do'
    case 3:
      return id === 'end' || id === 'for' || id === 'not' || id === 'and' ||
        (oldVersion && id === 'set')
    case 4:
      if (id === 'else' || id === 'case' || id === 'goto' || id === 'then') {
        return true
      }
      return !oldVersion && (id === 'this' || id === 'super' || id === 'none')
    case 5:
      if (id === 'while' || id === 'until' || id === 'break') {
        return true
      }
      return !oldVersion && (id === 'final' || id === 'using')
    case 6:
      if (id === 'return' || id === 'elseif' || id === 'repeat' ||
          id === 'switch' || id === 'script' || id === 'downto') {
        return true
      }
      return !oldVersion && (id === 'public' || id === 'object')
    case 7:
      if (id === 'default' || id === 'breakif' || id === 'nodebug') {
        return true
      }
      return !oldVersion && (id === 'private' || id === 'package')
    case 8:
      if (id === 'function' || id === 'continue') {
        return true
      }
      return !oldVersion && (id === 'override' || id === 'inherits')
    case 9:
      return id === 'endscript' || (!oldVersion && id === 'interface') ||
      (oldVersion && id === 'scriptend')
    case 10:
      return id === 'continueif' || (oldVersion && id === 'addfeature')
  }
  return false
}

function isType (id) {
  switch (id.length) {
    case 3:
      return id === 'set' || id === 'vis'
    case 4:
      return id === 'date' || id === 'file' || id === 'guid' ||
        id === 'list' || id === 'long' || id === 'real' || id === 'void'
    case 5:
      return id === 'assoc' || id === 'bytes' || id === 'frame' ||
      id === 'point' || id === 'regex' || id === 'error'
    case 6:
      return id === 'string' || id === 'record' || id === 'object' ||
        id === 'objref' || id === 'script' || id === 'socket' ||
        id === 'dialog'
    case 7:
      return id === 'boolean' || id === 'integer' || id === 'hashmap' ||
        id === 'capierr' || id === 'capilog' || id === 'dynamic' ||
        id === 'patfind' || id === 'wapimap' || id === 'domattr' ||
        id === 'domnode' || id === 'domtext' || id === 'otquery'
    case 8:
      return id === 'recarray' || id === 'dapinode' || id === 'filecopy' ||
        id === 'uapiuser' || id === 'wapiwork' || id === 'otsearch'
    case 9:
      return id === 'cachetree' || id === 'capilogin' || id === 'fileprefs' ||
        id === 'patchange' || id === 'sqlcursor' || id === 'domentity' ||
        id === 'domparser' || id === 'saxparser'
    case 10:
      return id === 'dapistream' || id === 'javaobject' || id === 'restclient' ||
      id === 'ssloptions' || id === 'domcomment' || id === 'domelement'
    case 11:
      return id === 'capiconnect' || id === 'dapisession' ||
        id === 'dapiversion' || id === 'mailmessage' || id === 'pop3session' ||
        id === 'smtpsession' || id === 'uapisession' || id === 'wapisession' ||
        id === 'wapimaptask' || id === 'wapisubwork' || id === 'domdocument' ||
        id === 'domnodelist' || id === 'domnotation' || id === 'ipoolobject'
    case 12:
      return id === 'xslprocessor'
    case 13:
      return id === 'sqlconnection'
    case 15:
      return id === 'domcdatasection' || id === 'domdocumenttype' ||
        id === 'domnamednodemap' || id === 'ipoolconnection'
    case 16:
      return id === 'domcharacterdata' || id === 'ipooltransaction'
    case 17:
      return id === 'domimplementation'
    case 18:
      return id === 'domentityreference'
    case 19:
      return id === 'domdocumentfragment'
    case 24:
      return id === 'domprocessinginstruction'
  }
  return false
}

function isUnaryOperator (symbol) {
  switch (symbol.length) {
    case 1:
      return symbol === '!' || symbol === '-' || symbol === '~'
    case 3:
      return symbol === 'not'
  }
  return false
}

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
        symbol === '|=' || symbol === '^=' || symbol === '^^' ||
        symbol === '<<' || symbol === '>>' || symbol === 'or' ||
        symbol === 'eq' || symbol === 'ne' || symbol === 'lt' ||
        symbol === 'le' || symbol === 'gt' || symbol === 'ge'
    case 3:
      return symbol === 'and' || symbol === 'xor'
  }
  return false
}

export {
  isLineTerminator,
  isWhitespace,
  isDecimalDigit,
  isHexadecimalDigit,
  isIdentifierStart,
  isIdentifierPart,
  isKeyword,
  isType,
  isUnaryOperator,
  isBinaryOperator
}
