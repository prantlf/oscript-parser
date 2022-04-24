# OScript AST Walker

[![NPM version](https://badge.fury.io/js/oscript-ast-walker.png)](http://badge.fury.io/js/oscript-ast-walker)

A walker for nodes of the [abstract syntax tree] (AST) for the [OScript language]. The AST can be produced by the [oscript-parser].

## Synopsis

```js
import { parseText } from 'oscript-parser'
import { simple as simpleWalk } from 'oscript-ast-walker'

const source = `
script Test
endscript
`
simpleWalk(parseText(source, { sourceType: 'script' }), {
  ScriptDeclaration: {
    pre(node) {
      console.log(`Script: ${node.id.value}`) // prints "Test"
      return true // do not continue walking below the script declaration
    }
  }
})
```

## Installation

Use your favourite package manager to install this package locally in your Node.js project:

```
npm i oscript-ast-walker
pnpm i oscript-ast-walker
yarn add  oscript-ast-walker
```

## Interface

An algorithm for recursing through a syntax tree is stored as an object, with a property for each tree node type holding functions that will recurse through such a node. There are several ways to run such a walker:

**simple**`(node, visitors, baseVisitor, state)` does a "simple: walk over a tree. `node` should be the AST node to walk, and `visitors` an object with properties whose names correspond to node types in the [AST]. The properties should contain an object with `pre` and `post` functions that will be called with the node object, with the state at that point (if applicable) and with the parent node. The pre-callback will be called before children of the node will be visited and the post-callback will be called after visiting the node children. If the pre-callback returns a truth-y result, children of the node will not be visited and the walking will to the next sibling. It can be used to optimize the walking if only top nodes should be visited. The last two arguments are optional. The `state` is a start state. The default walker will simply visit all statements and expressions and not produce a meaningful state. (An example of a use of state is to track scope at each point in the tree.)

```js
import { parseText } from 'oscript-parser'
import { simple as simpleWalk } from 'oscript-ast-walker'

const source = `
script Test
  Integer i = 0
endscript
`
simpleWalk(parseText(source, { sourceType: 'script' }), {
  Identifier: {
    pre(node) {
      console.log(`Identifier: ${node..value}`) // prints "Test" and "i"
    }
  }
})
```

**ancestor**`(node, visitors, baseVisitor, state)` does a "simple" walk over a tree, building up an array of ancestor nodes (including the current node) and passing the array to the callbacks as the third parameter (instead of the parent node).

```js
import { parseText } from 'oscript-parser'
import { ancestor as ancestorWalk } from 'oscript-ast-walker'

const source = `
script Test
  function Help()
    Integer i = 0
  end
endscript
`
ancestorWalk(parseText(source, { sourceType: 'script' }), {
  FunctionDeclaration: {
    pre (node, state, ancestors) {
      const path = ancestors.map(node => node.id.value).join('.')
      console.log(`Function: ${path}`) // prints "Test/Help"
      return true // do not continue walking below the function declaration
    }
  }
})
```

**full**`(node, callbacks, baseVisitor, state)` does a "full" walk over a tree, calling the callbacks with the arguments (node, state, parent) for each node.

```js
import { parseText } from 'oscript-parser'
import { full as fullWalk } from 'oscript-ast-walker'

const source = `
script Test
  Integer i = 0
endscript
`
fullWalk(parseText(source, { sourceType: 'script' }), {
  pre(node) {
    if (node.type === 'Identifier') {
      console.log(`Identifier: ${node..value}`) // prints "Test" and "i"
    }
  }
})
```

**fullAncestor**`(node, callbacks, baseVisitor, state)` does a "full" walk over a tree, building up an array of ancestor nodes (including the current node) and passing the array to the callbacks as the third parameter (instead of the parent node).

```js
import { parseText } from 'oscript-parser'
import { fullAncestor as fullAncestorWalk } from 'oscript-ast-walker'

const source = `
script Test
  Integer i = 0
  function Help()
  end
endscript
`
fullAncestorWalk(parseText(source, { sourceType: 'script' }), {
  pre(node, state, ancestors) {
    if (node.type === 'VariableDeclarator' ||
        node.type === 'FunctionDeclaration' ||
        node.type === 'ScriptDeclaration') {
      const path = ancestors.map(node => node.id.value).join('.')
      console.log(`Declared: ${path}`) // prints "Test", "Test/i", and "Test/Help"
      return true // do not continue walking below the declarations
    }
  }
})
```

**recursive**`(node, functions, baseVisitor, state)` does a "recursive" walk, where the walker functions are responsible for continuing the walk on the child nodes of their target node. `state` is the start state, and `functions` should contain an object that maps node types to walker functions. Such functions are called with `(node, parent, state, walk)` arguments, and can cause the walk to continue on a sub-node by calling the `walk` argument on it with `(node, parent, state)` arguments. The optional `baseVisitor` argument provides the fallback walker functions for node types that aren't handled in the `functions` object. If not given, the default walkers will be used.

**make**`(functions, baseVisitor)` builds a new walker object by using the walker functions in `functions` and filling in the missing ones by taking defaults from `baseVisitor`.

**findNodeAround**`(node, position, test, base, state)` tries to locate a node in a tree at the given position, which satisfies the optional predicate `test`. `position` should be an object with `line` (1-based) and `column` (0-based) properties. `test` may be a string (indicating a node type) or a function that takes `(node, state, parent)` arguments and returns a boolean indicating whether this node is interesting. `baseVisitor` and `state` are optional, and can be used to specify a custom walker. Nodes are tested from inner to outer, so if two nodes match the boundaries, the inner one will be preferred.

**findNodeAroundWithAncestors**`(node, position, test, base, state)` tries to locate a node in a tree at the given position and satisfying the optional predicate `test`. Keeps an array of ancestor nodes (including the current node), passes them to the test callbacks as a third parameter and includes them in the returned object.

[OScript language]: https://github.com/prantlf/oscript-parser/blob/master/doc/grammar.md#oscript-language-grammar
[abstract syntax tree]: https://github.com/prantlf/oscript-parser/blob/master/dist/index.d.ts#L115
[AST]: https://github.com/prantlf/oscript-parser/blob/master/dist/index.d.ts#L115
[oscript-parser]: https://github.com/prantlf/oscript-parser#readme
