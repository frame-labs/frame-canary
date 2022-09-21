import { isAbsolute, join } from 'path'
import electron, { app } from 'electron'
import Conf from 'conf'

import { latest } from '../migrations'

class PersistStore extends Conf {
  constructor(options) {
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

  queue(path, value) {
    path = `main.__.${latest}.${path}`
    this.updates = this.updates || {}
    delete this.updates[path] // maintain entry order
    this.updates[path] = JSON.parse(JSON.stringify(value))
  }

  set(path, value) {
    if (this.blockUpdates) return
    path = `main.__.${latest}.${path}`
    super.set(path, value)
  }

  clear() {
    this.blockUpdates = true
    super.clear()
  }
}

export default new PersistStore()
