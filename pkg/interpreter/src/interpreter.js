import Scope from './scope'

const push = Array.prototype.push

function ignore () {}

const interpreter = {}

export default interpreter

interpreter.Program = (node, scope, walk) => walk(node.body, node, scope)

// ---------- Package

interpreter.PackageDeclaration = () => {
  throw new Error('package is not implemented')
}

interpreter.ObjectName = ({ raw }, scope) => scope.get(raw)

// ---------- Script

interpreter.ScriptSource = (node, scope, walk) => {
  for (const routine of node.routines) walk(routine, node, scope)
  for (const variable of node.variables) walk(variable, node, scope)
  for (const statement of node.statements) walk(statement, node, scope)
}

// ---------- Dump

interpreter.DumpSource = () => {
  throw new Error('dump is not implemented')
}

// ---------- Scopes

interpreter.ScriptDeclaration = interpreter.FunctionDeclaration = (node, scope) => {
  scope.setOwn(node.id.value, node)
}

// ---------- Statements

interpreter.IfStatement = (node, scope, walk) => {
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

interpreter.SwitchStatement = (node, scope, walk) => {
  const discriminant = walk(node.discriminant, node, scope)
  node.cases.some(switchCase => trySwitchCase(discriminant, switchCase, scope, walk))
}

function trySwitchCase (discriminant, node, scope, walk) {
  if (!node.tests || node.tests.some(test => walk(test, node, scope) === discriminant)) {
    for (const statement of node.consequent) walk(statement, node, scope)
    return true
  }
}

interpreter.WhileStatement = (node, scope, walk) => {
  while (walk(node.test, node, scope)) {
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
  }
}

interpreter.RepeatStatement = (node, scope, walk) => {
  do {
    scope.break = scope.continue = false
    for (const statement of node.body) {
      walk(statement, node, scope)
      if (scope.break) return
      if (scope.continue) break
    }
  } while (walk(node.test, node, scope))
}

interpreter.ForStatement = (node, scope, walk) => {
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

interpreter.ForEachStatement = (node, scope, walk) => {
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

interpreter.StructuredForStatement = (node, scope, walk) => {
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

interpreter.BreakStatement = (node, scope) => { scope.break = true }

interpreter.ContinueStatement = (node, scope) => { scope.continue = true }

interpreter.BreakIfStatement = (node, scope, walk) => {
  scope.break = walk(node.test, node, scope)
}

interpreter.ContinueIfStatement = (node, scope, walk) => {
  scope.continue = walk(node.test, node, scope)
}

interpreter.GotoStatement = (node, scope, walk) => {
  throw new Error('package is not implemented')
}

interpreter.LabelStatement = interpreter.EmptyStatement = ignore

interpreter.ReturnStatement = (node, scope, walk) => {
  if (node.argument) scope.result = walk(node.argument, node, scope)
}

interpreter.VariableDeclaration = (node, scope, walk) => {
  for (const declaration of node.declarations) {
    const { init } = declaration
    scope.setOwn(declaration.id.value, init && walk(init, declaration, scope))
  }
}

// ---------- Expressions

interpreter.ConditionalExpression = (node, scope, walk) => {
  return walk(node.test, node, scope)
    ? walk(node.consequent, node, scope)
    : walk(node.alternate, node, scope)
}

interpreter.BinaryExpression = (node, scope, walk) => {
  let { left, operator, right } = node
  left = isAssignment(operator) ? getName(left) : walk(left, node, scope)
  return binaryOperation[operator](left, walk(right, node, scope))
}

function isAssignment (symbol) {
  switch (symbol.length) {
    case 1:
      return symbol === '='
    case 2:
      return symbol === '+=' || symbol === '-=' || symbol === '*=' ||
        symbol === '&=' || symbol === '|=' || symbol === '^='
  }
  return false
}

function getName (node) {
  const { type } = node
  return type === 'Identifier'
    ? node.value
    : type === 'ObjectName' || type === 'LegacyAlias'
      ? node.raw
      : 'dynamic'
}

const binaryOperation = {
  '=': (left, right, scope) => scope.set(left, right),
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
  in: (left, right) => left in right,
  '+=': (left, right, scope) => scope.set(left, scope.get(left) + right),
  '-=': (left, right, scope) => scope.set(left, scope.get(left) - right),
  '*=': (left, right, scope) => scope.set(left, scope.get(left) * right),
  '&=': (left, right, scope) => scope.set(left, scope.get(left) & right),
  '|=': (left, right, scope) => scope.set(left, scope.get(left) | right),
  '^=': (left, right, scope) => scope.set(left, scope.get(left) ^ right),
  '^^': (left, right) => !!(left ^ right),
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

interpreter.UnaryExpression = (node, scope, walk) =>
  unaryOperation[node.operator](walk(node.argument, node, scope))

const unaryOperation = {
  '!': value => !value,
  '+': value => value,
  '-': value => -value,
  '~': value => ~value,
  not: value => !value
}

interpreter.MemberExpression = (node, scope, walk) =>
  walk(node.object, node, scope)[walk(node.property, node, scope)]

interpreter.SliceExpression = (node, scope, walk) => {
  const array = walk(node.object, node, scope)
  const start = (node.start && walk(node.start, node, scope)) || 0
  const end = (node.end && walk(node.end, node, scope)) || array.length
  return array.slice(start, end)
}

interpreter.IndexExpression = (node, scope, walk) =>
  walk(node.object, node, scope)[walk(node.index, node, scope)]

interpreter.CallExpression = (node, scope, walk) => {
  const routine = walk(node.callee, node, scope)
  if (!routine) throw new Error(`routine "${getName(node.callee)}" is undefined`)
  const values = node.arguments.map(arg => walk(arg, node, scope))
  if (typeof routine === 'function') return routine(...values)
  if (!routine.type) throw new Error(`"${getName(node.callee)}" is not a routine`)
  const args = routine.params.reduce((args, param, index) => {
    const value = values[index]
    args[param.id.value] = value === undefined && param.init
      ? walk(param.init, node, scope)
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

interpreter.ThisExpression = (node, scope) => scope

interpreter.SuperExpression = (node, { upper }) => upper

interpreter.AssocExpression = interpreter.ObjectExpression = (node, scope, walk) => {
  return node.properties.reduce((object, { key, value }) => {
    object[walk(key, node, scope)] = walk(value, node, scope)
    return object
  }, {})
}

interpreter.ListExpression = (node, scope, walk) =>
  node.elements.reduce((result, element) => {
    const item = walk(element, node, scope)
    if (element.type === 'AtExpression') push.apply(result, item)
    else result.push(item)
    return result
  }, [])

interpreter.ListComprehension = (node, scope, walk) => {
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

interpreter.AtExpression = interpreter.ParenthesisExpression =
  (node, scope, walk) => walk(node.expression, node, scope)

interpreter.XlateExpression = ({ raw }, scope) => scope.get(raw)

// ---------- Identifiers and Literals

interpreter.Identifier = ({ value }, scope) => scope.get(value)

interpreter.LegacyAlias = ({ raw }, scope) => scope.get(raw)

interpreter.Literal = ({ value }) => value
