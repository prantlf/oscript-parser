# OScript Language Grammar

OScript is case-insensitive. Letters in the diagrams below are lower-case for simplicity, but they may appear upper-case too.

All white space outside of string literals, comments and the content skipped by the preprocessor is ignored, except for significant line breaks in some statements.

See also the [AST node declarations](../dist/index.d.ts#L110).

## Source File

### Program

![Program](diagrams/program.svg)

## Package Module

### PackageDeclaration

![PackageDeclaration](diagrams/package-declaration.svg)

### ObjectDeclaration

![ObjectDeclaration](diagrams/object-declaration.svg)

### FeatureDeclaration

![FeatureDeclaration](diagrams/feature-declaration.svg)

### ObjectName

![ObjectName](diagrams/object-name.svg)

## Executable Script

### ScriptSource

![ScriptSource](diagrams/script-source.svg)

## Dump Source

### DumpSource

![DumpSource](diagrams/dump-source.svg)

### OldFeatureAddition

![OldFeatureAddition](diagrams/old-feature-addition.svg)

### OldFeatureInitialization

![OldFeatureInitialization](diagrams/old-feature-initialization.svg)

## Scopes

### ScriptDeclaration

![ScriptDeclaration](diagrams/script-declaration.svg)

### FunctionDeclaration

![FunctionDeclaration](diagrams/function-declaration.svg)

### Parameters

![Parameters](diagrams/parameters.svg)

### Parameter

![Parameter](diagrams/parameter.svg)

## Statements

### Statement

![Statement](diagrams/statement.svg)

### IfStatement

![IfStatement](diagrams/if-statement.svg)

### SwitchStatement

![SwitchStatement](diagrams/switch-statement.svg)

### WhileStatement

![WhileStatement](diagrams/while-statement.svg)

### RepeatStatement

![RepeatStatement](diagrams/repeat-statement.svg)

### ForStatement

![ForStatement](diagrams/for-statement.svg)

### ForEachStatement

![ForEachStatement](diagrams/for-each-statement.svg)

### StructuredForStatement

![StructuredForStatement](diagrams/structured-for-statement.svg)

### BreakStatement

![BreakStatement](diagrams/break-statement.svg)

### ContinueStatement

![ContinueStatement](diagrams/continue-statement.svg)

### BreakIfStatement

![BreakIfStatement](diagrams/break-if-statement.svg)

### ContinueIfStatement

![ContinueIfStatement](diagrams/continue-if-statement.svg)

### LabelStatement

![LabelStatement](diagrams/label-statement.svg)

### GotoStatement

![GotoStatement](diagrams/goto-statement.svg)

### ReturnStatement

![ReturnStatement](diagrams/return-statement.svg)

### VariableDeclaration

![VariableDeclaration](diagrams/variable-declaration.svg)

### Modifier

![Modifier](diagrams/modifier.svg)

### Type

![Type](diagrams/type.svg)

## Expressions

### Expression

![Expression](diagrams/expression.svg)

### BinaryExpression

![BinaryExpression](diagrams/binary-expression.svg)

### UnaryExpression

![UnaryExpression](diagrams/unary-expression.svg)

### MemberSliceCallExpression

![MemberSliceCallExpression](diagrams/member-slice-call-expression.svg)

### PrimaryExpression

![PrimaryExpression](diagrams/primary-expression.svg)

### MemberExpression

![MemberExpression](diagrams/member-expression.svg)

### ListExpressionOrComprehension

![ListExpressionOrComprehension](diagrams/list-expression-or-comprehension.svg)

### ListElement

![ListElement](diagrams/list-element.svg)

## Identifiers

### Identifier

![Identifier](diagrams/identifier.svg)

### HashQuote

![HashQuote](diagrams/hash-quote.svg)

### Xlate

![Xlate](diagrams/xlate.svg)

### LegacyAlias

![LegacyAlias](diagrams/legacy-alias.svg)

## Literals

### Literal

![Literal](diagrams/literal.svg)

### StringLiteral

![StringLiteral](diagrams/string-literal.svg)

### SingleQuotedStringLiteral

![SingleQuotedStringLiteral](diagrams/single-quoted-string-literal.svg)

### DoubleQuotedStringLiteral

![DoubleQuotedStringLiteral](diagrams/double-quoted-string-literal.svg)

### BackQuotedStringLiteral

![BackQuotedStringLiteral](diagrams/back-quoted-string-literal.svg)

### IntegerLiteral

![IntegerLiteral](diagrams/integer-literal.svg)

### RealLiteral

![RealLiteral](diagrams/real-literal.svg)

### DateLiteral

![DateLiteral](diagrams/date-literal.svg)

### BooleanLiteral

![BooleanLiteral](diagrams/boolean-literal.svg)

### UndefinedLiteral

![UndefinedLiteral](diagrams/undefined-literal.svg)

### Objref

![Objref](diagrams/objref.svg)

## Comments

### SingleLineComment

![SingleLineComment](diagrams/single-line-comment.svg)

### MultiLineComment

![MultiLineComment](diagrams/multi-line-comment.svg)

## Preprocessor Directives

### PreprocessorDirective

![PreprocessorDirective](diagrams/preprocessor-directive.svg)

## Other Tokens

### HexadecimalNumber

![HexadecimalNumber](diagrams/hexadecimal-number.svg)

### Digit

![Digit](diagrams/digit.svg)

### Letter

![Letter](diagrams/letter.svg)

### LineBreak

![LineBreak](diagrams/line-break.svg)

### WhiteSpace

![WhiteSpace](diagrams/white-space.svg)
