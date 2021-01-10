# Changelog

## 0.2.3

### Parser

Remove the operator `~=` that does not exist.

### Walker 0.0.3

Skip omitted nodes `for.init`, `slice.start` and `slice.end` expressions during walking.

### Interpreter 0.0.1

Initial release.

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
