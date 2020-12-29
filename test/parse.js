import testSnippets from './test-snippets'
import { parseText, parseTokens, tokenize } from '..'

testSnippets((assert, code, sourceType) => {
  try {
    parseText(code, { sourceType: sourceType || 'object', tokens: true })
    const tokens = tokenize(code, { sourceType: sourceType || 'object' })
    parseTokens(code, tokens, { sourceType: sourceType || 'object' })
    assert.ok(true, 'OK')
  } catch ({ message, line, column }) {
    assert.fail({ message: `at ${line},${column + 1}: ${message}` })
  }
}, {
  'test failure': assert => {
    try {
      parseText('i = = [', { sourceType: 'script' })
      assert.fail('parsed "i = = ["')
    } catch ({ message, line, column }) {
      assert.ok(message && line && column, 'OK')
    }
  },
  'test warning': assert => {
    const { warnings } = parseText('s = "\n"', { sourceType: 'script' })
    if (warnings.length) assert.ok(warnings.length === 1)
    else assert.fail('parsed "s = \n"')
  }
})
