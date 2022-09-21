export type RPCResponsePayload = JSONRPCSuccessResponsePayload &
  JSONRPCErrorResponsePayload

export type RPCCallback<T extends RPCResponsePayload> = (res: T) => void
export type RPCErrorCallback = RPCCallback<JSONRPCErrorResponsePayload>
export type RPCSuccessCallback = RPCCallback<JSONRPCSuccessResponsePayload>
export type RPCRequestCallback = RPCCallback<RPCResponsePayload>

export type Address = string // 20 hex bytes, 0x-prefixed
enum SubscriptionType {
  ACCOUNTS = 'accountsChanged',
  ASSETS = 'assetsChanged',
  CHAIN = 'chainChanged',
  CHAINS = 'chainsChanged',
  NETWORK = 'networkChanged',
}

interface RPCId {
  id: number
  jsonrpc: '2.0'
}

interface InternalPayload {
  _origin: string
}

interface JSONRPCRequestPayload extends RPCId {
  params: readonly any[]
  method: string
  chainId?: string
}

interface JSONRPCSuccessResponsePayload extends RPCId {
  result?: any
}

interface JSONRPCErrorResponsePayload extends RPCId {
  error?: EVMError
}

interface EVMError {
  message: string
  code?: number
}

type RPCRequestPayload = JSONRPCRequestPayload & InternalPayload

declare namespace RPC {
  export namespace GetAssets {
    interface Balance {
      chainId: number
      name: string
      symbol: string
      balance: string
      decimals: number
      displayBalance: string
    }

    interface NativeCurrency extends Balance {
      currencyInfo: Currency
    }

    interface Erc20 extends Balance {
      tokenInfo: {
        lastKnownPrice: { usd: { price: number; change24hr?: number } }
      }
      address: Address
    }

    interface Assets {
      erc20?: Erc20[]
      nativeCurrency: Balance[]
    }

    interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'wallet_getAssets'
    }

    interface Response extends Omit<RPCResponsePayload, 'result'> {
      result?: Assets
    }
  }

  export namespace GetEthereumChains {
    interface Icon {
      url: string
      width?: number
      height?: number
      format?: 'png' | 'jpg' | 'svg'
    }

    interface NativeCurrency {
      name: string
      symbol: string
      decimals: number
    }

    interface Explorer {
      name?: string
      icon?: Icon[]
      url: string
      standard?: string
    }

    interface Chain {
      chainId: number
      networkId: number
      name: string
      icon: Icon[]
      nativeCurrency: NativeCurrency
      explorers: Explorer[]
    }

    interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'wallet_getEthereumChains'
    }

    interface Response extends Omit<RPCResponsePayload, 'result'> {
      result?: Chain[]
    }
  }

  export namespace SendTransaction {
    export interface TxParams {
      nonce?: string
      gasPrice?: string
      gas?: string // deprecated
      maxPriorityFeePerGas?: string
      maxFeePerGas?: string
      gasLimit?: string
      from?: Address
      to?: Address
      data?: string
      value?: string
      chainId: string
      type?: string
    }

    export interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'eth_sendTransaction'
      params: TxParams[]
    }
  }

  namespace Subscribe {
    interface Request extends Omit<RPCRequestPayload, 'method'> {
      method: 'eth_subscribe'
      params: SubscriptionType[]
    }
  }

  namespace Susbcription {
    interface Response {
      jsonrpc: '2.0'
      method: 'eth_subscription'
      params: any
    }
  }
}
