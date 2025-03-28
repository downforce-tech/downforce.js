import {call} from '@downforce/std/fn-call'
import {compute} from '@downforce/std/fn-compute'
import {mapSome} from '@downforce/std/fn-monad'
import type {Io, Task} from '@downforce/std/fn-type'
import type {ReactiveObserver, ReactiveWatchOptions} from '@downforce/std/reactive'
import {readReactive, watchReactive, writeReactive, type ReactiveProtocol, type ReactiveValuesOf} from '@downforce/std/reactive'
import type {RwSync} from '@downforce/std/rw'
import {useCallback, useEffect, useLayoutEffect, useMemo, useState} from 'react'
import {useRenderSignal, type RenderSignal} from './render.js'
import type {StateManager, StateSetterArg} from './state.js'

export function useReactiveState<V>(reactive: ReactiveProtocol<V>): StateManager<V> {
    const [value, PRIVATE_setValue] = useState(() => readReactive(reactive))

    const setValue = useCallback((value: StateSetterArg<V>) => {
        const newValue = compute(value, readReactive(reactive))

        PRIVATE_setValue(newValue)
        writeReactive(reactive, newValue)
    }, [reactive])

    useEffect(() => {
        const onClean = watchReactive(reactive, PRIVATE_setValue, {immediate: true})

        return onClean
    }, [reactive])

    return [value, setValue]
}

export function useReactiveValue<V>(reactive: ReactiveProtocol<V>): V {
    const signal = useReactiveSignal(reactive)

    return readReactive(reactive)
}

export function useReactiveValues<A extends Array<ReactiveProtocol<any>>>(
    reactives: readonly [...A]
): ReactiveValuesOf<A> {
    const signal = useReactiveSignals(reactives)

    const values = useMemo(() => {
        return reactives.map(readReactive) as ReactiveValuesOf<A>
    }, [reactives, signal])

    return values
}

export function useReactiveList<A extends Array<ReactiveProtocol<any>>>(
    reactives: readonly [...A]
): readonly [...A] {
    const signal = useReactiveSignals(reactives)

    const values = useMemo(() => {
        return [...reactives] as readonly [...A]
    }, [reactives, signal])

    return values
}

export function useReactiveMemo<A extends Array<ReactiveProtocol<any>>, V>(
    reactives: readonly [...A],
    computer: (...args: ReactiveValuesOf<A>) => V
): V {
    const signal = useReactiveSignals(reactives)

    const computedValue = useMemo(() => {
        return computer(...reactives.map(readReactive) as ReactiveValuesOf<A>)
    }, [reactives, computer, signal])

    return computedValue
}

export function useReactiveSelect<V, R>(reactive: ReactiveProtocol<V>, selector: Io<V, R>, deps?: undefined | Array<unknown>): R
export function useReactiveSelect<V, R>(reactive: undefined | ReactiveProtocol<V>, selector: Io<undefined | V, R>, deps?: undefined | Array<unknown>): undefined | R
export function useReactiveSelect<V, R>(reactive: undefined | ReactiveProtocol<V>, selector: Io<undefined | V, R>, deps?: undefined | Array<unknown>): undefined | R {
    const selectedValue = selector(mapSome(reactive, readReactive))
    const [signal, setSignal] = useState(selectedValue)

    useEffect(() => {
        if (! reactive) {
            return
        }

        const onClean = watchReactive(
            reactive,
            newValue => {
                setSignal(selector(newValue))
            },
            {immediate: true},
        )

        return onClean
    }, [reactive, ...(deps ?? [])])

    return selectedValue
}

export function useReactiveStore<V>(
    read: RwSync<V>['read'],
    write: RwSync<V>['write'],
    watch: (observer: ReactiveObserver<V>, options?: undefined | ReactiveWatchOptions) => Task,
): StateManager<V> {
    const [value, PRIVATE_setValue] = useState(read())

    const setValue = useCallback((value: StateSetterArg<V>) => {
        const newValue = compute(value, read())

        PRIVATE_setValue(newValue)
        write(newValue)
    }, [read, write])

    useEffect(() => {
        const onClean = watch(PRIVATE_setValue, {immediate: true})

        return onClean
    }, [watch])

    return [value, setValue]
}

export function useReactiveSignal(reactive: undefined | ReactiveProtocol<any>): RenderSignal {
    const [signal, notifySignal] = useRenderSignal()

    // We use useLayoutEffect (instead of useEffect) to watch the reactive as soon as possible,
    // avoiding missed notifications.
    useLayoutEffect(() => {
        if (! reactive) {
            return
        }

        const onClean = watchReactive(reactive, notifySignal)

        return onClean
    }, [reactive, notifySignal])

    return signal
}

export function useReactiveSignals(
    reactives: Array<ReactiveProtocol<any>> | readonly [...Array<ReactiveProtocol<any>>],
): RenderSignal {
    const [signal, notifySignal] = useRenderSignal()

    // We use useLayoutEffect (instead of useEffect) to watch the reactives as soon as possible,
    // avoiding missed notifications.
    useLayoutEffect(() => {
        const cleaningTasks = reactives.map(it => watchReactive(it, notifySignal))

        function onClean() {
            cleaningTasks.forEach(call)
        }

        return onClean
    }, [reactives, notifySignal])

    return signal
}

export function ReactiveState<V>(props: ReactiveStateProps<V>): React.ReactNode {
    const {children, from} = props

    return children(useReactiveState(from))
}

export function ReactiveValue<V>(props: ReactiveValueProps<V>): React.ReactNode {
    const {children, of} = props

    return children(useReactiveState(of)[0])
}

export function ReactiveValues<A extends Array<ReactiveProtocol<any>>>(props: ReactiveValuesProps<A>): React.ReactNode {
    const {children, of} = props

    return children(useReactiveValues(of))
}

// Types ///////////////////////////////////////////////////////////////////////

export interface ReactiveStateProps<V> {
    from: ReactiveProtocol<V>
    children(value: StateManager<V>): React.ReactNode
}

export interface ReactiveValueProps<V> {
    of: ReactiveProtocol<V>
    children(value: V): React.ReactNode
}

export interface ReactiveValuesProps<A extends Array<ReactiveProtocol<any>>> {
    of: readonly [...A]
    children(values: ReactiveValuesOf<A>): React.ReactNode
}
