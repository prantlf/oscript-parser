import objectWithStrings from './walking/object-strings.json'
import objectWithNumbers from './walking/object-numbers.json'

const sizeWithStrings = measure(objectWithStrings)
const sizeWithNumbers = measure(objectWithNumbers)

function measure (json) {
  return JSON.stringify(json).length
}

console.log('AST size...')
console.log(`  with textual types - ${sizeWithStrings} bytes (100%)`)
console.log(`  with numeric types - ${sizeWithNumbers} bytes (${parseInt(sizeWithNumbers / sizeWithStrings * 100)}%)`)
