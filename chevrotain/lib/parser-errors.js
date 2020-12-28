import { defaultParserErrorProvider } from 'chevrotain'

export default {
  buildMismatchTokenMessage: function (options) {
    return defaultParserErrorProvider.buildMismatchTokenMessage(options)
  },
  buildNotAllInputParsedMessage: function (options) {
    return defaultParserErrorProvider.buildMismatchTokenMessage(options)
  },
  buildNoViableAltMessage: function (options) {
    return defaultParserErrorProvider.buildNoViableAltMessage(options)
  },
  buildEarlyExitMessage: function (options) {
    return defaultParserErrorProvider.buildMismatchTokenMessage(options)
  }
}
