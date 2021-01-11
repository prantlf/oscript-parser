import Regex from './library/regex'

const defaults = {
  assoc () { return {} },
  boolean () { return false },
  integer () { return 0 },
  list () { return [] },
  long () { return 0 },
  real () { return 0 },
  regex () { return new Regex() },
  string () { return '' }
}

export default function getDefaultValue (type) {
  const getter = defaults[type]
  return getter && getter()
}
