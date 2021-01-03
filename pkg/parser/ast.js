import {
  StringLiteral, IntegerLiteral, RealLiteral, DateLiteral, BooleanLiteral,
  UndefinedLiteral
} from './tokens'

export default {
  program (body) {
    return { type: 'Program', body }
  },

  packageDeclaration (name, object) {
    return { type: 'PackageDeclaration', name, object }
  },

  scriptSource (body) {
    return { type: 'ScriptSource', body }
  },

  dumpSource (id, parent, fatures, assignments, scripts) {
    return { type: 'DumpSource', id, parent, fatures, assignments, scripts }
  },

  featureAddition (id) {
    return { type: 'FeatureAddition', id }
  },

  featureInitialization (id, value) {
    return { type: 'FeatureInitialization', id, value }
  },

  objectDeclaration (id, modifier, superObject, body) {
    return { type: 'ObjectDeclaration', modifier, id, superObject, body }
  },

  featureDeclaration (id, featureType, modifier, init) {
    return { type: 'FeatureDeclaration', id, featureType, modifier, init }
  },

  scriptDeclaration (id, modifier, body) {
    return { type: 'ScriptDeclaration', id, modifier, body }
  },

  objectName (name) {
    return { type: 'ObjectName', name }
  },

  xlateExpression (ospace, string) {
    return { type: 'XlateExpression', ospace, string }
  },

  identifier (value, raw) {
    return { type: 'Identifier', value, raw }
  },

  legacyAlias (value, raw) {
    return { type: 'LegacyAlias', value, raw }
  },

  literal (type, value, raw) {
    const literalType = type === StringLiteral
      ? 'string'
      : type === IntegerLiteral
        ? 'integer'
        : type === BooleanLiteral
          ? 'boolean'
          : type === UndefinedLiteral
            ? 'undefined'
            : type === RealLiteral
              ? 'real'
              : type === DateLiteral
                ? 'date'
                : 'objref'
    return { type: 'Literal', literalType, value, raw }
  },

  functionDeclaration (id, functionType, modifier, params, variadic, nodebug, body) {
    return { type: 'FunctionDeclaration', id, functionType, modifier, variadic, nodebug, params, body }
  },

  parameter (id, parameterType, init) {
    return { type: 'Parameter', id, parameterType, init }
  },

  emptyStatement () {
    return { type: 'EmptyStatement' }
  },

  labelStatement (id) {
    return { type: 'LabelStatement', id }
  },

  variableDeclaration (variableType, declarations) {
    return { type: 'VariableDeclaration', variableType, declarations }
  },

  variableDeclarator (id, init) {
    return { type: 'VariableDeclarator', id, init }
  },

  conditionalExpression (test, consequent, alternate) {
    return { type: 'ConditionalExpression', test, consequent, alternate }
  },

  breakStatement () {
    return { type: 'BreakStatement' }
  },

  continueStatement () {
    return { type: 'ContinueStatement' }
  },

  breakIfStatement (test) {
    return { type: 'BreakIfStatement', test }
  },

  continueIfStatement (test) {
    return { type: 'ContinueIfStatement', test }
  },

  gotoStatement (label) {
    return { type: 'GotoStatement', label }
  },

  returnStatement (argument) {
    return { type: 'ReturnStatement', argument }
  },

  ifStatement (test, consequent, otherClauses, alternate) {
    return { type: 'IfStatement', test, consequent, otherClauses, alternate }
  },

  elseifClause (test, consequent) {
    return { type: 'ElseIfClause', test, consequent }
  },

  switchStatement (discriminant, cases) {
    return { type: 'SwitchStatement', discriminant, cases }
  },

  switchCase (tests, consequent) {
    return { type: 'SwitchCase', tests, consequent }
  },

  whileStatement (test, body) {
    return { type: 'WhileStatement', test, body }
  },

  repeatStatement (test, body) {
    return { type: 'RepeatStatement', test, body }
  },

  thisExpression () {
    return { type: 'ThisExpression' }
  },

  superExpression () {
    return { type: 'SuperExpression' }
  },

  forStatement (init, test, update, body) {
    return { type: 'ForStatement', init, test, update, body }
  },

  forEachStatement (left, right, body) {
    return { type: 'ForEachStatement', left, right, body }
  },

  structuredForStatement (variable, start, end, down, step, body) {
    return { type: 'StructuredForStatement', variable, start, end, down, step, body }
  },

  listExpression (elements) {
    return { type: 'ListExpression', elements }
  },

  listComprehension (expression, left, right, test) {
    return { type: 'ListComprehension', expression, left, right, test }
  },

  atExpression (expression) {
    return { type: 'AtExpression', expression }
  },

  assocExpression (properties) {
    return { type: 'ObjectExpression', properties }
  },

  property (key, value) {
    return { type: 'Property', key, value }
  },

  parenthesisExpression (expression) {
    return { type: 'ParenthesisExpression', expression }
  },

  binaryExpression (operator, left, right) {
    return { type: 'BinaryExpression', operator, left, right }
  },

  unaryExpression (operator, argument) {
    return { type: 'UnaryExpression', operator, argument }
  },

  memberExpression (object, property, boxed) {
    return { type: 'MemberExpression', object, property, boxed }
  },

  sliceExpression (object, start, end) {
    return { type: 'SliceExpression', object, start, end }
  },

  indexExpression (object, index) {
    return { type: 'IndexExpression', object, index }
  },

  callExpression (callee, args) {
    return { type: 'CallExpression', callee, arguments: args }
  }
}
