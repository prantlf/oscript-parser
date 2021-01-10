import { recursive as recursiveWalk } from 'oscript-ast-walker'
import interpreter from './interpreter'
import optimize from './optimizer'
import * as library from './library/index'
import Scope from './scope'

export function interpret (ast, globals = {}) {
  const scope = new Scope(null, Object.assign({}, library, globals))
  recursiveWalk(optimize(ast), null, interpreter, scope)
}
