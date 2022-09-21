import { Network } from '../../@types/frame/state'

export function isNetworkConnected(network: Network) {
  return (
    (network.connection.primary && network.connection.primary.connected) ||
    (network.connection.secondary && network.connection.secondary.connected)
  )
}

export function isNetworkEnabled(network: Network) {
  return network.on
}
