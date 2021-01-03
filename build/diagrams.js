import mkdirp from 'mkdirp'
import { load } from 'js-yaml'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { Diagram } from '@prantlf/railroad-diagrams'

const styles = {
  defaultLight: `path {
        stroke-width: 3;
        stroke: black;
        fill: rgba(0,0,0,0);
      }
      text {
        font: bold 14px monospace;
        text-anchor: middle;
        white-space: pre;
        fill: black;
      }
      text.diagram-text {
        font-size: 12px;
      }
      text.diagram-arrow {
        font-size: 16px;
      }
      text.label {
        text-anchor: start;
      }
      text.comment {
        font: italic 12px monospace;
      }
      rect {
        stroke-width: 3;
        stroke: black;
        fill: hsl(180,100%,90%);
      }
      rect[rx] {
        fill: hsl(120,100%,90%);
      }
      rect.group-box {
        stroke: gray;
        stroke-dasharray: 10 5;
        fill: none;
      }
      path.diagram-text {
        stroke-width: 3;
        stroke: black;
        fill: white;
        cursor: help;
      }
      g.diagram-text:hover path.diagram-text {
        fill: #eee;
      }`,
  defaultDark: `path {
        stroke-width: 3;
        stroke: white;
        fill: rgba(255,255,255,0);
      }
      text {
        font: bold 14px monospace;
        text-anchor: middle;
        white-space: pre;
        fill: white;
      }
      text.diagram-text {
        font-size: 12px;
      }
      text.diagram-arrow {
        font-size: 16px;
      }
      text.label {
        text-anchor: start;
      }
      text.comment {
        font: italic 12px monospace;
      }
      rect {
        stroke-width: 3;
        stroke: white;
        fill: hsl(180,100%,15%);
      }
      rect[rx] {
        fill: hsl(120,100%,15%);
      }
      rect.group-box {
        stroke: gray;
        stroke-dasharray: 10 5;
        fill: none;
      }
      path.diagram-text {
        stroke-width: 3;
        stroke: white;
        fill: black;
        cursor: help;
      }
      g.diagram-text:hover path.diagram-text {
        fill: #111;
      }`,
  merryLight: `svg {
        stroke: hsl(205,100%,41%);
      }
      path {
        stroke-width: 2;
        stroke: hsl(30,100%,41%);
        fill: rgba(0,0,0,0);
      }
      text {
        font: 14px monospace;
        text-anchor: middle;
        stroke: black;
      }
      text.label {
        text-anchor: start;
      }
      text.comment {
        font: italic 12px monospace;
      }
      rect {
        stroke-width: 2;
        stroke: hsl(205,100%,41%);
        fill: rgba(0,0,0,0);
      }
      rect[rx] {
        stroke: hsl(140,100%,41%);
      }`,
  merryDark: `svg {
        stroke: hsl(205,100%,41%);
      }
      path {
        stroke-width: 2;
        stroke: hsl(30,100%,41%);
        fill: rgba(0,0,0,0);
      }
      text {
        font: 14px monospace;
        text-anchor: middle;
        stroke: white;
      }
      text.label {
        text-anchor: start;
      }
      text.comment {
        font: italic 12px monospace;
      }
      rect {
        stroke-width: 2;
        stroke: hsl(205,100%,41%);
        fill: rgba(255,255,255,0);
      }
      rect[rx] {
        stroke: hsl(140,100%,41%);
      }`
}

function renderDiagrams (diagrams) {
  for (const name in diagrams) {
    renderDiagram(name, diagrams[name])
  }
}

function renderDiagram (name, code) {
  const content = code
    .toString()
    .replace(/(?:<svg)(?: xmlns="http:\/\/www.w3.org\/2000\/svg")?(?: xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink")?(?: class="railroad-diagram")?( width="[.0-9]+" height="[.0-9]+" viewBox="[.0-9]+ [.0-9]+ [.0-9]+ [.0-9]+")>/,
`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="railroad-diagram"$1>
  <defs>
    <style type="text/css"><![CDATA[
      ${styles.defaultLight}
    ]]></style>
  </defs>
`)
  writeFileSync(join(__dirname, `../doc/diagrams/${name}.svg`), content)
}

function formatDiagramName (name) {
  name = name.replace(/(-.)/g, (match, separator) => separator[1].toUpperCase())
  return name.substr(0, 1).toUpperCase() + name.substr(1)
}

function formatChapterTitle (name) {
  name = name.replace(/([A-Z])/g, ' $1')
  return name.substr(0, 1).toUpperCase() + name.substr(1)
}

function addDiagrams (diagrams) {
  let content = ''
  for (const name in diagrams) {
    content += addDiagram(name)
  }
  return content
}

function addDiagram (name) {
  const title = formatDiagramName(name)
  return `
### ${title}

![${title}](diagrams/${name}.svg)
`
}

function addChapters (chapters) {
  let content = ''
  for (const name in chapters) {
    content += addChapter(name, chapters[name])
  }
  return content
}

function addChapter (name, diagrams) {
  renderDiagrams(diagrams)
  return `
## ${formatChapterTitle(name)}
${addDiagrams(diagrams)}`
}

function renderDescription (chapters) {
  const content = `# OScript Language Grammar

OScript is case-insensitive. Letters in the diagrams below are lower-case for simplicity, but they may appear upper-case too.

All white space outside of string literals, comments and the content skipped by the preprocessor is ignored, except for significant line breaks in some statements.

See also the [AST node declarations](../dist/index.d.ts#L110).
${addChapters(chapters)}`
  writeFileSync(join(__dirname, '../doc/grammar.md'), content)
}

function loadDiagrams (diagrams) {
  return diagrams.reduce((diagrams, name) => {
    diagrams[name] = loadDiagram(name)
    return diagrams
  }, {})
}

function loadDiagram (name) {
  const fileName = join(__dirname, `diagrams/${name}.yml`)
  const diagram = load(readFileSync(fileName, 'utf-8'))
  return Diagram.fromJSON(diagram)
}

const sourceFile = loadDiagrams([
  'program'
])

const packageModule = loadDiagrams([
  'package-declaration', 'object-declaration', 'feature-declaration',
  'object-name'
])

const executableScript = loadDiagrams([
  'script-source'
])

const dumpSource = loadDiagrams([
  'dump-source', 'old-feature-addition', 'old-feature-initialization'
])

const scopes = loadDiagrams([
  'script-declaration', 'function-declaration', 'parameters', 'parameter'
])

const statements = loadDiagrams([
  'statement', 'if-statement', 'switch-statement', 'while-statement',
  'repeat-statement', 'for-statement', 'for-each-statement',
  'structured-for-statement', 'break-statement', 'continue-statement',
  'break-if-statement', 'continue-if-statement', 'label-statement',
  'goto-statement', 'return-statement', 'variable-declaration',
  'modifier', 'type'
])

const expressions = loadDiagrams([
  'expression', 'binary-expression', 'unary-expression',
  'member-slice-call-expression', 'primary-expression', 'member-expression',
  'list-expression-or-comprehension', 'list-element'
])

const identifiers = loadDiagrams([
  'identifier',
  'hash-quote',
  'xlate',
  'legacy-alias'
])

const literals = loadDiagrams([
  'literal',
  'string-literal',
  'single-quoted-string-literal',
  'double-quoted-string-literal',
  'back-quoted-string-literal',
  'integer-literal',
  'real-literal',
  'date-literal',
  'boolean-literal',
  'undefined-literal',
  'objref'
])

const comments = loadDiagrams([
  'single-line-comment', 'multi-line-comment'
])

const preprocessorDirectives = loadDiagrams([
  'preprocessor-directive'
])

const otherTokens = loadDiagrams([
  'hexadecimal-number',
  'digit',
  'letter',
  'line-break',
  'white-space'
])

const chapters = {
  sourceFile,
  packageModule,
  executableScript,
  dumpSource,
  scopes,
  statements,
  expressions,
  identifiers,
  literals,
  comments,
  preprocessorDirectives,
  otherTokens
}

mkdirp.sync(join(__dirname, '../doc/diagrams'))
renderDescription(chapters)
