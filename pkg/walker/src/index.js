import { base } from './walkers'

export { base }

// AST walker module for OScript AST

// A simple walk is one where you simply specify callbacks to be
// called on specific nodes. The last two arguments are optional. A
// simple use would be:
//
//     walk.simple(myTree, {
//       Expression: {
//         pre: node => { ... }
//       }
//     })
//
// to do something with all expressions. All OScript AST node types
// can be used to identify node types.
//
// Callbacks are specified by an object with pre and post properties,
// which point to functions accepting a node. The pre-callback will be
// called before children of the node will be visited and the post-callback
// will be called after visiting the node children. If the pre-callback
// returns true, children of the node will not be visited and the walking
// will continue with the next sibling.
//
// The baseVisitor argument can be used to pass a custom (recursive)
// walker, and state can be used to give this walked an initial
// state.
//
// The state argument can be used to give this walk an initial state.

export function simple (node, visitors, baseVisitor, state) {
  if (!baseVisitor) baseVisitor = base
  walk(node, null, state)

  function walk (node, parent, state) {
    const { type } = node
    const callbacks = visitors[type]
    let pre, post
    if (callbacks) {
      ({ pre, post } = callbacks)
      if (pre && pre(node, state, parent)) return
    }
    baseVisitor[type](node, state, walk)
    if (post) post(node, state, parent)
  }
}

// An ancestor walk keeps an array of ancestor nodes (including the
// current node) and passes them to the callbacks as third parameter.

export function ancestor (node, visitors, baseVisitor, state) {
  const ancestors = []
  if (!baseVisitor) baseVisitor = base
  walk(node, null, state)

  function walk (node, parent, state) {
    const { type } = node
    const isNew = node !== ancestors[ancestors.length - 1]
    if (isNew) ancestors.push(node)
    const callbacks = visitors[type]
    let pre, post
    if (callbacks) {
      ({ pre, post } = callbacks)
      if (pre) {
        const result = pre(node, state, ancestors)
        if (result) {
          if (isNew) ancestors.pop()
          return
        }
      }
    }
    baseVisitor[type](node, state, walk)
    if (post) post(node, state, ancestors)
    if (isNew) ancestors.pop()
  }
}

// A full walk triggers the callbacks on each node

export function full (node, callbacks, baseVisitor, state) {
  const { pre, post } = callbacks
  if (!baseVisitor) baseVisitor = base
  walk(node, null, state)

  function walk (node, parent, state) {
    const { type } = node
    if (pre && pre(node, state, parent)) return
    baseVisitor[type](node, state, walk)
    if (post) post(node, state, parent)
  }
}

// An fullAncestor walk is like an ancestor walk, but triggers
// the callbacks on each node

export function fullAncestor (node, callbacks, baseVisitor, state) {
  const { pre, post } = callbacks
  const ancestors = []
  if (!baseVisitor) baseVisitor = base
  walk(node, null, state)

  function walk (node, parent, state) {
    const { type } = node
    const isNew = node !== ancestors[ancestors.length - 1]
    if (isNew) ancestors.push(node)
    if (pre) {
      const result = pre(node, state, ancestors)
      if (result) {
        if (isNew) ancestors.pop()
        return
      }
    }
    baseVisitor[type](node, state, walk)
    if (post) post(node, state, ancestors)
    if (isNew) ancestors.pop()
  }
}

// A recursive walk is one where your functions override the default
// walkers. They can modify and replace the state parameter that's
// threaded through the walk, and can opt how and whether to walk
// their child nodes (by calling their third argument on these
// nodes).

export function recursive (node, functions, baseVisitor, state) {
  const visitor = functions ? make(functions, baseVisitor) : baseVisitor
  let lastNode
  try {
    return walk(node, null, state)
  } catch (error) {
    if (!error.node) error.node = lastNode
    throw error
  }

  function walk (node, parent, state) {
    lastNode = node
    return visitor[node.type](node, state, walk)
  }
}

// Used to create a custom walker. Will fill in all missing node
// type properties with the defaults.

export function make (functions, baseVisitor) {
  return Object.assign(baseVisitor || base, functions)
}

// Finds the innermost node that contains the given position and passes the
// given test. Returns a { node, state } object, or  undefined when it does
// not find a matching node.

export function findNodeAround (node, position, test, baseVisitor, state) {
  const { line, column } = position
  const { pre, post } = makeFindTest(test)
  if (!baseVisitor) baseVisitor = base
  try {
    walk(node, null, state)
  } catch (error) {
    if (error instanceof FoundWithParent) return { node: error.node, state, parent: error.parent }
    throw error
  }

  function walk (node, parent, state) {
    const { type, loc } = node
    const { start, end } = loc
    if (start.line > line || end.line < line ||
        (start.line  === line && start.line === end.line &&
        (start.column > column || end.column < column))) return
    if (pre && pre(node, state, parent)) return
    baseVisitor[type](node, state, walk)
    if (post(node, state, parent)) throw new FoundWithParent(node, parent)
  }
}

// Finds the innermost node that contains the given position and passes the
// given test. Keeps an array of ancestor nodes (including the current node),
// passes them to the test callbacks as a third parameter and includes them
// in the returned object.

export function findNodeAroundWithAncestors (node, position, test, baseVisitor, state) {
  const ancestors = []
  const { line, column } = position
  const { pre, post } = makeFindTest(test)
  if (!baseVisitor) baseVisitor = base
  try {
    walk(node, null, state)
  } catch (error) {
    if (error instanceof Found) return { node: error.node, state, ancestors }
    throw error
  }

  function walk (node, parent, state) {
    const { type, loc } = node
    const { start, end } = loc
    if (start.line > line || end.line < line ||
        (start.line  === line && start.line === end.line &&
        (start.column > column || end.column < column))) return
    const isNew = node !== ancestors[ancestors.length - 1]
    if (isNew) ancestors.push(node)
    if (pre && pre(node, state, ancestors)) return
    baseVisitor[type](node, state, walk)
    if (post(node, state, ancestors)) throw new Found(node)
    if (isNew) ancestors.pop()
  }
}

function makeFindTest (test) {
  if (typeof test === 'string') return { post: ({ type }) => type === test }
  else if (typeof test === 'function') return { post: test }
  else if (!test) return { post: () => true }
  else return test
}

class Found {
  constructor (node) { this.node = node }
}

class FoundWithParent {
  constructor (node, parent) { this.node = node; this.parent = parent }
}
