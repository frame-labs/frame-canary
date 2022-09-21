import { v4 } from 'uuid'
import EventEmitter from 'events'

const source = 'tray:link'

const unwrap = (v: any) => (v !== undefined || v !== null ? JSON.parse(v) : v)
const wrap = (v: any) => (v !== undefined || v !== null ? JSON.stringify(v) : v)

const handlers = {}

// @ts-expect-error TS(7022): 'link' implicitly has type 'any' because it does n... Remove this comment to see the full error message
const link = (new EventEmitter()(link as any).rpc = (...args: any[]) => {
  const cb = args.pop()
  if (typeof cb !== 'function') throw new Error('link.rpc requires a callback')
  const id = v4()
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  handlers[id] = cb
  window.postMessage(wrap({ id, args, source, method: 'rpc' }), '*')
})
;(link as any).send = (...args: any[]) => {
  window.postMessage(wrap({ args, source, method: 'event' }), '*')
}
;(link as any).invoke = (...args: any[]) => {
  return new Promise((resolve, reject) => {
    const id = v4()
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    handlers[id] = resolve
    window.postMessage(wrap({ id, args, source, method: 'invoke' }), '*')
  })
}

window.addEventListener(
  'message',
  (e) => {
    if (e.origin !== 'file://') return
    const data = unwrap(e.data)
    const args = data.args || []
    if (e.origin === 'file://' && data.source !== source) {
      if (data.method === 'rpc') {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (!handlers[data.id])
          return console.log('link.rpc response had no handler')
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        handlers[data.id](...args)
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        delete handlers[data.id]
      } else if (data.method === 'invoke') {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        if (!handlers[data.id])
          return console.log('link.invoke response had no handler')
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        handlers[data.id](args)
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        delete handlers[data.id]
      } else if (data.method === 'event') {
        if (!data.channel) return console.log('link.on event had no channel')
        link.emit(data.channel, ...args)
      } else if (data.method === 'reload') {
        if (data.type === 'css') {
          document.querySelectorAll('link').forEach((sheet) => {
            if (
              (sheet as any).visited !== true &&
              sheet.href.indexOf(data.target) > -1
            ) {
              if (
                (sheet as any).isLoaded === false ||
                !sheet.href ||
                !(sheet.href.indexOf('.css') > -1)
              )
                return
              ;(sheet as any).visited = true
              const clone = sheet.cloneNode()
              ;(clone as any).isLoaded = false
              clone.addEventListener('load', () => {
                ;(clone as any).isLoaded = true
                sheet.remove()
              })
              clone.addEventListener('error', () => {
                ;(clone as any).isLoaded = true
                sheet.remove()
              })
              ;(clone as any).href = sheet.href
              // @ts-expect-error TS(2531): Object is possibly 'null'.
              sheet.parentNode.appendChild(clone)
            }
          })
        }
      }
    }
  },
  false,
)

export default link
