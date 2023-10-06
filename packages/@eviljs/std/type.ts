import type {FnArgs} from './fn.js'

export const Tests = {
    array: isArray,
    boolean: isBoolean,
    date: isDate,
    defined: isDefined,
    function: isFunction,
    integer: isInteger,
    nil: isNil,
    null: isNull,
    number: isNumber,
    object: isObject,
    promise: isPromise,
    regexp: isRegExp,
    some: isSome,
    string: isString,
    undefined: isUndefined,
}

export function kindOf<T extends keyof typeof Tests>(value: unknown, ...tests: Array<T>): undefined | T {
    for (const kind of tests) {
        const test = Tests[kind] as ((value: unknown) => boolean)

        if (test(value)) {
            return kind
        }
    }
    return
}

// Tests ///////////////////////////////////////////////////////////////////////

export function isDefined<V>(value: void | undefined | V): value is V {
    return ! isUndefined(value)
}

export function isNil(value: unknown): value is Nil {
    return isUndefined(value) || isNull(value)
}

export function isNull(value: unknown): value is null {
    return value === null
}

export function isSome<V>(value: Nil | V): value is V {
    return ! isNil(value)
}

export function isUndefined(value: unknown): value is undefined {
    return value === void undefined
}

export function isArray(value: unknown): value is Array<unknown> {
    if (! value) {
        return false
    }
    if (! Array.isArray(value)) {
        return false
    }
    return true
}

export function isBoolean(value: unknown): value is boolean {
    return value === true || value === false
    // return typeof value !== "boolean"
}

export function isDate(value: unknown): value is Date {
    return value
        ? (value instanceof Date)
        : false
}

export function isFunction<O, A extends FnArgs, R>(value: O | ((...args: A) => R)): value is ((...args: A) => R)
export function isFunction(value: unknown): value is Function {
    if (! value) {
        return false
    }
    if (typeof value !== 'function') {
        return false
    }
    return true
}

export function isNumber(value: unknown): value is number {
    // We don't consider NaN a number.
    return typeof value === 'number' && ! isNaN(value)
}

export function isInteger(value: unknown): value is number {
    return Number.isInteger(value as any)
}

export function isObject(value: unknown): value is Record<PropertyKey, unknown> {
    if (! value) {
        return false
    }

    // Remember, remember, the fifth of November.
    // typeof null === 'object'. God damn JavaScript!

    const proto = Object.getPrototypeOf(value)

    if (! proto) {
        // FIXME: TODO: how to handle Object.create(null)?
        return false
    }
    if (proto.constructor !== Object) {
        return false
    }
    return true
}

export function isPromise(value: unknown): value is Promise<unknown> {
    return value
        ? (value instanceof Promise)
        : false
}

export function isRegExp(value: unknown): value is RegExp {
    return value
        ? (value instanceof RegExp)
        : false
}

export function isString(value: unknown): value is string {
    return typeof value === 'string' || value instanceof String
}

// Casts ///////////////////////////////////////////////////////////////////////

// export function asArray<V, I>(value: V | readonly I[]): [V] | readonly I[]
// export function asArray<V, I>(value: V | I[]): V[] | I[]
export function asArray<V, T extends unknown[]>(value: V | [...T]): [V] | [...T]
export function asArray<V, T extends unknown[]>(value: V | readonly [...T]): [V] | readonly [...T]
export function asArray<V, I>(value: V | Array<I>): [V] | Array<I>
export function asArray<V>(value: V | Array<V>): Array<V>
export function asArray<V>(value: V | Array<V>): Array<V> {
    return isArray(value)
        ? value as Array<V>
        : [value] as Array<V>
}

export function asBoolean(value: unknown): undefined | boolean {
    return isBoolean(value)
        ? value
        : undefined
}

export function asBooleanLike(value: unknown): undefined | boolean {
    switch (value) {
        case true: case 1: case '1': case 'yes': case 'on': case 'true':
            return true
        case false: case 0: case '0': case 'no': case 'off': case 'false':
            return false
    }
    return
}

export function asDate(value: number | Date): Date
export function asDate(value: unknown): undefined | Date
export function asDate(value: unknown): undefined | Date {
    if (isNil(value)) {
        return
    }
    if (isDate(value)) {
        return value
    }
    if (isNumber(value)) {
        return new Date(value)
    }
    if (isString(value)) {
        // Date.parse() is omnivorous:
        // it accepts everything, and everything not string is returned as NaN.
        return asDate(Date.parse(value))
    }
    return // Makes TypeScript happy.
}

export function asNumber(value: number): number
export function asNumber(value: unknown): undefined | number
export function asNumber(value: unknown): undefined | number {
    if (isNumber(value)) {
        return value
    }
    if (! isString(value)) {
        // Only strings should be parsed:
        // - null and Arrays would be parsed as 0
        // - Symbols would throws an error
        return
    }

    const result = Number(value)

    if (isNaN(result)) {
        return
    }
    return result
}


export function asInteger(value: number): number
export function asInteger(value: unknown): undefined | number
export function asInteger(value: unknown): undefined | number {
    const numberOptional = asNumber(value)

    if (isUndefined(numberOptional)) {
        return
    }

    return Math.trunc(numberOptional)
}

// Types ///////////////////////////////////////////////////////////////////////

export type Nil = undefined | null
export type Some<T> = NonNullable<T>

export type Defined<T> = {
    [P in keyof T]-?: Exclude<T[P], undefined>
}

export type Undefined<T> = {
    [K in keyof T]?: undefined | T[K]
}

export type UndefinedDeep<T> = {
    [K in keyof T]?: undefined | (T[K] extends object ? UndefinedDeep<T[K]> : T[K])
}

export type Unsafe<T> =
    T extends Nil | boolean | number | string | symbol
        ? Nil | T
    : T extends Array<infer I>
        ? Nil | Array<Unsafe<I>>
    : T extends object
        ? Nil | {[key in keyof T]?: Nil | Unsafe<T[key]>}
    : unknown

export type ValueOf<T> = T[keyof T]

export type ElementOf<A extends Array<unknown>> =
    A extends Array<infer T>
        ? T
        : never

export type UnionOf<T extends Array<unknown>> = T[number]

export type Writable<T> = { -readonly [P in keyof T]: T[P] }
export type WritableDeep<T> = { -readonly [P in keyof T]: WritableDeep<T[P]> }

export type Prettify<T> = {} & {
    [K in keyof T]: T[K]
}
