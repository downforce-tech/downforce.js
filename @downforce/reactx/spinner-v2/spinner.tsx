import {classes} from '@downforce/react/classes'
import type {ElementProps, Props} from '@downforce/react/props'

export function Spinner(props: Props<SpinnerProps>): React.JSX.Element {
    const {active, className, ...otherProps} = props

    return (
        <div
            {...otherProps}
            className={classes('Spinner-5b07', className)}
            data-active={String(active)}
        />
    )
}

// Types ///////////////////////////////////////////////////////////////////////

export interface SpinnerProps extends ElementProps<'div'> {
    active: boolean
}
