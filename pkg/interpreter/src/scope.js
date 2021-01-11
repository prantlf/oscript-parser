export default class Scope {
  constructor (upper, init) {
    this._upper = upper
    this._vars = new Map()
    if (init) for (const name in init) this.setOwn(name, init[name])
  }

  get upper () { return this._upper }

  hasOwn (name) {
    return this._vars.has(name)
  }

  has (name) {
    return !!this._findScope(name)
  }

  getOwn (name) {
    return this._vars.get(name)
  }

  get (name) {
    const scope = this._findScope(name)
    return scope && scope.getOwn(name)
  }

  setOwn (name, value) {
    this._vars.set(name, value)
  }

  set (name, value) {
    const scope = this._findScope(name)
    if (scope) {
      scope.setOwn(name, value)
      return true
    }
  }

  _findScope (name) {
    let current = this
    do {
      if (current.hasOwn(name)) return current
      current = current._upper
    } while (current)
  }
}
