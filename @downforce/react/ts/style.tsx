import {getMapValue} from '@downforce/std/map'
import {useContext, useInsertionEffect, useMemo} from 'react'
import {defineContext} from './ctx.js'

export const StyleContext: React.Context<undefined | StyleContextValue> = defineContext<StyleContextValue>('StyleContext')

/*
* EXAMPLE
*
* return (
*     <StyleProvider>
*         <MyApp/>
*     </StyleProvider>
* )
*/
export function StyleProvider(props: StyleProviderProps): React.JSX.Element {
    const {attach: attachOptional, children, clean: cleanOptional} = props
    const attach: StyleDelegate = attachOptional ?? attachStyleInsideHead
    const clean: undefined | StyleDelegate = cleanOptional !== false
        ? (cleanOptional ?? cleanStyleInsideHead)
        : undefined

    const contextValue = useMemo((): StyleContextValue => {
        const stylesMap: StylesMap = new Map()

        return {
            stylesMap,
            cleanStyle(style) {
                const styleInfo = stylesMap.get(style)

                if (! styleInfo) {
                    // Empty style. It is not injected.
                    return
                }

                styleInfo.references -= 1

                if (! clean) {
                    return
                }
                if (styleInfo.references > 0) {
                    return
                }

                clean(style, styleInfo.hash)
            },
            useStyle(style) {
                if (! style || ! style.trim()) {
                    // We skip empty styles.
                    return
                }

                const styleInfo = getMapValue(stylesMap, style, (): StylesMapValue => ({
                    hash: computeSimpleFastHash(style),
                    references: 0,
                }))

                if (styleInfo.references === 0) {
                    attach(style, styleInfo.hash)
                }

                styleInfo.references += 1
            },
        }
    }, [])

    return <StyleContext value={contextValue} children={children}/>
}

export function useStyleContext(): undefined | StyleContextValue {
    return useContext(StyleContext)
}

export function useStyle(style: string): void {
    const stylesManager = useStyleContext()!

    useInsertionEffect(() => {
        stylesManager.useStyle(style)

        function onClean() {
            stylesManager.cleanStyle(style)
        }

        return onClean
    }, [stylesManager, style])
}

export function computeSimpleFastHash(string: string): string {
    let hash = 0
    for (let idx = 0, size = string.length; idx < size; ++idx) {
        hash = ((hash << 5) - hash + string.charCodeAt(idx)) | 0
    }
    return String(string.length) + '-' + (hash >>> 0).toString(36)
}

export function attachStyleInsideHead(style: string, hash: string): void {
    const existingStyleElement = document.querySelector(`style[data-style-id="${hash}"]`)

    if (existingStyleElement) {
        return
    }

    const styleElement = document.createElement('style')
    styleElement.dataset.styleId = hash
    styleElement.textContent = style
    document.head.appendChild(styleElement)
}

export function cleanStyleInsideHead(style: string, hash: string): void {
    const styleElement = document.querySelector(`style[data-style-id="${hash}"]`)

    if (! styleElement) {
        return
    }

    styleElement.remove()
}

// Types ///////////////////////////////////////////////////////////////////////

export interface StyleProviderProps {
    attach?: undefined | StyleDelegate
    children?: undefined | React.ReactNode
    clean?: undefined | false | StyleDelegate
}

export interface StyleContextValue {
    stylesMap: StylesMap
    cleanStyle(style: string): void
    useStyle(style: string): void
}

export type StyleDelegate = (style: string, hash: string) => void
export type StylesMap = Map<string, StylesMapValue>
export type StylesMapValue = {hash: string, references: number}
