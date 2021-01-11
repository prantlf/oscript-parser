function ignore () {}

export const base = {}

// ---------- Program

base.Program = (node, state, walk) => {
  walk(node.body, node, state)
}

// ---------- Package

base.PackageDeclaration = (node, state, walk) => {
  walk(node.name, node, state)
  walk(node.object, node, state)
}

base.ObjectDeclaration = (node, state, walk) => {
  walk(node.id, node, state)
  if (node.superObject) walk(node.superObject, node, state)
  for (const declaration of node.body) walk(declaration, node, state)
}

base.FeatureDeclaration = (node, state, walk) => {
  walk(node.id, node, state)
  if (node.init) walk(node.init, node, state)
}

base.ObjectName = (node, state, walk) => {
  for (const identifier of node.name) walk(identifier, node, state)
}

// ---------- Script

base.ScriptSource = (node, state, walk) => {
  for (const statement of node.body) walk(statement, node, state)
}

// ---------- Dump

base.DumpSource = (node, state, walk) => {
  walk(node.id, node, state)
  walk(node.parent, node, state)
  for (const feature of node.assignments) walk(feature, node, state)
  for (const assignment of node.assignments) walk(assignment, node, state)
  for (const script of node.scripts) walk(script, node, state)
}

base.FeatureAddition = (node, state, walk) => {
  walk(node.id, node, state)
}

base.FeatureInitialization = (node, state, walk) => {
  walk(node.id, node, state)
  walk(node.value, node, state)
}

// ---------- Scopes

base.ScriptDeclaration = (node, state, walk) => {
  walk(node.id, node, state)
  for (const part of node.body) walk(part, node, state)
}

base.FunctionDeclaration = (node, state, walk) => {
  walk(node.id, node, state)
  for (const param of node.params) walk(param, node, state)
  for (const statement of node.body) walk(statement, node, state)
}

base.Parameter = (node, state, walk) => {
  walk(node.id, node, state)
  if (node.init) walk(node.init, node, state)
}

// ---------- Statements

base.IfStatement = (node, state, walk) => {
  walk(node.test, node, state)
  for (const statement of node.consequent) walk(statement, node, state)
  for (const otherClauses of node.otherClauses) walk(otherClauses, node, state)
  for (const statement of node.alternate) walk(statement, node, state)
}

base.ElseIfClause = (node, state, walk) => {
  walk(node.test, node, state)
  for (const statement of node.consequent) walk(statement, node, state)
}

base.SwitchStatement = (node, state, walk) => {
  walk(node.discriminant, node, state)
  for (const switchCase of node.cases) walk(switchCase, node, state)
}

base.SwitchCase = (node, state, walk) => {
  for (const test of node.tests) walk(test, node, state)
  for (const statement of node.consequent) walk(statement, node, state)
}

base.WhileStatement = base.RepeatStatement = (node, state, walk) => {
  walk(node.test, node, state)
  for (const statement of node.body) walk(statement, node, state)
}

base.ForStatement = (node, state, walk) => {
  if (node.init) walk(node.init, node, state)
  if (node.test) walk(node.test, node, state)
  if (node.update) walk(node.update, node, state)
  for (const statement of node.body) walk(statement, node, state)
}

base.ForEachStatement = (node, state, walk) => {
  walk(node.left, node, state)
  walk(node.right, node, state)
  for (const statement of node.body) walk(statement, node, state)
}

base.StructuredForStatement = (node, state, walk) => {
  walk(node.variable, node, state)
  walk(node.start, node, state)
  walk(node.end, node, state)
  if (node.step) walk(node.step, node, state)
  for (const statement of node.body) walk(statement, node, state)
}

base.BreakStatement = base.ContinueStatement = base.EmptyStatement = ignore

base.BreakIfStatement = base.ContinueIfStatement = (node, state, walk) => {
  walk(node.test, node, state)
}

base.LabelStatement = (node, state, walk) => {
  walk(node.id, node, state)
}

base.GotoStatement = (node, state, walk) => {
  walk(node.label, node, state)
}

base.ReturnStatement = (node, state, walk) => {
  if (node.argument) walk(node.argument, node, state)
}

base.VariableDeclaration = (node, state, walk) => {
  for (const declaration of node.declarations) walk(declaration, node, state)
}

base.VariableDeclarator = (node, state, walk) => {
  walk(node.id, node, state)
  if (node.init) walk(node.init, node, state)
}

// ---------- Expressions

base.ConditionalExpression = (node, state, walk) => {
  walk(node.test, node, state)
  walk(node.consequent, node, state)
  walk(node.alternate, node, state)
}

base.BinaryExpression = (node, state, walk) => {
  walk(node.left, node, state)
  walk(node.right, node, state)
}

base.UnaryExpression = (node, state, walk) => {
  walk(node.argument, node, state)
}

base.MemberExpression = (node, state, walk) => {
  walk(node.object, node, state)
  walk(node.property, node, state)
}

base.SliceExpression = (node, state, walk) => {
  walk(node.object, node, state)
  if (node.start) walk(node.start, node, state)
  if (node.end) walk(node.end, node, state)
}

base.IndexExpression = (node, state, walk) => {
  walk(node.object, node, state)
  walk(node.index, node, state)
}

base.CallExpression = (node, state, walk) => {
  walk(node.callee, node, state)
  for (const argument of node.arguments) walk(argument, node, state)
}

base.ThisExpression = base.SuperExpression = ignore

base.AssocExpression = base.ObjectExpression = (node, state, walk) => {
  for (const property of node.properties) walk(property, node, state)
}

base.Property = (node, state, walk) => {
  walk(node.key, node, state)
  walk(node.value, node, state)
}

base.ListExpression = (node, state, walk) => {
  for (const element of node.elements) walk(element, node, state)
}

base.ListComprehension = (node, state, walk) => {
  walk(node.expression, node, state)
  walk(node.left, node, state)
  walk(node.right, node, state)
  if (node.test) walk(node.test, node, state)
}

base.AtExpression = base.ParenthesisExpression = (node, state, walk) => {
  walk(node.expression, node, state)
}

base.XlateExpression = (node, state, walk) => {
  walk(node.ospace, node, state)
  walk(node.string, node, state)
}

// ---------- Identifiers and Literals

base.Identifier = base.LegacyAlias = base.Literal = ignore
