import testSnippets from './test-snippets'
import { tokenize } from '..'

testSnippets((assert, code) => {
  try {
    tokenize(code)
  } catch ({ message, line, column }) {
    assert.fail({ message: `at ${line},${column + 1}: ${message}` })
  }
}, {
  'test failure': assert => {
    try {
      tokenize('#invalid')
      assert.fail('tokenized "#invalid"')
    } catch ({ message, code, line, column, offset, length }) {
      if (!(message && code && line && column &&
          offset !== undefined && length !== undefined)) assert.fail('missing error info')
    }
  }
})
