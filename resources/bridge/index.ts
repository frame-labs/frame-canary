import { ipcRenderer } from 'electron'
import rpc from './rpc'

// const dev = process.env.NODE_ENV === 'development'
// const _setImmediate = setImmediate
// process.once('loaded', () => { global.setImmediate = _setImmediate })
// webFrame.executeJavaScript(`window.__initialState = ${JSON.stringify(state())}`)

const unwrap = (v: any) => (v !== undefined || v !== null ? JSON.parse(v) : v)
const wrap = (v: any) => (v !== undefined || v !== null ? JSON.stringify(v) : v)
const source = 'bridge:link'

window.addEventListener(
  'message',
  (e) => {
    if (e.origin !== 'file://') return
    const data = unwrap(e.data)
    if (e.origin === 'file://' && data.source !== source) {
      if (data.method === 'rpc')
        return rpc(...data.args, (...args: any[]) =>
          // @ts-expect-error TS(2531): Object is possibly 'null'.
          e.source.postMessage(
            wrap({ method: 'rpc', id: data.id, args, source }),
            // @ts-expect-error TS(2559): Type 'string' has no properties in common with typ... Remove this comment to see the full error message
            e.origin,
          ),
        )
      // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
      if (data.method === 'event') return ipcRenderer.send(...data.args)
      if (data.method === 'invoke') {
        ;(async () => {
          // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
          const args = await ipcRenderer.invoke(...data.args)
          window.postMessage(
            wrap({
              method: 'invoke',
              channel: 'action',
              id: data.id,
              args,
              source,
            }),
            '*',
          )
        })()
      }
    }
  },
  false,
)

ipcRenderer.on('main:action', (...args) => {
  args.shift()
  window.postMessage(
    wrap({ method: 'event', channel: 'action', args, source }),
    '*',
  )
})

ipcRenderer.on('main:flex', (...args) => {
  args.shift()
  window.postMessage(
    wrap({ method: 'event', channel: 'flex', args, source }),
    '*',
  )
})

ipcRenderer.on('main:reload:style', (e, name, ok) => {
  window.postMessage(wrap({ method: 'reload', type: 'css', target: name }), '*')
})

// ipcRenderer.on('main:location', (...args) => {
//   args.shift()
//   window.postMessage(wrap({ channel: 'location', args, source, method: 'event' }), '*')
// })

ipcRenderer.on('main:dapp', (...args) => {
  args.shift()
  window.postMessage(
    wrap({ method: 'event', channel: 'dapp', args, source }),
    '*',
  )
})
