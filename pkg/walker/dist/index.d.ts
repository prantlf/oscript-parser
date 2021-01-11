import { Node, SourceLocation } from 'oscript-parser'

export type SimplePreCallback<TState> = (
  node: Node,
  state: TState,
  parent: Node | null
) => boolean | any

export type SimplePostCallback<TState> = (
  node: Node,
  state: TState,
  parent: Node | null
) => void

export interface SimpleCallbacks<TState> {
  pre?: SimplePreCallback<TState>
  post?: SimplePostCallback<TState>
}

export type SimpleVisitors<TState> = {
  [type: string]: SimpleCallbacks<TState>
}

export type AncestorPreCallback<TState> = (
  node: Node,
  state: TState,
  ancestors: Node[]
) => boolean | any

export type AncestorPostCallback<TState> = (
  node: Node,
  state: TState,
  ancestors: Node[]
) => void

export interface AncestorCallbacks<TState> {
  pre?: AncestorPreCallback<TState>
  post?: AncestorPostCallback<TState>
}

export type AncestorVisitors<TState> = {
  [type: string]: AncestorCallbacks<TState>
}

export type WalkerCallback<TState> = (node: Node, state: TState) => void

export type RecursiveCallback<TState> = (
  node: Node,
  state: TState,
  walk: WalkerCallback<TState>
) => void

export type RecursiveVisitors<TState> = {
  [type: string]: RecursiveCallback<TState>
}

type FindPredicate<TState> = ((node: Node, state: TState, parent: Node | null) => boolean | any) | string

export interface FindPredicates<TState> {
  pre?: FindPredicate<TState>
  post: FindPredicate<TState>
}

export interface FindResult<TState> {
  node: Node
  state: TState
  parent: Node | null
}

type FindPredicateWithAncestors<TState> = ((
  node: Node,
  state: TState,
  ancestors: Node[]
) => boolean | any) | string

export interface FindPredicatesWithAncestors<TState> {
  pre?: FindPredicateWithAncestors<TState>
  post: FindPredicateWithAncestors<TState>
}

export interface FindResultWithAncestors<TState> {
  node: Node
  state: TState
  ancestors: Node[]
}

export function simple<TState> (
  node: Node,
  visitors: SimpleVisitors<TState>,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): void

export function ancestor<TState> (
  node: Node,
  visitors: AncestorVisitors<TState>,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): void

export function full<TState> (
  node: Node,
  callbacks: SimpleVisitors<TState>,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): void

export function fullAncestor<TState> (
  node: Node,
  callbacks: AncestorVisitors<TState>,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): void

export function recursive<TState> (
  node: Node,
  functions?: RecursiveVisitors<TState>,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): void

export function make<TState> (
  functions: RecursiveVisitors<TState>,
  baseVisitor?: RecursiveVisitors<TState>
): RecursiveVisitors<TState>

export function findNodeAround<TState> (
  node: Node,
  position: SourceLocation,
  test?: FindPredicates<TState> | FindPredicate<TState> | string,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): FindResult<TState> | undefined

export function findNodeAroundWithAncestors<TState> (
  node: Node,
  position: SourceLocation,
  test?: FindPredicatesWithAncestors<TState> | FindPredicateWithAncestors<TState> | string,
  baseVisitor?: RecursiveVisitors<TState>,
  state?: TState
): FindResultWithAncestors<TState> | undefined

export interface RecursiveWalkError extends Error {
  node: Node
}
