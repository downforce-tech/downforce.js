import '~/style/index.css'

import {createContainer} from '@eviljs/std/container'
import {createRoot} from 'react-dom/client'
import {ContainerSpec} from '~/container/container-apis'
import * as Env from '~/env/env-apis'
import {Root, RootContext, RootIsolate} from '~/root/root'
import {setupRootElement} from '~/root/root-apis'

console.table({...Env})

const container = createContainer(ContainerSpec)
const rootElement = setupRootElement()
const root = createRoot(rootElement)

root.render(
    <RootContext container={container}>
        <RootIsolate/>
        <Root/>
    </RootContext>
)
