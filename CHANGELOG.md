# Changelog

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
