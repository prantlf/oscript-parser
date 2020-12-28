import { performance } from 'perf_hooks'

function mark (name, enable) {
  let start
  if (enable) {
    console.log(`--> <${name}>`)
    start = performance.now()
  }
  return start
}

function measure (name, start) {
  if (start) {
    const end = performance.now()
    console.log(`<-- <${name}> time: ${Math.round(end - start)}ms`)
  }
}

export { mark, measure }
