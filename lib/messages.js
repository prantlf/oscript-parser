export default {
  unexpected: 'unexpected %1 \'%2\' near \'%3\'',
  unexpectedEOF: 'unexpected symbol near \'<eof>\'',
  expected: '\'%1\' expected near \'%2\'',
  expectedToken: '%1 expected near \'%2\'',
  malformedNumber: 'malformed number near \'%1\'',
  malformedDate: 'malformed date near \'%1\'',
  malformedHash: 'malformed hashquote or objref near \'%1\'',
  unfinishedString: 'unfinished string near \'%1\'',
  unfinishedLongString: 'unfinished long string (starting at line %1) near \'%2\'',
  unfinishedLongComment: 'unfinished long comment (starting at line %1) near \'%2\'',
  unfinishedHashQuote: 'unfinished hash quote (starting at line %1) near \'%2\'',
  unfinishedPrepDirective: 'unfinished preprocessor directive (starting at line %1) near \'%2\'',
  // warnings
  lineBreakInString: 'multi-line string not delimited by back-ticks: %1%2%1',
  uselessBackslash: 'backslash not followed by a line-break near \'%1\'',
  prepDirectiveWithoutName: 'missing name identifier after %1 near \'%2\'',
  objectNotPublic: 'modifier %1 used instead of public for an object',
  charactersAfterPrepDirective: 'unexpected characters after %1 near \'%2\'',
  unexpectedSemicolon: 'unexpected semicolon after %1 declaration near \'%2\'',
  unfinishedStatement: 'missing semicolon after the %1 statement near \'%2\''
}
