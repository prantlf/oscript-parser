/* eslint-disable camelcase */

import { checkType } from './checks'

export default class Regex {
  match (text) {
    checkType(text, 'string', 1)
    if (!this._expr) throw new Error('pattern not set')
    return this._expr.test(text)
  }

  setpattern (text) {
    checkType(text, 'string', 1)
    this._expr = new RegExp(text)
  }
}
