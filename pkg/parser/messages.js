export default {
  unexpected: {
    code: 'E001',
    text: 'unexpected %1 \'%2\' near \'%3\''
  },
  unexpectedEOF: {
    code: 'E002',
    text: 'unexpected symbol near \'<eof>\''
  },
  expected: {
    code: 'E003',
    text: '\'%1\' expected near \'%2\''
  },
  expectedToken: {
    code: 'E004',
    text: '%1 expected near \'%2\''
  },
  malformedNumber: {
    code: 'E005',
    text: 'malformed number near \'%1\''
  },
  malformedDate: {
    code: 'E006',
    text: 'malformed date near \'%1\''
  },
  malformedHash: {
    code: 'E007',
    text: 'malformed hashquote or objref near \'%1\''
  },
  unfinishedString: {
    code: 'E008',
    text: 'unfinished string near \'%1\''
  },
  unfinishedLongString: {
    code: 'E009',
    text: 'unfinished long string (starting at line %1) near \'%2\''
  },
  unfinishedLongComment: {
    code: 'E010',
    text: 'unfinished long comment (starting at line %1) near \'%2\''
  },
  unfinishedHashQuote: {
    code: 'E011',
    text: 'unfinished hash quote (starting at line %1) near \'%2\''
  },
  unfinishedPrepDirective: {
    code: 'E012',
    text: 'unfinished preprocessor directive (starting at line %1) near \'%2\''
  },
  // warnings
  lineBreakInString: {
    code: 'W001',
    text: 'multi-line string not delimited by back-ticks: %1%2%1'
  },
  uselessBackslash: {
    code: 'W002',
    text: 'backslash not followed by a line-break near \'%1\''
  },
  prepDirectiveWithoutName: {
    code: 'W003',
    text: 'missing name identifier after %1 near \'%2\''
  },
  objectNotPublic: {
    code: 'W004',
    text: 'modifier %1 used instead of public for an object'
  },
  charactersAfterPrepDirective: {
    code: 'W005',
    text: 'unexpected characters after %1 near \'%2\''
  },
  unexpectedSemicolon: {
    code: 'W006',
    text: 'unexpected semicolon after %1 declaration near \'%2\''
  },
  unfinishedStatement: {
    code: 'W007',
    text: 'missing semicolon after the %1 statement near \'%2\''
  }
}
