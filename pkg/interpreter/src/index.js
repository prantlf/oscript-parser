import { recursive as recursiveWalk } from 'oscript-ast-walker'
import { visitors, setOptions } from './interpreter'
import * as library from './library/index'
import Scope from './scope'

export function interpret (ast, options = {}) {
  setOptions(options)
  const scope = new Scope(null, Object.assign({}, library, options.globals))
  return recursiveWalk(ast, null, visitors, scope)
}
