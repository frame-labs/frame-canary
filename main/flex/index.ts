// Flex is a reverse RPC interface for calling into the renderer's chromium process and recieving callbacks/events

// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'EventEmitt... Remove this comment to see the full error message
const EventEmitter = require('events')
const { ipcMain } = require('electron')
const { v4: uuid } = require('uuid')
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'log'.
const log = require('electron-log')

const windows = require('../windows')

const defined = (value: any) => value !== undefined || value !== null

class Flex extends EventEmitter {
  setReady() {
    this.ready = true
    this.emit('ready')
  }

  rpc(...args: any[]) {
    const cb = args.pop()
    if (typeof cb !== 'function')
      throw new Error('Flex methods require a callback')
    const id = uuid()
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    handlers[id] = cb
    args = args.map((arg) => (defined(arg) ? JSON.stringify(arg) : arg))
    windows.send('tray', 'main:flex', JSON.stringify(id), ...args)
  }
}

const flex = new Flex()

flex.setMaxListeners(128)

const handlers = {}

ipcMain.on('tray:flex:res', (sender, id, ...args) => {
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  if (!handlers[id]) return log.warn('Message from main RPC had no handler')
  args = args.map((arg) => (defined(arg) ? JSON.parse(arg) : arg))
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  handlers[id](...args)
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  delete handlers[id]
})

ipcMain.on('tray:flex:event', (sender, eventName, ...args) => {
  args = args.map((arg) => (defined(arg) ? JSON.parse(arg) : arg))
  flex.emit(eventName, ...args)
})

ipcMain.on('tray:ready', () => flex.setReady())

// If flex is already ready, trigger new 'ready' listeners
flex.on('newListener', (e: any, listener: any) => {
  if (e === 'ready' && flex.ready) listener()
})

module.exports = flex
