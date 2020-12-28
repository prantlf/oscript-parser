const slice = Array.prototype.slice

// A sprintf implementation using %index (beginning at 1) to input
// arguments in the format string.
//
// Example:
//   // Unexpected function in token
//   sprintf('Unexpected %2 in %1.', 'token', 'function');

export default function (format) {
  const args = slice.call(arguments, 1)
  return format.replace(/%(\d)/g, (match, index) => '' + args[index - 1])
}
