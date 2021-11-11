import {classes} from '@eviljs/react/react'
import {useI18nMsg} from 'lib/hooks'
import {Header} from 'lib/widgets/header'

import './home-view.css'

export function HomeView(props: HomeViewProps) {
    const {className, ...otherProps} = props

    const msg = useI18nMsg(({ translate }) => {
        return {
            title: translate('Home'),
        }
    })

    return (
        <div
            {...otherProps}
            className={classes('HomeView-0d51 std std-theme-light', className)}
        >
            <Header/>

            <h1 className="page-title">
                {msg.title}
            </h1>
        </div>
    )
}

// Types ///////////////////////////////////////////////////////////////////////

export interface HomeViewProps extends React.HTMLAttributes<HTMLDivElement> {
}
