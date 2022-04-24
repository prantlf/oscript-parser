# Changelog

## 0.2.6

Recognise lxe as a script extension

### Interpreter 0.2.0

Add initial support for File.

## 0.2.5

### Parser

* Allow dereferencing `this` without the `this` keyword (chain the dot operators).
* Correct typings for `SliceExpression`.
* Nest the binary expressions according to the binary operator precedence.

### Walker 0.1.0

If the recursive walker fails, include the latest visited node in the error.

### Interpreter 0.1.0

* Ignore the imaginary operator `^^`, recognise the existing one `||`.
* Fix built-in object method lookup.
* Set default values to declared variables.
* Introduce built-in objects `Assoc`, `List` and `Regex`.
* Add runtime type checking to the built-in functions and object methods.
* Include the last interpreted node in the runtime error report.
* Inline the preparation of AST from an extra preprocessing step to the interpretation phase.

**BREAKING CHANGE**: The second parameters of `interpret` is an object with options. The parameter `globals` has been moved to a property in the `options` object.

```js
// old syntax
interpret(ast, { count: 1 })
// new syntax
interpret(ast, { globals: { count: 1 } })
```

## 0.2.4

### Parser

Remove the operator `~=` that does not exist.

### Walker 0.0.3

Skip omitted nodes `for.init`, `slice.start` and `slice.end` expressions during walking.

### Interpreter 0.0.1

Initial release.

## 0.2.3

Fix parsing of an incomplete `switch` statement.

## 0.2.2

### Parser

Fix parsing of the member expression without the explicit `this` object.

### Walker 0.0.2

* Recognize `ObjectExpression` as `AssocExpression` for compatibility.
* Fix walking of `consequent` and `alternate` of `ConditionalExpression`.

## 0.2.1

Fix parsing of the `switch` statement.

## 0.2.0

### New Features

* Allow storing raw content not only for literals, but for identifiers too.
* Let warning fail the syntax check too, if requested by `-w|--warnings`.
* Use colours in the console output.
* Print error context for parsing failures, for exaample:

    $ oslint example.os

    example.os failed with 1 error and 0 warnings
    example.os:7:28: error: modifier, type, function, script or end expected near 'public'
     5｜
     6｜ public object Document inherits CORE::Node
     7｜  override Boolean fEnabled TRUE
      ｜                            ~~~~
     8｜
     9｜  // Gets a livelink document

### Fixed Bugs

* Correct parsed node and error locations.
* Correct typings for AST nodes.

### Walker 0.0.1

Initial release.

## 0.1.0

Include a new property `warnings` in the parser output or error, which will contain an array of warnings. A warning is a mistake in the source code, which is not fatal (and will be compiled and executed properly), but which is against the modern language specification. Warn  about:

* A line break in a single-line string
* A backslash not followed by a whitespace
* A `ifdef` or `ifndef` preprocessor directive without a name identifier following it
* An object declared with other modifier than `public`
* A preprocessor directive followed by non-whitespace characters
* A semicolon following feature, function or script declaration
* A missing line break or semicolon after an empty c-like for statement before the end keyword

## 0.0.1

Initial release.

* Command-line tools `osparse` and `oslint`
* Functions `parseText`, `parseTokens`, `tokenize` and `startTokenization`
* Typescript typings
