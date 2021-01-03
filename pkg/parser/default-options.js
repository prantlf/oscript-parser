// Options can be set either globally on the parser object through
// defaultOptions, or during the parse call.
export default {
  // Named preprocessor values. Used when executing preprocessor directives.
  defines: {},
  // Include lexer tokens in the output object.
  // Useful for code formatting or partial analysis in case of errors.
  tokens: false,
  // Include tokens of preprocessor directives and the content skipped by the preprocessor.
  // Useful for code formatting.
  preprocessor: false,
  // Include comment tokens in the output of parsing or lexing.
  // Useful for code formatting.
  comments: false,
  // Include whitespace tokens in the output of parsing or lexing.
  // Useful for code formatting.
  whitespace: false,
  // Store location information on each parser node as
  // `loc: { start: { line, column }, end: { line, column } }`.
  locations: false,
  // Store the start and end character locations on each parser node as
  // `range: [start, end]`.
  ranges: false,
  // Store the raw original of identifiers and literals.
  // Useful for code formatting and exact string matching.
  raw: false,
  // Store the raw original of identifiers only.
  // Useful for code formatting and exact string matching.
  rawIdentifiers: false,
  // Store the raw original of literals only.
  // Useful for code formatting.
  rawLiterals: false,
  // Set the source type to `object`, `script` or `dump` (the old object format).
  sourceType: 'script',
  // Enable support for the old version of the OScript language.
  oldVersion: undefined,
  // File name to refer in source locations to.
  sourceFile: 'snippet'
}
