import { readdirSync, readFileSync } from 'fs'
import { parse as parseFile, join } from 'path'
import match from 'minimatch'
import { run } from 'test'

const snippetPattern = process.env.SNIPPETS || '*.*'
const [chapterPattern, descriptionPattern = '*'] = snippetPattern.split(/\.(.+)/)

function readSnippetsFromDirectory (directory) {
  console.log('Loading all tests:')
  const files = readdirSync(directory)
  const snippets = []
  for (const file of files) {
    const name = parseFile(file).name
    if (!match(name, chapterPattern)) {
      console.log(`  skip ${name}`)
      continue
    }
    snippets.push.apply(snippets, readSnippetsFromFile(name, join(directory, file)))
  }
  return snippets
}

function readSnippetsFromFile (chapter, file) {
  const content = readFileSync(file, 'utf-8')
  const snippets = []
  let code = []
  let snippet
  for (const line of content.split(/\r?\n/)) {
    if (line.startsWith('///')) {
      if (snippet) addLastSnippet()
      const description = line.substr(3).trim()
      snippet = { chapter, description }
      code = []
    } else {
      code.push(line)
    }
  }
  addLastSnippet()
  return snippets

  function addLastSnippet () {
    const description = snippet.description
    if (description.startsWith('SKIP ') || !match(description, descriptionPattern)) {
      return console.log(`  skip ${snippet.chapter}: ${trimDescription(description)}`)
    }
    snippet.code = code.join('\n')
    snippets.push(snippet)
  }
}

function filterSnippets (snippets) {
  if (snippets.some(({ description }) => description.startsWith('PICK '))) {
    snippets = snippets.filter(({ chapter, description }) => {
      if (description.startsWith('PICK ')) return true
      return console.log(`  skip ${chapter}: ${trimDescription(description)}`)
    })
  }
  return snippets
}

function trimDescription (description) {
  return description.startsWith('SKIP ') || description.startsWith('PICK ')
    ? description.substr(5)
    : description
}

function createTests (snippets, test) {
  const tests = {}
  for (let { chapter, description, code } of snippets) {
    if (description.startsWith('PICK ')) {
      description = description.substr(5)
    }
    const type = / \((\w+)\)$/.exec(description)
    tests[`test ${chapter}: ${description}`] =
      assert => test(assert, code, type && type[1])
  }
  return tests
}

function testSnippets (test, additionalTests = {}) {
  let snippets = readSnippetsFromDirectory(join(__dirname, 'snippets'))
  snippets = filterSnippets(snippets)
  const tests = createTests(snippets, test)
  run({ ...tests, ...additionalTests })
}

export default testSnippets
