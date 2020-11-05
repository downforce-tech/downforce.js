import React from 'react'
import ReactDOM from 'react-dom'
const {createElement, createContext, memo, useContext, useEffect, useMemo, useRef, useState} = React
const {createPortal} = ReactDOM

export const PortalContext = createContext<PortalElement | null>(null)

PortalContext.displayName = 'StdPortalContext'

/*
* EXAMPLE
*
* return (
*     <PortalProvider children={Portal =>
*         <Fragment>
*             <Portal tag="section"/>
*         </Fragment>
*     </PortalProvider>
* )
*/
export function PortalProvider(props: PortalProviderProps) {
    return withPortal(props.children)
}

/*
* EXAMPLE
*
* export function MyMain(props) {
*     const main = withQuery(<MyMain/>, fetch)
*
*     return <main/>
* }
*/
export function withPortal(children?: PortalProviderChild) {
    const [portal, setPortal] = useState<PortalElement | null>(null)

    function Portal(props: PortalProps) {
        const {tag, ...otherProps} = props
        const portalRef = useRef<PortalElement | null>(null)

        const elTag = tag ?? 'div'
        const elProps = {...otherProps, ref: portalRef}

        useEffect(() => {
            // This does not lead to an infinite recursive update due to the
            // same identity React check (===). It's safe to try to update the
            // state on every render.
            setPortal(state => portalRef.current)
        })

        return createElement(elTag, elProps)
    }

    const MemoPortal = useMemo(() => {
        return memo(Portal)
    }, [])

    return (
        <PortalContext.Provider value={portal}>
            {children?.(MemoPortal)}
        </PortalContext.Provider>
    )
}

/*
* EXAMPLE
*
* return (
*     <PortalProvider children={Portal =>
*         <Fragment>
*             <Teleport>
*                 <h1>Portal Usage Example</h1>
*                 <p>This code is teleported inside the Portal</p>
*             </Teleport>
*
*             <Portal/>
*         </Fragment>
*     </PortalProvider>
* )
*/
export function Teleport(props: TeleportProps) {
    const {children} = props
    const portal = useContext(PortalContext)

    if (! portal) {
        return null
    }

    return createPortal(children, portal)
}

// Types ///////////////////////////////////////////////////////////////////////

export type PortalElement = HTMLElement | SVGElement

export interface PortalProviderProps {
    children?: PortalProviderChild
}

export interface PortalProviderChild {
    (portal: React.ElementType<PortalProps>): React.ReactNode
}

export interface PortalProps {
    tag?: keyof React.ReactDOM
    [key: string]: unknown
}

export interface TeleportProps {
    children: JSX.Element
}
