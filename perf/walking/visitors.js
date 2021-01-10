function ignore () {}

export default function createVisitors (nodeTypes) {
  const visitors = {}

  visitors[nodeTypes.Program] = (node, state, walk) => {
    walk(node.body, node, state)
  }

  // ---------- Package

  visitors[nodeTypes.PackageDeclaration] = (node, state, walk) => {
    walk(node.name, node, state)
    walk(node.object, node, state)
  }

  visitors[nodeTypes.ObjectDeclaration] = (node, state, walk) => {
    walk(node.id, node, state)
    if (node.superObject) walk(node.superObject, node, state)
    for (const declaration of node.body) walk(declaration, node, state)
  }

  visitors[nodeTypes.FeatureDeclaration] = (node, state, walk) => {
    walk(node.id, node, state)
    if (node.init) walk(node.init, node, state)
  }

  visitors[nodeTypes.ObjectName] = (node, state, walk) => {
    for (const identifier of node.name) walk(identifier, node, state)
  }

  // ---------- Script

  visitors[nodeTypes.ScriptSource] = (node, state, walk) => {
    for (const statement of node.body) walk(statement, node, state)
  }

  // ---------- Dump

  visitors[nodeTypes.DumpSource] = (node, state, walk) => {
    walk(node.id, node, state)
    walk(node.parent, node, state)
    for (const feature of node.assignments) walk(feature, node, state)
    for (const assignment of node.assignments) walk(assignment, node, state)
    for (const script of node.scripts) walk(script, node, state)
  }

  visitors[nodeTypes.FeatureAddition] = (node, state, walk) => {
    walk(node.id, node, state)
  }

  visitors[nodeTypes.FeatureInitialization] = (node, state, walk) => {
    walk(node.id, node, state)
    walk(node.value, node, state)
  }

  // ---------- Scopes

  visitors[nodeTypes.ScriptDeclaration] = (node, state, walk) => {
    walk(node.id, node, state)
    for (const part of node.body) walk(part, node, state)
  }

  visitors[nodeTypes.FunctionDeclaration] = (node, state, walk) => {
    walk(node.id, node, state)
    for (const param of node.params) walk(param, node, state)
    for (const statement of node.body) walk(statement, node, state)
  }

  visitors[nodeTypes.Parameter] = (node, state, walk) => {
    walk(node.id, node, state)
    if (node.init) walk(node.init, node, state)
  }

  // ---------- Statements

  visitors[nodeTypes.IfStatement] = (node, state, walk) => {
    walk(node.test, node, state)
    for (const statement of node.consequent) walk(statement, node, state)
    for (const otherClauses of node.otherClauses) walk(otherClauses, node, state)
    for (const statement of node.alternate) walk(statement, node, state)
  }

  visitors[nodeTypes.ElseIfClause] = (node, state, walk) => {
    walk(node.test, node, state)
    for (const statement of node.consequent) walk(statement, node, state)
  }

  visitors[nodeTypes.SwitchStatement] = (node, state, walk) => {
    walk(node.discriminant, node, state)
    for (const switchCase of node.cases) walk(switchCase, node, state)
  }

  visitors[nodeTypes.SwitchCase] = (node, state, walk) => {
    for (const test of node.tests) walk(test, node, state)
    for (const statement of node.consequent) walk(statement, node, state)
  }

  visitors[nodeTypes.WhileStatement] = visitors[nodeTypes.RepeatStatement] = (node, state, walk) => {
    walk(node.test, node, state)
    for (const statement of node.body) walk(statement, node, state)
  }

  visitors[nodeTypes.ForStatement] = (node, state, walk) => {
    if (node.init) walk(node.init, node, state)
    if (node.test) walk(node.test, node, state)
    if (node.update) walk(node.update, node, state)
    for (const statement of node.body) walk(statement, node, state)
  }

  visitors[nodeTypes.ForEachStatement] = (node, state, walk) => {
    walk(node.left, node, state)
    walk(node.right, node, state)
    for (const statement of node.body) walk(statement, node, state)
  }

  visitors[nodeTypes.StructuredForStatement] = (node, state, walk) => {
    walk(node.variable, node, state)
    walk(node.start, node, state)
    walk(node.end, node, state)
    if (node.step) walk(node.step, node, state)
    for (const statement of node.body) walk(statement, node, state)
  }

  visitors[nodeTypes.BreakStatement] = visitors[nodeTypes.ContinueStatement] = visitors[nodeTypes.EmptyStatement] = ignore

  visitors[nodeTypes.BreakIfStatement] = visitors[nodeTypes.ContinueIfStatement] = (node, state, walk) => {
    walk(node.test, node, state)
  }

  visitors[nodeTypes.LabelStatement] = (node, state, walk) => {
    walk(node.id, node, state)
  }

  visitors[nodeTypes.GotoStatement] = (node, state, walk) => {
    walk(node.label, node, state)
  }

  visitors[nodeTypes.ReturnStatement] = (node, state, walk) => {
    if (node.argument) walk(node.argument, node, state)
  }

  visitors[nodeTypes.VariableDeclaration] = (node, state, walk) => {
    for (const declaration of node.declarations) walk(declaration, node, state)
  }

  visitors[nodeTypes.VariableDeclarator] = (node, state, walk) => {
    walk(node.id, node, state)
    if (node.init) walk(node.init, node, state)
  }

  // ---------- Expressions

  visitors[nodeTypes.ConditionalExpression] = (node, state, walk) => {
    walk(node.test, node, state)
    walk(node.consequent, node, state)
    walk(node.alternate, node, state)
  }

  visitors[nodeTypes.BinaryExpression] = (node, state, walk) => {
    walk(node.left, node, state)
    walk(node.right, node, state)
  }

  visitors[nodeTypes.UnaryExpression] = (node, state, walk) => {
    walk(node.argument, node, state)
  }

  visitors[nodeTypes.MemberExpression] = (node, state, walk) => {
    walk(node.object, node, state)
    walk(node.property, node, state)
  }

  visitors[nodeTypes.SliceExpression] = (node, state, walk) => {
    walk(node.object, node, state)
    if (node.start) walk(node.start, node, state)
    if (node.end) walk(node.end, node, state)
  }

  visitors[nodeTypes.IndexExpression] = (node, state, walk) => {
    walk(node.object, node, state)
    walk(node.index, node, state)
  }

  visitors[nodeTypes.CallExpression] = (node, state, walk) => {
    walk(node.callee, node, state)
    for (const argument of node.arguments) walk(argument, node, state)
  }

  visitors[nodeTypes.ThisExpression] = visitors[nodeTypes.SuperExpression] = ignore

  visitors[nodeTypes.AssocExpression] = visitors[nodeTypes.ObjectExpression] = (node, state, walk) => {
    for (const property of node.properties) walk(property, node, state)
  }

  visitors[nodeTypes.Property] = (node, state, walk) => {
    walk(node.key, node, state)
    walk(node.value, node, state)
  }

  visitors[nodeTypes.ListExpression] = (node, state, walk) => {
    for (const element of node.elements) walk(element, node, state)
  }

  visitors[nodeTypes.ListComprehension] = (node, state, walk) => {
    walk(node.expression, node, state)
    walk(node.left, node, state)
    walk(node.right, node, state)
    if (node.test) walk(node.test, node, state)
  }

  visitors[nodeTypes.AtExpression] = visitors[nodeTypes.ParenthesisExpression] = (node, state, walk) => {
    walk(node.expression, node, state)
  }

  visitors[nodeTypes.XlateExpression] = (node, state, walk) => {
    walk(node.ospace, node, state)
    walk(node.string, node, state)
  }

  // ---------- Identifiers and Literals

  visitors[nodeTypes.Identifier] = visitors[nodeTypes.LegacyAlias] = visitors[nodeTypes.Literal] = ignore

  return visitors
}
