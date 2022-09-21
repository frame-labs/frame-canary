import { isAbsolute, join } from 'path'
import electron, { app } from 'electron'
import Conf from 'conf'

// @ts-expect-error TS(2459): Module '"../migrations"' declares 'latest' locally... Remove this comment to see the full error message
import { latest } from '../migrations'

class PersistStore extends Conf {
  blockUpdates: any
  updates: any
  constructor(options: any) {
    options = { configFileMode: 0o600, configName: 'config', ...options }
    let defaultCwd = __dirname
    if (electron && app) defaultCwd = app.getPath('userData')
    if (options.cwd) {
      options.cwd = isAbsolute(options.cwd)
        ? options.cwd
        : join(defaultCwd, options.cwd)
    } else {
      options.cwd = defaultCwd
    }
    app.on('quit', () => this.writeUpdates())
    super(options)
    setInterval(() => this.writeUpdates(), 30 * 1000)
  }

  writeUpdates() {
    if (this.blockUpdates) return

    const updates = { ...this.updates }
    this.updates = null
    if (Object.keys(updates || {}).length > 0) super.set(updates)
  }

  queue(path: any, value: any) {
    path = `main.__.${latest}.${path}`
    this.updates = this.updates || {}
    delete this.updates[path] // maintain entry order
    this.updates[path] = JSON.parse(JSON.stringify(value))
  }

  // @ts-expect-error TS(2416): Property 'set' in type 'PersistStore' is not assig... Remove this comment to see the full error message
  set(path: any, value: any) {
    if (this.blockUpdates) return
    path = `main.__.${latest}.${path}`
    super.set(path, value)
  }

  clear() {
    this.blockUpdates = true
    super.clear()
  }
}

// @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
export default new PersistStore()
