# oscript-parser

[![NPM version](https://badge.fury.io/js/oscript-parser.png)](http://badge.fury.io/js/oscript-parser)
[![Build Status](https://github.com/prantlf/oscript-parser/workflows/Test/badge.svg)](https://github.com/prantlf/oscript-parser/actions)
[![codecov](https://codecov.io/gh/prantlf/oscript-parser/branch/master/graph/badge.svg)](https://codecov.io/gh/prantlf/oscript-parser)
[![Dependency Status](https://david-dm.org/prantlf/oscript-parser.svg)](https://david-dm.org/prantlf/oscript-parser)
[![devDependency Status](https://david-dm.org/prantlf/oscript-parser/dev-status.svg)](https://david-dm.org/prantlf/oscript-parser#info=devDependencies)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A parser for the [OScript language] written in JavaScript.

## Synopsis

```js
import { parseText } from 'oscript-parser'
const program = parseText('i = 0', { sourceType: 'script' })
console.log(JSON.stringify(program))
```

## Installation

Use your favourite package manager to install this package locally in your Node.js project:

```
npm i oscript-parser
pnpm i oscript-parser
yarn add  oscript-parser
```

If you want to use the executables `osparse` or `oslint` from `PATH`, install this package globally instead.

## API

The OScript AST resembles the [AST for JavaScript], but it includes nodes specific to the OScript syntax. See the [language grammar] and the [AST node declarations].

The OScript language is case-insensitive. Values of keywords and identifiers in tokens and AST nodes (`value` property) are converted lower-case to make comparisons and look-ups more convenient. If you need the original letter-case, enable the raw AST node content (`raw` property) by the `rawIdentifiers` parser option.

### Parser

The output of the parser is an Abstract Syntax Tree (AST) formatted in JSON. The parser functionality is exposed by `parseText()` and `parseTokens()`. The `parseText()` expects an input text. The `startTokenization()` expects an input text with tokens already produced by `tokenize()`.

The available options are:

- `defines: {}` Preprocessor named values. For evaluating preprocessor directives.
- `tokens: false` Include lexer tokens in the output object. Useful for code formatting or partial analysis in case of errors.
- `preprocessor: false` Include tokens of preprocessor directives and the content skipped by the preprocessor. Useful for code formatting.
- `comments: false` Include comment tokens in the output of parsing
  or lexing. Useful for code formatting.
- `whitespace: false` Include whitespace tokens in the output of parsing
  or lexing. Useful for code formatting.
- `locations: false` Store location information on each parsed node.
- `ranges: false` Store the start and end character locations on each parsed node.
- `raw: false` Store the raw original of identifiers and literals.
- `rawIdentifiers: false` Store the raw original of identifiers only.
- `rawLiterals: false` Store the raw original of literals only.
- `sourceType: 'script'` Set the source type to `object`, `script` or `dump`
  (the old object format).
- `oldVersion: undefined` Expect the old version of the OScript language.
- `sourceFile: 'snippet'` File name to refer in source locations to.

The default options are also exposed through `defaultOptions` where
they can be overridden globally.

```js
import { parseText } from 'oscript-parser'
const program = parseText('foo = "bar"', { sourceType: 'script' })
// { type: "Program",
//   body:
//     [{ type: "AssignmentStatement",
//        variables: [{ type: "Identifier", value: "foo" }],
//        init: [{ type: "StringLiteral", value: "bar" }]
//     }]
// }
```

### Lexer

The lexer can be used independently of the parser. The lexer functionality is exposed by `tokenize()` and `startTokenization()`. The `tokenize()` will return an array of tokens. The `startTokenization()` will return a generator advancing to the next token up until `EOF` is reached. The `EOF` itself will not be returned as a token. The options are the same as for the method `parse()`, except for `tokens`, which will be ignored.

Each token consists of:

- `type` expressed as an enum flag which can be matched with `tokenTypes`.
- `value`
- `line`, `lineStart`
- `range` can be used to slice out the raw token content. For example, `foo = "bar"` will return a `StringLiteral` token with the value `bar`. Slicing out the range on the other
hand will return `"bar"`.

```js
import { tokenize } from 'oscript-parser'
const tokens = tokenize('foo = "bar"', { sourceType: 'script' })
// [{ type: 8, value: "foo", line: 1, lineStart: 0, range: [0, 3] }
//  { type: 32, value: "=", line: 1, lineStart: 0, range: [4, 5]}
//  { type: 2, value: "bar", line: 1, lineStart: 0, range: [6, 11] }]
```

Tokens can be consumed incrementally by an iterator:

```js
import { startTokenization } from 'oscript-parser'
const iterator = startTokenization('foo = "bar"', { sourceType: 'script' })
iterator.next() // { value: { type: 8, value: "foo", line: 1, range: [0, 3] } }
iterator.next() // { value: { type: 32, value: "=", line: 1, range: [4, 5]} }
iterator.next() // { value: { type: 2, value: "bar", line: 1, range: [6, 11] } }
iterator.next() // { done: true }
```

## Tools

### osparse(1)

The `osparse` executable can be used from the shell by installing `oscript-parser` globally using `npm`:

```
$ npm i -g oscript-parser
$ osparse -h

Usage: osparse [option...] [file]

Options:
  --[no]-tokens           include lexer tokens. defaults to false
  --[no]-preprocessor     include preprocessor directives. defaults to false
  --[no]-comments         include comments. defaults to false
  --[no]-whitespace       include whitespace. defaults to false
  --[no]-locations        store location of parsed nodes. defaults to false
  --[no]-ranges           store start and end token ranges. defaults to false
  --[no]-raw              store raw identifiers & literals. defaults to false
  --[no]-raw-identifiers  store raw identifiers & literals. defaults to false
  --[no]-raw-literals     store raw identifiers & literals. defaults to false
  --[no]-context          show near source as error context. defaults to true
  --[no]-colors           enable colors in the terminal. default is auto
  -D|--define <name>      define a named value for preprocessor
  -S|--source <type>      source type is object, script (default) or dump
  -O|--old-version        expect an old version of OScript. defaults to false
  -t|--tokenize           print tokens instead of AST
  -c|--compact            print without indenting and whitespace
  -w|--warnings           consider warnings as failures too
  -s|--silent             suppress output
  -v|--verbose            print error stacktrace
  -p|--performance        print parsing timing
  -V|--version            print version number
  -h|--help               print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e" -> script, ".osx" -> dump. The source type object will enable the new
OScript language and source type dump the old one by default.

Examples:
  echo 'foo = "bar"' | osparse --no-comments -S script
  osparse -t foo.os
```

Example usage:

```
$ echo "i = 0" | osparse -c -S script

{"type":"Program","body":[{"type":"AssignmentStatement",
 "variables":[{"type":"Identifier","value":"i"}],
 "init":[{"type":"NumericLiteral","value":0}]}]}
```

### oslint(1)

The `oslint` executable can be used in the shell by installing `oscript-parser` globally using `npm`:

```
$ npm i -g oscript-parser
$ oslint -h

Usage: oslint [option...] [pattern ...]

Options:
  --[no]-context      show near source as error context. defaults to true
  --[no]-colors       enable colors in the terminal. default is auto
  -D|--define <name>  define a named value for preprocessor
  -S|--source <type>  source type is object, script (default) or dump
  -O|--old-version    expect an old version of OScript. defaults to false
  -e|--errors-only    print only files that failed the check
  -w|--warnings       consider warnings as failures too
  -s|--silent         suppress output
  -v|--verbose        print error stacktrace
  -p|--performance    print parsing timing
  -V|--version        print version number
  -h|--help           print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e" -> script, ".osx" -> dump. The source type object will enable the new
OScript language and source type dump the old one by default.

Examples:
  echo 'foo = "bar"' | oslint -S script
  oslint -t foo.os
```

Example usage:

```
$ echo "i = 0" | oslint
snippet succeeded
```

### Error Handling

If tokenizing or parsing fails, a non-zero exit code will be returned by either of `osparse` and `oslint` and the error with an extra context will be printed on the console. For example, after deleting an equal sign (`=`) from [example.os]:

<!--
$ oslint example.os

example.os failed with 1 error and 0 warnings
example.os:7:28: error: modifier, type, function, script or end expected near 'public'
 5｜
 6｜ public object Document inherits CORE::Node
 7｜  override Boolean fEnabled TRUE
  ｜                            ~~~~
 8｜
 9｜  // Gets a livelink document
```
-->
<pre>
<span style="font-weight:bold;color:gray;">$ oslint example.os</span>

example.os <span style="font-weight:bold;color:red;">failed</span> with 1 error and 0 warnings
<span style="font-weight:bold;color:gray;">example.os:7:28: </span><span style="font-weight:bold;color:red;">error: </span><span style="font-weight:bold;color:gray;">&lt;modifier&gt;, &lt;type&gt;, function, script or end expected near 'public'</span>
 5｜
 6｜ public object Document inherits CORE::Node
 <span style="font-weight:bold;color:teal;">7</span>｜  override Boolean fEnabled <span style="font-weight:bold;color:teal;">TRUE</span>
  ｜                            <span style="font-weight:bold;color:teal;">~~~~</span>
 8｜
 9｜  // Gets a livelink document
</pre>

All output of `oslint` goes to standard output. For `osparse`, the result AST goes to standard output and error and timing information to standard error.

## License

Copyright (c) 2020 Ferdinand Prantl

Licensed under the MIT license.

[AST for JavaScript]: https://github.com/estree/estree#readme
[OScript language]: ./doc/grammar.md#oscript-language-grammar
[language grammar]: ./doc/grammar.md#oscript-language-grammar
[AST node declarations]: ./dist/index.d.ts#L110
[example.os]: https://github.com/prantlf/vscode-oscript/blob/master/pkg/examples/example.os
