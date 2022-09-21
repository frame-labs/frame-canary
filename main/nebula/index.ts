/* eslint-disable @typescript-eslint/ban-ts-comment */
// delete the Electron version while requiring Nebula. this allows ipfs-utils to use
// node-fetch instead of electron-fetch
const electron = process.versions.electron

// @ts-expect-error TS(2704): The operand of a 'delete' operator cannot be a rea... Remove this comment to see the full error message
delete process.versions.electron

import nebula from 'nebula'

// @ts-expect-error TS(2540): Cannot assign to 'electron' because it is a read-o... Remove this comment to see the full error message
process.versions.electron = electron
//@ts-ignore
import EthereumProvider from 'ethereum-provider'
import proxyConnection from '../provider/proxy'
import { EventEmitter } from 'stream'

const authToken = process.env.NEBULA_AUTH_TOKEN
  ? process.env.NEBULA_AUTH_TOKEN + '@'
  : ''
const pylonUrl = `https://${authToken}@ipfs.nebula.land`

// all ENS interaction happens on mainnet
const mainnetProvider = new EthereumProvider(proxyConnection)
mainnetProvider.setChain(1)

export default function (provider = mainnetProvider) {
  let ready = false
  const events = new EventEmitter()

  provider.on('connect', () => {
    ready = true
    events.emit('ready')
  })

  return {
    once: events.once.bind(events),
    ready: () => ready,
    ...nebula(pylonUrl, provider),
  }
}
