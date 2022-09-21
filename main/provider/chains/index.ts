// @ts-expect-error TS(7016): Could not find a declaration file for module 'deep... Remove this comment to see the full error message
import deepEqual from 'deep-equal'
import { Network } from 'trezor-connect'
import { RPC } from '../../../@types/frame/rpc'
import { Origin, NetworkMetadata } from '../../../@types/frame/state'

import store from '../../store'

// typed access to state
const storeApi = {
  getCurrentOrigins: (): Record<string, Origin> => {
    return store('main.origins')
  },
  getChains: (): Record<string, Network> => {
    return store('main.networks.ethereum') || {}
  },
  getChainsMeta: (): Record<string, NetworkMetadata> => {
    return store('main.networksMeta.ethereum') || {}
  },
}

interface ChainsChangedHandler {
  chainsChanged: (chains: RPC.GetEthereumChains.Chain[]) => void
}

interface ChainChangedHandler {
  chainChanged: (chainId: number, originId: string) => void
}

interface NetworkChangedHandler {
  networkChanged: (networkId: number, originId: string) => void
}

function createChainsObserver(handler: ChainsChangedHandler) {
  let availableChains = getActiveChains()

  return function () {
    const currentChains = getActiveChains()

    if (!deepEqual(currentChains, availableChains)) {
      availableChains = currentChains
      handler.chainsChanged(availableChains)
    }
  }
}

function createOriginChainObserver(
  handler: ChainChangedHandler & NetworkChangedHandler,
) {
  const knownOrigins: Record<string, Origin> = {}

  return function () {
    const currentOrigins = storeApi.getCurrentOrigins()

    for (const originId in currentOrigins) {
      const currentOrigin = currentOrigins[originId]
      const knownOrigin = knownOrigins[originId]

      if (knownOrigin && knownOrigin.chain.id !== currentOrigin.chain.id) {
        handler.chainChanged(currentOrigin.chain.id, originId)
        handler.networkChanged(currentOrigin.chain.id, originId)
      }

      knownOrigins[originId] = currentOrigin
    }
  }
}

function getActiveChains(): RPC.GetEthereumChains.Chain[] {
  const chains = storeApi.getChains()
  const meta = storeApi.getChainsMeta()

  return Object.values(chains)
    .filter((chain) => (chain as any).on)
    .sort((a, b) => (a as any).id - (b as any).id)
    .map((chain) => {
      // @ts-expect-error TS(2339): Property 'id' does not exist on type 'Network'.
      const { id, explorer, name } = chain
      const { nativeCurrency } = meta[id]
      const {
        icon: currencyIcon,
        name: currencyName,
        symbol,
        decimals,
      } = nativeCurrency
      const icons = currencyIcon ? [{ url: currencyIcon }] : []
      return {
        chainId: id,
        networkId: id,
        name,
        nativeCurrency: {
          name: currencyName,
          symbol,
          decimals,
        },
        icon: icons,
        explorers: [{ url: explorer }],
      }
    })
}

export { getActiveChains, createChainsObserver, createOriginChainObserver }
