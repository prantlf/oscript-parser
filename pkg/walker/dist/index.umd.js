(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.walker = {}));
}(this, (function (exports) { 'use strict';

  function simple (node, visitors, baseVisitor, state) {
    if (!baseVisitor) baseVisitor = base;
    walk(node, null, state);
    function walk (node, parent, state) {
      const { type } = node;
      const callbacks = visitors[type];
      let pre, post;
      if (callbacks) ({ pre, post } = callbacks);
      if (pre && pre(node, state, parent)) return
      baseVisitor[type](node, state, walk);
      if (post) post(node, state, parent);
    }
  }
  function ancestor (node, visitors, baseVisitor, state) {
    const ancestors = [];
    if (!baseVisitor) baseVisitor = base;
    walk(node, null, state);
    function walk (node, parent, state) {
      const { type } = node;
      const isNew = node !== ancestors[ancestors.length - 1];
      if (isNew) ancestors.push(node);
      const callbacks = visitors[type];
      let pre, post;
      if (callbacks) ({ pre, post } = callbacks);
      if (pre) {
        const result = pre(node, state, ancestors);
        if (result) {
          if (isNew) ancestors.pop();
          return
        }
      }
      baseVisitor[type](node, state, walk);
      if (post) post(node, state, ancestors);
      if (isNew) ancestors.pop();
    }
  }
  function full (node, callbacks, baseVisitor, state) {
    const { pre, post } = callbacks;
    if (!baseVisitor) baseVisitor = base;
    walk(node, null, state);
    function walk (node, parent, state) {
      const { type } = node;
      if (pre && pre(node, state, parent)) return
      baseVisitor[type](node, state, walk);
      if (post) post(node, state, parent);
    }
  }
  function fullAncestor (node, callbacks, baseVisitor, state) {
    const { pre, post } = callbacks;
    const ancestors = [];
    if (!baseVisitor) baseVisitor = base;
    walk(node, null, state);
    function walk (node, parent, state) {
      const { type } = node;
      const isNew = node !== ancestors[ancestors.length - 1];
      if (isNew) ancestors.push(node);
      if (pre) {
        const result = pre(node, state, ancestors);
        if (result) {
          if (isNew) ancestors.pop();
          return
        }
      }
      baseVisitor[type](node, state, walk);
      if (post) post(node, state, ancestors);
      if (isNew) ancestors.pop();
    }
  }
  function recursive (node, functions, baseVisitor, state) {
    const visitor = functions ? make(functions, baseVisitor) : baseVisitor;
    walk(node, null, state);
    function walk (node, parent, state) {
      visitor[node.type](node, state, walk);
    }
  }
  function make (functions, baseVisitor) {
    return Object.assign(baseVisitor || base, functions)
  }
  function findNodeAround (node, position, test, baseVisitor, state) {
    const { line, column } = position;
    const { pre, post } = makeFindTest(test);
    if (!baseVisitor) baseVisitor = base;
    try {
      walk(node, null, state);
    } catch (error) {
      if (error instanceof FoundWithParent) return { node: error.node, state, parent: error.parent }
      throw error
    }
    function walk (node, parent, state) {
      const { type, loc } = node;
      const { start, end } = loc;
      if (start.line > line || end.line < line ||
          (start.line  === line && start.line === end.line &&
          (start.column > column || end.column < column))) return
      if (pre && pre(node, state, parent)) return
      baseVisitor[type](node, state, walk);
      if (post(node, state, parent)) throw new FoundWithParent(node, parent)
    }
  }
  function findNodeAroundWithAncestors (node, position, test, baseVisitor, state) {
    const ancestors = [];
    const { line, column } = position;
    const { pre, post } = makeFindTest(test);
    if (!baseVisitor) baseVisitor = base;
    try {
      walk(node, null, state);
    } catch (error) {
      if (error instanceof Found) return { node: error.node, state, ancestors }
      throw error
    }
    function walk (node, parent, state) {
      const { type, loc } = node;
      const { start, end } = loc;
      if (start.line > line || end.line < line ||
          (start.line  === line && start.line === end.line &&
          (start.column > column || end.column < column))) return
      const isNew = node !== ancestors[ancestors.length - 1];
      if (isNew) ancestors.push(node);
      if (pre && pre(node, state, ancestors)) return
      baseVisitor[type](node, state, walk);
      if (post(node, state, ancestors)) throw new Found(node)
      if (isNew) ancestors.pop();
    }
  }
  function makeFindTest (test) {
    if (typeof test === 'string') return { post: ({ type }) => type === test }
    else if (typeof test === 'function') return { post: test }
    else if (!test) return { post: () => true }
    else return test
  }
  class Found {
    constructor (node) { this.node = node; }
  }
  class FoundWithParent {
    constructor (node, parent) { this.node = node; this.parent = parent; }
  }
  function ignore () {}
  const base = {};
  base.Program = (node, state, walk) => {
    walk(node.body, node, state);
  };
  base.PackageDeclaration = (node, state, walk) => {
    walk(node.name, node, state);
    walk(node.object, node, state);
  };
  base.ObjectDeclaration = (node, state, walk) => {
    walk(node.id, node, state);
    if (node.superObject) walk(node.superObject, node, state);
    for (const declaration of node.body) walk(declaration, node, state);
  };
  base.FeatureDeclaration = (node, state, walk) => {
    walk(node.id, node, state);
    if (node.init) walk(node.init, node, state);
  };
  base.ObjectName = (node, state, walk) => {
    for (const identifier of node.name) walk(identifier, node, state);
  };
  base.ScriptSource = (node, state, walk) => {
    for (const statement of node.body) walk(statement, node, state);
  };
  base.DumpSource = (node, state, walk) => {
    walk(node.id, node, state);
    walk(node.parent, node, state);
    for (const feature of node.assignments) walk(feature, node, state);
    for (const assignment of node.assignments) walk(assignment, node, state);
    for (const script of node.scripts) walk(script, node, state);
  };
  base.FeatureAddition = base.LabelStatement = (node, state, walk) => {
    walk(node.id, node, state);
  };
  base.FeatureInitialization = (node, state, walk) => {
    walk(node.id, node, state);
    walk(node.value, node, state);
  };
  base.ScriptDeclaration = (node, state, walk) => {
    walk(node.id, node, state);
    for (const part of node.body) walk(part, node, state);
  };
  base.FunctionDeclaration = (node, state, walk) => {
    walk(node.id, node, state);
    for (const param of node.params) walk(param, node, state);
    for (const statement of node.body) walk(statement, node, state);
  };
  base.Parameter = (node, state, walk) => {
    walk(node.id, node, state);
    if (node.init) walk(node.init, node, state);
  };
  base.IfStatement = (node, state, walk) => {
    walk(node.test, node, state);
    for (const statement of node.consequent) walk(statement, node, state);
    for (const statement of node.otherClauses) walk(statement, node, state);
    for (const statement of node.alternate) walk(statement, node, state);
  };
  base.ElseIfClause = (node, state, walk) => {
    walk(node.test, node, state);
    for (const statement of node.consequent) walk(statement, node, state);
  };
  base.SwitchStatement = (node, state, walk) => {
    walk(node.discriminant, node, state);
    for (const switchCase of node.cases) walk(switchCase, node, state);
  };
  base.SwitchCase = (node, state, walk) => {
    for (const test of node.tests) walk(test, node, state);
    for (const switchCase of node.consequent) walk(switchCase, node, state);
  };
  base.WhileStatement = base.RepeatStatement = (node, state, walk) => {
    walk(node.test, node, state);
    for (const statement of node.body) walk(statement, node, state);
  };
  base.ForStatement = (node, state, walk) => {
    if (node.init) walk(node.test, node, state);
    if (node.test) walk(node.test, node, state);
    if (node.update) walk(node.update, node, state);
    for (const statement of node.body) walk(statement, node, state);
  };
  base.ForEachStatement = (node, state, walk) => {
    walk(node.left, node, state);
    walk(node.right, node, state);
    for (const statement of node.body) walk(statement, node, state);
  };
  base.StructuredForStatement = (node, state, walk) => {
    walk(node.variable, node, state);
    walk(node.start, node, state);
    walk(node.end, node, state);
    if (node.step) walk(node.step, node, state);
    for (const statement of node.body) walk(statement, node, state);
  };
  base.BreakStatement = base.ContinueStatement = base.EmptyStatement = ignore;
  base.BreakIfStatement = base.ContinueIfStatement = (node, state, walk) => {
    walk(node.test, node, state);
  };
  base.GotoStatement = (node, state, walk) => {
    walk(node.label, node, state);
  };
  base.ReturnStatement = (node, state, walk) => {
    if (node.argument) walk(node.argument, node, state);
  };
  base.VariableDeclaration = (node, state, walk) => {
    for (const declaration of node.declarations) walk(declaration, node, state);
  };
  base.VariableDeclarator = (node, state, walk) => {
    walk(node.id, node, state);
    if (node.init) walk(node.init, node, state);
  };
  base.ConditionalExpression = (node, state, walk) => {
    walk(node.test, node, state);
    for (const statement of node.consequent) walk(statement, node, state);
    for (const statement of node.alternate) walk(statement, node, state);
  };
  base.BinaryExpression = (node, state, walk) => {
    walk(node.left, node, state);
    walk(node.right, node, state);
  };
  base.UnaryExpression = (node, state, walk) => {
    walk(node.argument, node, state);
  };
  base.MemberExpression = (node, state, walk) => {
    walk(node.object, node, state);
    walk(node.property, node, state);
  };
  base.SliceExpression = (node, state, walk) => {
    walk(node.object, node, state);
    walk(node.start, node, state);
    walk(node.end, node, state);
  };
  base.IndexExpression = (node, state, walk) => {
    walk(node.object, node, state);
    walk(node.index, node, state);
  };
  base.CallExpression = (node, state, walk) => {
    walk(node.callee, node, state);
    for (const argument of node.arguments) walk(argument, node, state);
  };
  base.ThisExpression = base.SuperExpression = ignore;
  base.AssocExpression = (node, state, walk) => {
    for (const property of node.properties) walk(property, node, state);
  };
  base.Property = (node, state, walk) => {
    walk(node.key, node, state);
    walk(node.value, node, state);
  };
  base.ListExpression = (node, state, walk) => {
    for (const element of node.elements) walk(element, node, state);
  };
  base.ListComprehension = (node, state, walk) => {
    walk(node.expression, node, state);
    walk(node.left, node, state);
    walk(node.right, node, state);
    if (node.test) walk(node.test, node, state);
  };
  base.AtExpression = base.ParenthesisExpression = (node, state, walk) => {
    walk(node.expression, node, state);
  };
  base.XlateExpression = (node, state, walk) => {
    walk(node.ospace, node, state);
    walk(node.string, node, state);
  };
  base.Identifier = base.LegacyAlias = base.Literal = ignore;

  exports.ancestor = ancestor;
  exports.base = base;
  exports.findNodeAround = findNodeAround;
  exports.findNodeAroundWithAncestors = findNodeAroundWithAncestors;
  exports.full = full;
  exports.fullAncestor = fullAncestor;
  exports.make = make;
  exports.recursive = recursive;
  exports.simple = simple;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=index.umd.js.map
