import { EventEmitter } from 'stream'
import { RPCRequestPayload } from '../../@types/frame/rpc'

class ProviderProxyConnection extends EventEmitter {
  constructor() {
    super()

    process.nextTick(() => this.emit('connect'))
  }

  async send(payload: RPCRequestPayload) {
    this.emit('provider:send', payload)
  }
}

export default new ProviderProxyConnection()
