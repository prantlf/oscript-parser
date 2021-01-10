# Microbenchmarks

How faster can be multiple string matching if the `||` conditions are divided using a `switch` by the string length at first? What difference do numeric instead of textual keys in an AST make?

46 strings, 9 different lengths:

    Matching keywords...
      divided by length x 78,062,718 ops/sec ±0.84% (89 runs sampled)
      with one condition x 31,751,401 ops/sec ±0.31% (95 runs sampled)
      using regular expression x 7,046,955 ops/sec ±0.81% (95 runs sampled)

15 strings, 6 different lengths:

    Matching types...
      divided by length x 904,448,445 ops/sec ±0.92% (94 runs sampled)
      with one condition x 890,286,331 ops/sec ±1.27% (93 runs sampled)
      using regular expression x 7,076,306 ops/sec ±0.60% (92 runs sampled)

AST consisting of 85 nodes (and 55 identifiers) from a [sample source code](./walking/object.os):

    AST size...
      with textual types - 3961 bytes (100%)
      with numeric types - 2899 bytes (73%)

    Walking an AST...
      with textual types x 321,507 ops/sec ±0.92% (95 runs sampled)
      with numeric types x 545,927 ops/sec ±0.39% (94 runs sampled)

    Matching identifiers in an AST...
      with textual types x 230,125 ops/sec ±0.83% (93 runs sampled)
      with numeric types x 344,342 ops/sec ±0.33% (96 runs sampled)
