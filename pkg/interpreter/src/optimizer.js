import { simple as simpleWalk } from 'oscript-ast-walker'

export default function optimize (ast) {
  simpleWalk(ast, optimizer)
  return ast
}

const optimizer = {}

optimizer.ScriptSource = optimizer.ScriptDeclaration = {
  pre (node) {
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
}

optimizer.FunctionDeclaration = {
  pre (node) {
    const variables = node.variables = []
    const statements = node.statements = []
    for (const part of node.body) {
      const { type } = part
      const target = type === 'VariableDeclaration' ? variables : statements
      target.push(part)
    }
  }
}

optimizer.ObjectName = {
  pre (node) {
    node.raw = node.name
      .map(({ value }) => typeof value === 'number' ? `&${value.toString(16)}` : value)
      .join('::')
    return true
  }
}

optimizer.LegacyAlias = {
  pre (node) {
    node.raw = `&${node.value.toString(16)}`
    return true
  }
}

optimizer.XlateExpression = {
  pre (node) {
    node.raw = `${node.ospace.value}.${node.string.value}`
    return true
  }
}
