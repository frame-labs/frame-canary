import { ipcRenderer } from 'electron'
let i = 0
const newId = () => ++i

const defined = (value: any) => value !== undefined || value !== null

const handlers = {}

ipcRenderer.on('main:rpc', (sender, id, ...args) => {
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  if (!handlers[id])
    return console.log('Message from main RPC had no handler:', args)
  args = args.map((arg) => (defined(arg) ? JSON.parse(arg) : arg))
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  handlers[id](...args)
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  delete handlers[id]
})

export default (...args: any[]) => {
  const cb = args.pop()
  if (typeof cb !== 'function') throw new Error('Main RPC requires a callback')
  const id = newId()
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  handlers[id] = cb
  args = args.map((arg) => (defined(arg) ? JSON.stringify(arg) : arg))
  ipcRenderer.send('main:rpc', JSON.stringify(id), ...args)
}
