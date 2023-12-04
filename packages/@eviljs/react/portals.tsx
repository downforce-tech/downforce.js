import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {createPortal} from 'react-dom'
import {Box, type BoxProps} from './box.js'
import {defineContext} from './ctx.js'
import type {StateManager} from './state.js'

export const PortalsContext = defineContext<StateManager<Portals>>('PortalsContext')

/*
* EXAMPLE
*
* return (
*     <PortalsProvider>
*         <Portal name="main"/>
*
*         <Teleport to="main">
*             <p>This code is teleported inside the Portal</p>
*         </Teleport>
*     </PortalsProvider>
* )
*/
export function PortalsProvider(props: PortalsProviderProps) {
    const {children} = props
    const contextValue = useCreatePortals()

    return <PortalsContext.Provider value={contextValue} children={children}/>
}

/*
* EXAMPLE
*
* return (
*     <PortalsProvider>
*         <Portal name="main"/>
*
*         <Teleport to="main">
*             <p>This code is teleported inside the Portal</p>
*         </Teleport>
*     </PortalsProvider>
* )
*/
export function Portal(props: PortalProps) {
    const {name, ...otherProps} = props
    const [, setPortals] = useContext(PortalsContext)!

    const onRef = useCallback((element: null | Element) => {
        setPortals(state => ({
            ...state,
            [name]: element,
        }))
    }, [name, setPortals])

    useEffect(() => {
        function onClean() {
            setPortals(state => ({
                ...state,
                [name]: null,
            }))
        }

        return onClean
    }, [name])

    return <Box {...otherProps} ref={onRef}/>
}

/*
* EXAMPLE
*
* return (
*     <PortalsProvider>
*         <Portal name="main"/>
*
*         <Teleport to="main">
*             <p>This code is teleported inside the Portal</p>
*         </Teleport>
*     </PortalsProvider>
* )
*/
export function Teleport(props: TeleportProps) {
    const {to, children} = props
    const [portals] = useContext(PortalsContext)!
    const portal = portals[to]

    if (! portal) {
        return
    }

    return createPortal(children, portal)
}

export function useCreatePortals(): StateManager<Portals> {
    const [portals, setPortals] = useState<Portals>({})

    return useMemo(() => [portals, setPortals], [portals, setPortals])
}

// Types ///////////////////////////////////////////////////////////////////////

export type PortalElement = Element
export type Portals = Record<PortalId, null | PortalElement>
export type PortalId = PropertyKey

export interface PortalsProviderProps {
    children?: undefined | React.ReactNode
}

export interface PortalProps extends Omit<BoxProps, 'name'> {
    name: PortalId
}

export interface TeleportProps {
    children: React.ReactNode
    to: PortalId
}
