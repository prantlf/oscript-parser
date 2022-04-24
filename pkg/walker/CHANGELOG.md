# Changelog

## 0.1.1

Fix typings for `findNodeAround` and `findNodeAroundWithAncestors`.

## 0.1.0

If the recursive walker fails, include the latest visited node in the error.

## 0.0.3

Skip omitted nodes for.init, slice.start and slice.end expressions during walking.

## 0.0.2

### Bug Fixes

* Recognize ObjectExpression as AssocExpression for compatibility.
* Fix walking of consequent and alternate of ConditionalExpression.

## 0.0.1

Initial release.

* Functions `simple`, `ancestor`, `full`, `fullAncestor`, `recursive`, `make`, `findNodeAround` and `findNodeAroundWithAncestors`
* Walkers encapsulated by `base`
