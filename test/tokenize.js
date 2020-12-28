import testSnippets from './test-snippets'
import { tokenize } from '..'

testSnippets((assert, code) => {
  try {
    tokenize(code)
    assert.ok(true, 'OK')
  } catch ({ message, line, column }) {
    assert.fail({ message: `at ${line},${column + 1}: ${message}` })
  }
}, {
  'test failure': assert => {
    try {
      tokenize('#invalid')
      assert.fail('tokenized "#invalid"')
    } catch ({ message, line, column }) {
      assert.ok(message && line && column, 'OK')
    }
  }
})
