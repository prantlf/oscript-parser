import { Node } from 'oscript-parser'

export type PrimitiveType = undefined | boolean | number | string

export type ValueType = PrimitiveType | ValueType[] | { [key: string]: ValueType }

export type Globals = { [key: string]: ValueType }

export function interpret (ast: Node, globals: Globals): void
