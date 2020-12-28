// ============================================================
// Public API

export function parseText (input: string, options?: Options): Program

export function parseTokens (input: string, tokens: Token[], options?: Options): Program

export function tokenize (input: string, options?: Options): Token[]

export function startTokenization (input: string, options?: Options): Iterator<Token>

export const tokenTypes: TokenTypes

// ---------- Options

export const defaultOptions: Options

export interface Options {
  defines?: { [key: string]: string | number | boolean }
  tokens?: boolean // only for parser
  preprocessor?: boolean
  comments?: boolean
  whitespace?: boolean
  locations?: boolean
  ranges?: boolean
  raw?: boolean
  sourceType?: SourceType
  oldVersion?: boolean
  sourceFile?: string
}

export type SourceType = 'object' | 'script' | 'dump'

// ============================================================
// Error Handling

export interface ParseError extends Error {
  line?: number
  column?: number
  offset?: number
  source?: string
  tokens?: Token[]
}

// ============================================================
// Shared

interface Node {
  type: string
  loc?: SourceLocation
  sourceFile?: string
  range?: Range
}

export interface SourceLocation {
  start: Position
  end: Position
  source?: string | null
}

export interface Position {
  line: number
  column: number
}

export type Range = [number, number]

// ============================================================
// Lexer

export interface Token {
  type: TokenType
  value: null | boolean | number | string
  line: number
  lineStart: number
  lastLine?: number
  lastLineStart?: number
  range: Range
  hashQuote?: boolean // for identifiers
  multiline?: boolean // for comments
  directive?: string // for preprocessor directives
  name?: string // for ifdef, ifndef, define and undef preprocessor directives
  namedValue?: string // for ifdef, ifndef and define preprocessor directives
}

export type TokenType = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 |
2048 | 8192 | 16384 | 32768

export interface TokenTypes {
  EOF: 1
  Whitespace: 2
  Comment: 4
  PreprocessorDirective: 8
  PreprocessedAway: 16
  Punctuator: 32
  Keyword: 64
  Identifier: 128
  StringLiteral: 256
  IntegerLiteral: 512
  BooleanLiteral: 1024
  UndefinedLiteral: 2048
  RealLiteral: 4096
  DateLiteral: 8192
  ObjRef: 16384
  LegacyAlias: 32768
  KeywordOrIdentifier: 64 | 128
  Literal: 256 | 512 | 1024 | 2048 | 4096 | 8182 | 16384
  NoCode: 2 | 4 | 8 | 16
}

// ============================================================
// Parser

export interface Program extends Node {
  type: 'Program'
  body: PackageDeclaration | ScriptSource | DumpSource
  tokens?: Token[] // if tokens are enabled during parsing
}

// ---------- Package

export interface PackageDeclaration extends Node {
  type: 'PackageDeclaration'
  name: ObjectName
  object: ObjectDeclaration
}

export interface ObjectDeclaration extends Node {
  type: 'ObjectDeclaration'
  id: Identifier
  modifier: Modifier
  superObject: ObjectName
  body: Array<FunctionDeclaration | ScriptDeclaration | FeatureDeclaration>
}

export interface FeatureDeclaration extends Node {
  type: 'FeatureDeclaration'
  id: Identifier
  featureType: Type
  modifier?: Modifier
  init?: Literal
}

export interface ObjectName extends Node {
  type: 'ObjectName'
  name: Array<Identifier | LegacyAlias>
}

// ---------- Script

export interface ScriptSource extends Node {
  type: 'ScriptSource'
  body: Array<FunctionDeclaration | Statement>
}

// ---------- Dump

export interface DumpSource extends Node {
  type: 'DumpSource'
  id: Identifier
  parent: ObjRef
  features: FeatureAddition[]
  assignments: FeatureInitialization[]
  scripts: ScriptDeclaration[]
}

export interface FeatureAddition extends Node {
  type: 'FeatureAddition'
  id: Identifier
}

export interface FeatureInitialization extends Node {
  type: 'FeatureInitialization'
  id: Identifier
  value: Literal
}

// ---------- Scopes

export interface ScriptDeclaration extends Node {
  type: 'ScriptDeclaration'
  id: Identifier
  modifier: Modifier
  body: Array<FunctionDeclaration | Statement>
}

export interface FunctionDeclaration extends Node {
  type: 'FunctionDeclaration'
  id: Identifier
  functionType: Type
  modifier?: Modifier
  variadic: boolean
  nodebug: boolean
  params: Parameter[]
  body: Statement[]
}

export interface Parameter extends Node {
  type: 'Parameter'
  id: Identifier
  parameterType: Type
  init?: Expression
}

// ---------- Statements

export type Statement = IfStatement | SwitchStatement | WhileStatement |
RepeatStatement | ForStatement | ForEachStatement | StructuredForStatement |
GotoStatement | ReturnStatement | BreakStatement | BreakIfStatement |
ContinueStatement | ContinueIfStatement | VariableDeclaration |
EmptyStatement | Expression

export interface IfStatement extends Node {
  type: 'IfStatement'
  test: Expression
  consequent: Statement[]
  otherClauses: ElseIfClause
  alternate?: Statement[]
}

export interface ElseIfClause extends Node {
  type: 'ElseIfClause'
  test: Expression
  consequent: Statement[]
}

export interface SwitchStatement extends Node {
  type: 'SwitchStatement'
  discriminant: Expression
  cases: SwitchCase[]
}

export interface SwitchCase extends Node {
  type: 'SwitchCase'
  tests: Expression[]
  consequent: Statement[]
}

export interface WhileStatement extends Node {
  type: 'WhileStatement'
  test: Expression
  body: Statement[]
}

export interface RepeatStatement extends Node {
  type: 'RepeatStatement'
  test: Expression
  body: Statement[]
}

export interface ForStatement extends Node {
  type: 'ForStatement'
  init?: Expression
  test?: Expression
  update?: Expression
  body: Statement[]
}

export interface ForEachStatement extends Node {
  type: 'ForEachStatement'
  left: Identifier
  right: Expression
}

export interface StructuredForStatement extends Node {
  type: 'StructuredForStatement'
  variable: Identifier
  start: Expression
  end: Expression
  step: Expression
  down: boolean
  body: Statement[]
}

export interface BreakStatement extends Node {
  type: 'BreakStatement'
}

export interface ContinueStatement extends Node {
  type: 'ContinueStatement'
}

export interface BreakIfStatement extends Node {
  type: 'BreakIfStatement'
  test: Expression
}

export interface ContinueIfStatement extends Node {
  type: 'ContinueIfStatement'
  test: Expression
}

export interface LabelStatement extends Node {
  type: 'LabelStatement'
  id: Identifier
}

export interface GotoStatement extends Node {
  type: 'GotoStatement'
  label: Identifier
}

export interface ReturnStatement extends Node {
  type: 'ReturnStatement'
  argument: Expression | undefined
}

export interface EmptyStatement extends Node {
  type: 'EmptyStatement'
}

export interface VariableDeclaration extends Node {
  type: 'VariableDeclaration'
  variableType: Type
  declarations: VariableDeclarator[]
}

export interface VariableDeclarator extends Node {
  type: 'VariableDeclarator'
  id: Identifier
  init?: Expression
}

export type Modifier = 'override' | 'public' | 'private'

export type Type = 'Set' | 'List' | 'Date' | 'Long' | 'Real' | 'Void' |
'Assoc' | 'Bytes' | 'Frame' | 'String' | 'Record' | 'Object' |
'Boolean' | 'Integer' | 'Dynamic' | 'RecArray' | 'Error' | 'Regex' |
'Point' | 'HashMap' | 'ObjRef' | 'Script' | 'Socket' | 'File' | 'Dialog' |
'Vis' | 'CAPIERR' | 'CAPILOG' | 'PatFind' | 'WAPIMAP' |
'DOMAttr' | 'DOMNode' | 'DOMText' | 'OTQuery' | 'Compiler' | 'DAPINODE' |
'FileCopy' | 'UAPIUSER' | 'WAPIWORK' | 'OTSearch' | 'CacheTree' |
'CAPILOGIN' | 'FilePrefs' | 'PatChange' | 'SqlCursor' | 'DOMEntity' |
'DOMParser' | 'SAXParser' | 'DAPISTREAM' | 'JavaObject' | 'RestClient' |
'SslOptions' | 'DOMComment' | 'DOMElement' | 'CAPICONNECT' | 'DAPISESSION' |
'DAPIVERSION' | 'MailMessage' | 'POP3Session' | 'SMTPSession' |
'UAPISESSION' | 'WAPISESSION' | 'WAPIMAPTASK' | 'WAPISUBWORK' |
'DOMDocument' | 'DOMNodeList' | 'DOMNotation' | 'IPoolObject' |
'XSLProcessor' | 'SqlConnection' | 'DOMCdataSection' | 'DOMDocumentType' |
'DOMNamedNodeMap' | 'IPoolConnection' | 'DOMCharacterData' |
'IPoolTransaction' | 'DOMImplementation' | 'DOMEntityReference' |
'DOMDocumentFragment' | 'DOMProcessingInstruction'

// ---------- Expressions

export type Expression = BinaryExpression | ConditionalExpression

export interface ConditionalExpression extends Node {
  type: 'ConditionalExpression'
  test: Expression
  consequent: Statement[]
  alternate: Statement[]
}

export interface BinaryExpression extends Node {
  type: 'BinaryExpression'
  operator: BinaryOperator
  left: UnaryExpression | MemberSliceCallExpression
  right: UnaryExpression | MemberSliceCallExpression | BinaryExpression
}

export type BinaryOperator = ArithmeticOperator | BooleanOperator |
BitwiseOperator | LogicalOperator | AssignmentOperator

type ArithmeticOperator = '+' | '-' | '*' | '/' | '%'

type BooleanOperator =
  '==' | '!=' | '<>' | '<' | '<=' | '>' | '>=' |
  'in' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge'

type BitwiseOperator =
  '<<' | '>>' | '|' | '^' | '&'

type LogicalOperator = '||' | '&&' | 'or' | 'and'

type AssignmentOperator =
  '=' | '+=' | '-=' | '*=' | '/=' | '%=' | '~=' | '<<=' | '>>=' |
  '|=' | '^=' | '&='

export interface UnaryExpression extends Node {
  type: 'UnaryExpression'
  operator: UnaryOperator
  argument: UnaryExpression | MemberSliceCallExpression
}

export type UnaryOperator = '-' | '!' | '~' | 'not'

export type MemberSliceCallExpression = PrimaryExpression | MemberExpression |
SliceExpression | CallExpression

export type MemberExpression = SimpleMemberExpression | BoxedMemberExpression

export interface BaseMemberExpression extends Node {
  type: 'MemberExpression'
  object: MemberSliceCallExpression
}

export interface SimpleMemberExpression extends BaseMemberExpression {
  property: Identifier | Literal
}

export interface BoxedMemberExpression extends BaseMemberExpression {
  property: Expression
  boxed: true
}

export interface SliceExpression extends Node {
  type: 'SliceExpression'
  object: MemberSliceCallExpression
  start: Expression
  end: Expression
}

export interface IndexExpression extends Node {
  type: 'IndexExpression'
  object: MemberSliceCallExpression
  index: Expression
}

export interface CallExpression extends Node {
  type: 'CallExpression'
  callee: MemberSliceCallExpression
  arguments: Expression[]
}

export type PrimaryExpression = XlateExpression | ParenthesisExpression |
ThisExpression | SuperExpression | AssocExpression | ListExpression |
ListComprehension | ObjectName | Literal

export interface ThisExpression extends Node {
  type: 'ThisExpression'
}

export interface SuperExpression extends Node {
  type: 'SuperExpression'
}

export interface AssocExpression extends Node {
  type: 'AssocExpression'
  properties: Property[]
}

export interface Property extends Node {
  type: 'Property'
  key: Expression
  value: Expression
}

export interface ListExpression extends Node {
  type: 'ListExpression'
  elements: Expression[]
}

export interface ListComprehension extends Node {
  type: 'ListComprehension'
  expression: AtExpression | Expression
  left: Identifier
  right: Expression
  test?: Expression
}

export interface AtExpression extends Node {
  type: 'AtExpression'
  expression: Expression
}

export interface ParenthesisExpression extends Node {
  type: 'ParenthesisExpression'
  expression: Expression
}

export interface XlateExpression extends Node {
  type: 'XlateExpression'
  ospace: Identifier
  string: Identifier
}

// ---------- Identifier and Literals

export interface Identifier extends Node {
  type: 'Identifier'
  value: string
  raw?: string
}

export interface LegacyAlias extends Node {
  type: 'LegacyAlias'
  value: number
}

export interface Literal extends Node {
  type: 'Literal'
  literalType: LiteralType
  value: string | boolean | number | null
  raw?: string
}

export type LiteralType = 'string' | 'integer' | 'real' | 'date' | 'objref' |
'boolean' | 'undefined'

export interface StringLiteral extends Literal {
  literalType: 'string'
}

export interface IntegerLiteral extends Literal {
  literalType: 'integer'
}

export interface RealLiteral extends Literal {
  literalType: 'real'
}

export interface DateLiteral extends Literal {
  literalType: 'date'
}

export interface ObjRef extends Literal {
  literalType: 'objref'
}

export interface BooleanLiteral extends Literal {
  literalType: 'boolean'
}

export interface UndefinedLiteral extends Literal {
  literalType: 'undefined'
}
