# Changelog

### 0.2.1

Upgrade dependency on oscript-parser.

### 0.2.0

Add initial support for File.

## 0.1.0

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

## 0.0.1

Initial release.

* Command-line tool `osexec`
* Function `interpret`
* Typescript typings
