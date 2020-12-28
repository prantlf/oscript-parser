import { parser } from './parser'
import { mark, measure } from './performance'

const BaseCstVisitor = parser.getBaseCstVisitorConstructorWithDefaults()

class OScriptExecutor extends BaseCstVisitor {
  constructor () {
    super()
    this.tracePerf = true
    this.validateVisitor()
  }

  execute (text, options) {
    const result = parser.parse(text, options)
    const start = mark('Executor Execute', this.tracePerf)
    result.value = executor.visit(result.cst)
    measure('Executor Execute', start)
    return result
  }
}

const executor = new OScriptExecutor()
const execute = executor.execute.bind(executor)

export { executor, execute }
