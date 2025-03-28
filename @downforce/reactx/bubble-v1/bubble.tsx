import {Box, type BoxProps} from '@downforce/react/box'
import {classes} from '@downforce/react/classes'

export function Bubble(props: BubbleProps): React.JSX.Element {
    const {className, arrowPosition, ...otherProps} = props

    return (
        <Box
            {...otherProps}
            className={classes('Bubble-85f2', className)}
            data-arrow-position={arrowPosition}
        />
    )
}

// Types ///////////////////////////////////////////////////////////////////////

export interface BubbleProps extends BoxProps {
    arrowPosition: 'top' | 'left' | 'right' | 'bottom'
}
