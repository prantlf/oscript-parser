const EOF = 1
const Whitespace = 2
const Comment = 4
const PreprocessorDirective = 8
const PreprocessedAway = 16
const Punctuator = 32
const Keyword = 64
const Identifier = 128
const StringLiteral = 256
const IntegerLiteral = 512
const BooleanLiteral = 1024
const UndefinedLiteral = 2048
const RealLiteral = 4096
const DateLiteral = 8192
const ObjRef = 16384
const LegacyAlias = 32768

const KeywordOrIdentifier = Keyword | Identifier
const PunctuatorOrKeyword = Punctuator | Keyword
const Literal = StringLiteral | IntegerLiteral | RealLiteral | DateLiteral |
  BooleanLiteral | UndefinedLiteral | ObjRef
const NoCode = Whitespace | Comment | PreprocessorDirective | PreprocessedAway

export {
  EOF,
  Whitespace,
  Comment,
  PreprocessorDirective,
  PreprocessedAway,
  Punctuator,
  Keyword,
  Identifier,
  StringLiteral,
  IntegerLiteral,
  RealLiteral,
  DateLiteral,
  BooleanLiteral,
  UndefinedLiteral,
  ObjRef,
  LegacyAlias,
  // Combinations for matching multiple token types
  Literal,
  KeywordOrIdentifier,
  PunctuatorOrKeyword,
  NoCode
}
