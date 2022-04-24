# OScript AST Interpreter

[![NPM version](https://badge.fury.io/js/oscript-interpreter.png)](http://badge.fury.io/js/oscript-ast-walker)

A interpreter of the [OScript language] using the [abstract syntax tree] (AST). The AST can be produced by the [oscript-parser].

This project is still a work in progress. It includes neither VM nor database. It can be used to test code in scripts that depends only on global functions like `Echo` or objects like `Str`.

## Synopsis

```js
import { parseText } from 'oscript-parser'
import { interpret } from 'oscript-interpreter'

const source = 'Echo("Test")'
interpret(parseText(source, { sourceType: 'script' })) // prints "Test"
```

## Installation

Use your favourite package manager to install this package locally in your Node.js project:

```
npm i oscript-interpreter
pnpm i oscript-interpreter
yarn add  oscript-interpreter
```

## Interface

**interpret**`(ast, options)` interprets the `ast` and performs operations described by the nodes of the [AST]. The option `globals` can be an object with variables and functions which will be inserted to the global scope. Keys of the object are supposed to be identifiers and values are supposed to be variable values or functions.  The option `warnings` can be a boolean flag to enable treating problems, which the interpreter can recover from as errors and fail the ecxecution.

```js
import { parseText } from 'oscript-parser'
import { interpret } from 'oscript-interpreter'

const source = 'Echo("Test")'
interpret(parseText(source, { sourceType: 'script' })) // prints "Test"
```

## Tools

### osexec(1)

The `osexec` executable can be used from the shell by installing `oscript-interpreter` globally using `npm`:

```
$ npm i -g oscript-interpreter
$ osparse -h

Usage: osparse [option...] [file]

Options:
  --[no]-context          show near source as error context. defaults to true
  --[no]-colors           enable colors in the terminal. default is auto
  -D|--define <name>      define a named value for preprocessor
  -S|--source <type>      source type is object, script (default) or dump
  -O|--old-version        expect an old version of OScript. defaults to false
  -w|--warnings           consider warnings as failures too
  -s|--silent             suppress error output
  -v|--verbose            print error stacktrace
  -p|--performance        print parsing timing
  -V|--version            print version number
  -h|--help               print usage instructions

If no file name is provided, standard input will be read. If no source type
is provided, it will be inferred from the file extension: ".os" -> object,
".e|lxe" -> script, ".osx" -> dump. The source type object will enable the
new OScript language and source type dump the old one by default.

Examples:
  echo 'echo("foo")' | osexec -S script
  osexec -w foo.e
```

Example usage:

```
$ echo "echo("foo")" | osexec -S script

foo
```

## License

Copyright (c) 2021-2022 Ferdinand Prantl

Licensed under the MIT license.

[OScript language]: https://github.com/prantlf/oscript-parser/blob/master/doc/grammar.md#oscript-language-grammar
[abstract syntax tree]: https://github.com/prantlf/oscript-parser/blob/master/dist/index.d.ts#L115
[AST]: https://github.com/prantlf/oscript-parser/blob/master/dist/index.d.ts#L115
[oscript-parser]: https://github.com/prantlf/oscript-parser#readme
