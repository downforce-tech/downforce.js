import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'

/*
* Used to access the previous value of a prop.
*
* EXAMPLE
*
* function MyComponent(props) {
*     const {selected} = props
*     const prevSelected = usePrevious(props.selected)
* }
*/
export function usePrevious<T>(value: T) {
    const ref = useRef<T>()

    useEffect(() => {
        ref.current = value
    })

    return ref.current
}

/*
* Used to perform an asynchronous task only on a mounted component.
*
* EXAMPLE
*
* function MyComponent(props) {
*     const [state, setState] = useState()
*     const ifMounted = useIfMounted()
*
*     useEffect(() => {
*         promise.then((value) =>
*             ifMounted(() =>
*                 setState(value)
*             )
*         )
*     }, [])
* }
*/
export function useIfMounted() {
    const mountedRef = useMountedRef()

    function guard<R>(task: () => R) {
        if (mountedRef.current) {
            return task()
        }
        return // Makes TypeScript happy.
    }

    return guard
}

/*
* Used to perform an asynchronous task only on a mounted component.
*
* EXAMPLE
* function MyComponent(props) {
*     const [state, setState] = useState()
*     const guardMounted = useMountedGuard()
*
*     useEffect(() => {
*         promise.then(guardMounted((value) =>
*             setState(value)
*         ))
*     }, [])
* }
*/
export function useMountedGuard() {
    const mountedRef = useMountedRef()

    function createMountedGuard<A extends Array<unknown>, R>(task: (...args: A) => R) {
        function guard(...args: A) {
            if (mountedRef.current) {
                return task(...args)
            }
            return // Makes TypeScript happy.
        }

        return guard
    }

    return createMountedGuard
}

/*
* Used to track the mounted state of a component. Useful inside async tasks.
*
* EXAMPLE
*
* function MyComponent(props) {
*     const [state, setState] = useState()
*     const mountedRef = useMountedRef()
*
*     useEffect(() => {
*         promise.then((value) =>
*             if (mountedRef.current) {
*                 setState(value)
*             }
*         )
*     }, [])
* }
*/
export function useMountedRef() {
    const mountedRef = useRef(true)

    // We use useLayoutEffect() instead of useEffect() because in React 17
    // useEffect() became asynchronous (it was synchronous); which means that
    // the useEffect() destructor is called by the React 17 scheduler in a next
    // future (with low priority), but not right after the component has been
    // unmounted. useLayoutEffect() destructor instead remains synchronous, and
    // that's what we need to reflect as soon as possible the state
    // (mounted/unmounted) inside the reference.
    useLayoutEffect(() => {
        function unmount() {
            mountedRef.current = false
        }

        return unmount
    }, [])

    return mountedRef
}

/*
* Used to force the rendering of a component.
*
* EXAMPLE
*
* function MyComponent(props) {
*     const render = useRender()
*
*     useEffect(() => {
*         promise.then((value) => {
*             // Do something, then
*             render()
*         })
*     }, [])
* }
*/
export function useRender() {
    const [, setShouldRender] = useState(-1)

    const render = useCallback(() => {
        setShouldRender(state => -1 * state)
    }, [])

    return render
}
