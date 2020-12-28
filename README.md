# oscript-parser

A parser for the [OScript langauge] written in JavaScript.

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
- `locations: false` Store location information on each syntax node.
- `ranges: false` Store the start and end character locations on each syntax node.
- `raw: false` Store the raw original of literals.
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
//        variables: [{ type: "Identifier", name: "foo", raw: "foo" }],
//        init: [{ type: "StringLiteral", value: "bar", raw: "\"bar\""}]
//     }]
// }
```

The OScript AST resembles the [AST for JavaScript], but it includes nodes specific to the OScript syntax. See the [language grammar] and the [AST node declarations].

### Lexer

The lexer can be used independently of the parser. The lexer functionality is exposed by `tokenize()` and `startTokenization()`. The `tokenize()` will return an array of tokens. The `startTokenization()` will return a generator advancing to the next token up until `EOF` is reached. The `EOF` itself will not be returned as a token. The options are the same as for the method `parse()`, except for `tokens`, which will be ignored.

Each token consists of:

- `type` expressed as an enum flag which can be matched with `tokenTypes`.
- `value`
- `line`, `lineStart`
- `range` can be used to slice out raw values, eg. `foo = "bar"` will return a
`StringLiteral` token with the value `bar`. Slicing out the range on the other
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
  --[no]-tokens        include lexer tokens. defaults to false
  --[no]-preprocessor  include preprocessor directives. defaults to false
  --[no]-comments      include comments. defaults to false
  --[no]-whitespace    include whitespace. defaults to false
  --[no]-locations     store location data on syntax nodes. defaults to false
  --[no]-ranges        store start and end token ranges. defaults to false
  --[no]-raw           store raw literals. defaults to false
  -D|--define <name>   define a named value for preprocessor
  -S|--source <type>   source type is object, script (default) or dump
  -O|--old-version     expect the old version of OScript. defaults to false
  -t|--tokenize        print tokens instead of AST
  -c|--compact         print without indenting and whitespace
  -s|--silent          suppress output
  -v|--verbose         print error stacktrace
  -p|--performance     print parsing timing
  -V|--version         print version number
  -h|--help            print usage instructions

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
 "variables":[{"type":"Identifier","name":"i"}],
 "init":[{"type":"NumericLiteral","value":0,"raw":"0"}]}]}
```

### oslint(1)

The `oslint` executable can be used in the shell by installing `oscript-parser` globally using `npm`:

```
$ npm i -g oscript-parser
$ oslint -h

Usage: oslint [option...] [pattern ...]

Options:
  -D|--define <name>  define a named value for preprocessor
  -S|--source <type>  source type is object, script (default) or dump
  -O|--old-version    expect the old version of OScript. defaults to false
  -e|--errors-only    print only files that failed the check
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

## License

Copyright (c) 2020 Ferdinand Prantl

Licensed under the MIT license.

[AST for JavaScript]: https://github.com/estree/estree#readme
[OScript langauge]: ./doc/grammar.md#oscript-language-grammar
[language grammar]: ./doc/grammar.md#oscript-language-grammar
[AST node declarations]: ./dist/index.d.ts#L110
