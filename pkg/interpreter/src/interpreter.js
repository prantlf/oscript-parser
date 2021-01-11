import Scope from './scope'
import getDefaultValue from './defaults'

const push = Array.prototype.push

class InterpreterError extends Error {}
class NotImplementedError extends InterpreterError {}
class RuntimeError extends InterpreterError {
  constructor (message, node) {
    super(message)
    this.node = node
  }
}

function ignore () {}

let warnings

export function setOptions (options = {}) {
  ({ warnings } = options)
}

export const visitors = {}

// ---------- Program

visitors.Program = (node, scope, walk) => walk(node.body, node, scope)

// ---------- Package

visitors.PackageDeclaration = () => {
  throw new NotImplementedError('package is not implemented')
}

visitors.ObjectName = (node, scope) => {
  let { raw } = node
  if (!raw) raw = prepareObjectName(node)
  return scope.get(raw)
}

// ---------- Script

visitors.ScriptSource = (node, scope, walk) => {
  if (!node.statements) prepareScript(node)
  for (const routine of node.routines) walk(routine, node, scope)
  for (const variable of node.variables) walk(variable, node, scope)
  for (const statement of node.statements) walk(statement, node, scope)
}

// ---------- Dump

visitors.DumpSource = () => {
  throw new NotImplementedError('dump is not implemented')
}

// ---------- Scopes

visitors.ScriptDeclaration = (node, scope) => {
  if (!node.statements) prepareScript(node)
  scope.setOwn(node.id.value, node)
}

visitors.FunctionDeclaration = (node, scope) => {
  if (!node.statements) prepareFunction(node)
  scope.setOwn(node.id.value, node)
}

// ---------- Statements

visitors.IfStatement = (node, scope, walk) => {
  if (walk(node.test, node, scope)) {
    for (const statement of node.consequent) walk(statement, node, scope)
  } else {
    if (tryElseIfClauses(node.otherClauses, scope, walk)) return
    for (const statement of node.alternate) walk(statement, node, scope)
  }
}

function tryElseIfClauses (otherClauses, scope, walk) {
  for (const otherClause of otherClauses) {
    if (walk(otherClause.test, otherClause, scope)) {
      for (const statement of otherClause.consequent) walk(statement, otherClause, scope)
      return true
    }
  }
}

visitors.SwitchStatement = (node, scope, walk) => {
  const discriminant = walk(node.discriminant, node, scope)
  node.cases.some(switchCase => trySwitchCase(discriminant, switchCase, scope, walk))
}

function trySwitchCase (discriminant, node, scope, walk) {
  if (!node.tests || node.tests.some(test => walk(test, node, scope) === discriminant)) {
    for (const statement of node.consequent) walk(statement, node, scope)
    return true
  }
}

visitors.WhileStatement = (node, scope, walk) => {
  while (walk(node.test, node, scope)) {
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
  }
}

visitors.RepeatStatement = (node, scope, walk) => {
  do {
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
  } while (walk(node.test, node, scope))
}

visitors.ForStatement = (node, scope, walk) => {
  for (node.init && walk(node.init, node, scope);
    !node.test || walk(node.test, node, scope);
    node.update && walk(node.update, node, scope)) {
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
  }
}

visitors.ForEachStatement = (node, scope, walk) => {
  const name = node.left.value
  for (const item of walk(node.right, node, scope)) {
    scope.set(name, item)
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
  }
}

visitors.StructuredForStatement = (node, scope, walk) => {
  const name = node.variable.value
  let index = walk(node.start, node, scope)
  const end = walk(node.end, node, scope)
  const step = node.step ? walk(node.step, node, scope) : 1
  for (scope.set(name, index); index < end;) {
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
    scope.set(name, node.down ? index -= step : index += step)
  }
}

visitors.BreakStatement = (node, scope) => { scope.break = true }

visitors.ContinueStatement = (node, scope) => { scope.continue = true }

visitors.BreakIfStatement = (node, scope, walk) => {
  scope.break = walk(node.test, node, scope)
}

visitors.ContinueIfStatement = (node, scope, walk) => {
  scope.continue = walk(node.test, node, scope)
}

visitors.GotoStatement = (node, scope, walk) => {
  throw new NotImplementedError('goto is not implemented')
}

visitors.LabelStatement = visitors.EmptyStatement = ignore

visitors.ReturnStatement = (node, scope, walk) => {
  if (node.argument) scope.result = walk(node.argument, node, scope)
}

visitors.VariableDeclaration = (node, scope, walk) => {
  for (const declaration of node.declarations) {
    const { init } = declaration
    scope.setOwn(declaration.id.value,
      init ? walk(init, declaration, scope) : getDefaultValue(node.variableType))
  }
}

// ---------- Expressions

visitors.ConditionalExpression = (node, scope, walk) => {
  return walk(node.test, node, scope)
    ? walk(node.consequent, node, scope)
    : walk(node.alternate, node, scope)
}

visitors.BinaryExpression = (node, scope, walk) => {
  const { left, operator, right } = node
  let target
  if (isAssignment(operator)) {
    // TODO: Implement other left operands than an identifier.
    target = getName(left)
    if (!target) throw new RuntimeError('assignment target is not a variable', left)
  } else {
    target = walk(left, node, scope)
  }
  return binaryOperation[operator](target, walk(right, node, scope), scope, left)
}

function isAssignment (symbol) {
  return symbol === '=' ||  symbol === '+=' || symbol === '-=' ||
    symbol === '*=' || symbol === '&=' || symbol === '|=' || symbol === '^='
}

function getName (node) {
  const { type } = node
  return type === 'Identifier'
    ? node.value
    : type === 'ObjectName' || type === 'LegacyAlias'
      ? node.raw
      : undefined
}

function setVariable (name, value, scope, target) {
  if (!scope.set(name, value)) {
    if (warnings) throw new RuntimeError('variable not declared', target)
    scope.setOwn(name, value)
  }
}

const binaryOperation = {
  '=': (left, right, scope, target) => setVariable(left, right, scope, target),
  '+': (left, right) => left + right,
  '-': (left, right) => left - right,
  '*': (left, right) => left * right,
  '/': (left, right) => left / right,
  '<': (left, right) => left < right,
  '>': (left, right) => left > right,
  '%': (left, right) => left % right,
  '&': (left, right) => left & right,
  '|': (left, right) => left | right,
  '^': (left, right) => left ^ right,
  '==': (left, right) => left === right,
  '!=': (left, right) => left !== right,
  '<>': (left, right) => left !== right,
  '<=': (left, right) => left <= right,
  '>=': (left, right) => left >= right,
  '&&': (left, right) => left && right,
  '||': (left, right) => left || right,
  in: (left, right) => left in right,
  '+=': (left, right, scope, target) => setVariable(left, scope.get(left) + right, scope, target),
  '-=': (left, right, scope, target) => setVariable(left, scope.get(left) - right, scope, target),
  '*=': (left, right, scope, target) => setVariable(left, scope.get(left) * right, scope, target),
  '&=': (left, right, scope, target) => setVariable(left, scope.get(left) & right, scope, target),
  '|=': (left, right, scope, target) => setVariable(left, scope.get(left) | right, scope, target),
  '^=': (left, right, scope, target) => setVariable(left, scope.get(left) ^ right, scope, target),
  '<<': (left, right) => left << right,
  '>>': (left, right) => left >> right,
  or: (left, right) => left || right,
  eq: (left, right) => left === right,
  ne: (left, right) => left !== right,
  lt: (left, right) => left < right,
  le: (left, right) => left <= right,
  gt: (left, right) => left > right,
  ge: (left, right) => left >= right,
  and: (left, right) => left && right,
  xor: (left, right) => !!(left ^ right)
}

visitors.UnaryExpression = (node, scope, walk) =>
  unaryOperation[node.operator](walk(node.argument, node, scope))

const unaryOperation = {
  '!': value => !value,
  '+': value => value,
  '-': value => -value,
  '~': value => ~value,
  not: value => !value
}

visitors.MemberExpression = (node, scope, walk) => {
  const object = walk(node.object, node, scope)
  if (!object) throw new RuntimeError('object is undefined', node.object)
  if (!(typeof object === 'object' && object && !Array.isArray(object))) {
    throw new RuntimeError(`dereferenced source (${typeof array}) is not an object or assoc`, node.object)
  }
  let { property } = node
  const { type } = property
  property = type === 'Identifier' || type === 'LegacyAlias'
    ? property.value
    : walk(node.property, node, scope)
  return object[property]
}

visitors.SliceExpression = (node, scope, walk) => {
  const array = walk(node.object, node, scope)
  if (!array) throw new RuntimeError('slice source is undefined', node.object)
  if (!(typeof array === 'string' || Array.isArray(array))) {
    throw new RuntimeError(`slice source (${typeof array}) is not a list or string`, node.object)
  }
  const start = (node.start && walk(node.start, node, scope)) || 0
  const end = (node.end && walk(node.end, node, scope)) || array.length
  return array.slice(start, end)
}

visitors.IndexExpression = (node, scope, walk) => {
  const array = walk(node.object, node, scope)
  if (!array) throw new RuntimeError('index source is undefined', node.object)
  if (!(typeof array === 'string' || Array.isArray(array))) {
    throw new RuntimeError(`index source (${typeof array}) is not a list or string`, node.object)
  }
  return array[walk(node.index, node, scope)]
}

visitors.CallExpression = (node, scope, walk) => {
  const routine = walk(node.callee, node, scope)
  if (!routine) {
    const name = getName(node.callee)
    if (name) throw new RuntimeError(`function "${name}" is undefined`, node.callee)
    throw new RuntimeError('undefined is not a function', node.callee)
  }
  const values = node.arguments.map(arg => walk(arg, node, scope))
  if (typeof routine === 'function') return routine(...values)
  if (!routine.type) {
    const name = getName(node.callee)
    if (name) throw new RuntimeError(`"${name}" is not a function`, node.callee)
    throw new RuntimeError(`${typeof routine} is not a function`, node.callee)
  }
  const args = routine.params.reduce((args, param, index) => {
    const value = values[index]
    args[param.id.value] = value === undefined
      ? param.init
          ? walk(param.init, node, scope)
          : getDefaultValue(param.parameterType)
      : value
    return args
  }, {})
  scope = new Scope(scope, args)
  scope.result = undefined
  if (node.routines) for (const routine of node.routines) walk(routine, node, scope)
  for (const variable of node.variables) walk(variable, node, scope)
  for (const statement of node.statements) walk(statement, node, scope)
  return scope.result
}

visitors.ThisExpression = (node, scope) => scope

visitors.SuperExpression = (node, { upper }) => upper

visitors.AssocExpression = visitors.ObjectExpression = (node, scope, walk) =>
  node.properties.reduce((object, { key, value }) => {
    object[walk(key, node, scope)] = walk(value, node, scope)
    return object
  }, {})

visitors.ListExpression = (node, scope, walk) =>
  node.elements.reduce((result, element) => {
    const item = walk(element, node, scope)
    if (element.type === 'AtExpression') push.apply(result, item)
    else result.push(item)
    return result
  }, [])

visitors.ListComprehension = (node, scope, walk) => {
  const name = node.left.value
  const values = walk(node.right, node, scope)
  return values.reduce((result, value) => {
    scope.set(name, value)
    if (!node.test || walk(node.test, node, scope)) {
      result.push(walk(node.expression, node, scope))
    }
    return result
  }, [])
}

visitors.AtExpression = visitors.ParenthesisExpression =
  (node, scope, walk) => walk(node.expression, node, scope)

visitors.XlateExpression = (node, scope) => {
  let { raw } = node
  if (!raw) raw = prepareXlateExpression(node)
  scope.get(raw)
}

// ---------- Identifiers and Literals

visitors.Identifier = ({ value }, scope) => scope.get(value)

visitors.LegacyAlias = (node, scope) => {
  let { raw } = node
  if (!raw) raw = prepareLegacyAlias(node)
  scope.get(raw)
}

visitors.Literal = ({ value }) => value

// ---------- Preparation

function prepareScript (node) {
  const routines = node.routines = []
  const variables = node.variables = []
  const statements = node.statements = []
  for (const part of node.body) {
    const { type } = part
    const target = type === 'VariableDeclaration'
      ? variables
      : type === 'FunctionDeclaration' || type === 'ScriptDeclaration'
        ? routines
        : statements
    target.push(part)
  }
}

function prepareFunction (node) {
  const variables = node.variables = []
  const statements = node.statements = []
  for (const part of node.body) {
    const { type } = part
    const target = type === 'VariableDeclaration' ? variables : statements
    target.push(part)
  }
}

function prepareObjectName (node) {
  const raw = node.name
    .map(({ value }) => typeof value === 'number' ? `&${value.toString(16)}` : value)
    .join('::')
  node.raw = raw
  return raw
}

function prepareLegacyAlias (node) {
  const raw = `&${node.value.toString(16)}`
  node.raw = raw
  return raw
}

function prepareXlateExpression (node) {
  const raw = `${node.ospace.value}.${node.string.value}`
  node.raw = raw
  return raw
}
