import { Node } from 'oscript-parser'

// ============================================================
// Public API

export function interpret (ast: Node, options?: Options): ValueType

// ---------- Options

export interface Options {
  globals?: Globals
  warnings?: boolean
}

export type Globals = { [key: string]: ValueType }

export type PrimitiveType = undefined | boolean | number | string

export type ValueType = PrimitiveType | ValueType[] | { [key: string]: ValueType }

// ============================================================
// Error Handling

export interface InterpreterError extends Error {
  node: Node
}

export interface NotImplementedError extends InterpreterError {}
export interface RuntimeError extends InterpreterError {}
