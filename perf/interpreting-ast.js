import assert from 'assert'
import createSuite from './create-suite'
import textualNodeTypes from './walking/types-strings'
import numericNodeTypes from './walking/types-numbers'
import createVisitors from './walking/visitors'
import { simple as simpleWalk } from '../pkg/walker/src/index'
import objectWithStrings from './walking/object-strings.json'
import objectWithNumbers from './walking/object-numbers.json'

const visitorsForStrings = createVisitors(textualNodeTypes)
const visitorsForNumbers = createVisitors(numericNodeTypes)

let identifierCountForStrings
let identifierCountForNumbers

const matchingIdentifiersWithStrings = {
  Identifier: {
    pre () { ++identifierCountForStrings }
  }
}

const matchingIdentifiersWithNumbers = {
  [numericNodeTypes.Identifier]: {
    pre () { ++identifierCountForNumbers }
  }
}

function matchingWithTextual () {
  identifierCountForStrings = 0
  simpleWalk(objectWithStrings, matchingIdentifiersWithStrings, visitorsForStrings)
}

function matchingWithNumeric () {
  identifierCountForNumbers = 0
  simpleWalk(objectWithNumbers, matchingIdentifiersWithNumbers, visitorsForNumbers)
}

createSuite('Matching identifiers in an AST...')
  .add('with textual types', matchingWithTextual)
  .add('with numeric types', matchingWithNumeric)
  .start()

assert(identifierCountForStrings === 33)
assert(identifierCountForNumbers === 33)
