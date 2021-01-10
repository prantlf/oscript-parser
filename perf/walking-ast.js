import createSuite from './create-suite'
import textualNodeTypes from './walking/types-strings'
import numericNodeTypes from './walking/types-numbers'
import createVisitors from './walking/visitors'
import { recursive as recursiveWalk } from '../pkg/walker/src/index'
import objectWithStrings from './walking/object-strings.json'
import objectWithNumbers from './walking/object-numbers.json'

const visitorsForStrings = createVisitors(textualNodeTypes)
const visitorsForNumbers = createVisitors(numericNodeTypes)

function walkingWithTextual () {
  recursiveWalk(objectWithStrings, null, visitorsForStrings)
}

function walkingWithNumeric () {
  recursiveWalk(objectWithNumbers, null, visitorsForNumbers)
}

createSuite('Walking an AST...')
  .add('with textual types', walkingWithTextual)
  .add('with numeric types', walkingWithNumeric)
  .start()
