import { defaultLexerErrorProvider } from 'chevrotain'

export default {
  buildUnexpectedCharactersMessage (fullText, startOffset, length, line, column) {
    return defaultLexerErrorProvider.buildUnexpectedCharactersMessage(
      fullText, startOffset, length, line, column)
  }
}
