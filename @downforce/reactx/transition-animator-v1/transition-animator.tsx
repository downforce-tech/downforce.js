import {Box, type BoxProps} from '@downforce/react/box'
import {classes} from '@downforce/react/classes'
import type {ValueOf} from '@downforce/std/type'

export const TransitionEffect = {
    Fade: 'std-transition-fade' as const,
    Leak: 'std-transition-leak' as const,
    None: 'std-transition-none' as const,
    SkidLeft: 'std-transition-skid-left' as const,
    Zoom: 'std-transition-zoom' as const,
}

export function TransitionAnimator(props: TransitionAnimatorProps): React.JSX.Element {
    const {className, effect, ...otherProps} = props

    return (
        <Box
            {...otherProps}
            className={classes('TransitionAnimator-c385', className, effect)}
        />
    )
}

// Types ///////////////////////////////////////////////////////////////////////

export interface TransitionAnimatorProps extends BoxProps {
    effect: TransitionEffectEnum
}

export type TransitionEffectEnum = ValueOf<typeof TransitionEffect> & string
