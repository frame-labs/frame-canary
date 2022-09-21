import React from 'react'
import Restore from 'react-restore'

import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { setupComponent } from '../../../../componentSetup'
import AddChainComponent from '../../../../../dash/App/Notify/AddChain'
import {
  beforeEach,
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  test,
  jest,
  afterEach,
} from '@jest/globals'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({ send: jest.fn() }))

const AddChain = Restore.connect(AddChainComponent, store)

beforeAll(() => {
  jest.useFakeTimers()

  store.removeNetwork({ type: 'ethereum', id: 137 })
})

afterAll(() => {
  jest.useRealTimers()
})

describe('rendering', () => {
  it('renders the first provided RPC as the primary RPC', () => {
    const { getByLabelText } = setupComponent(
      <AddChain chain={{ primaryRpc: 'https://myrpc.polygon.net' }} />,
    )

    const primaryRpcInput = getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('https://myrpc.polygon.net')
  })

  it('renders the default primary RPC text', () => {
    const { getByLabelText } = setupComponent(<AddChain chain={{}} />)

    const primaryRpcInput = getByLabelText('Primary RPC')
    expect(primaryRpcInput.value).toEqual('Primary Endpoint')
  })

  it('renders the second provided RPC as the secondary RPC', () => {
    const { getByLabelText } = setupComponent(
      <AddChain
        chain={{ secondaryRpc: 'https://my-backup-rpc.polygon.net' }}
      />,
    )

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('https://my-backup-rpc.polygon.net')
  })

  it('renders the default secondary RPC text', () => {
    const { getByLabelText } = setupComponent(<AddChain chain={{}} />)

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    expect(secondaryRpcInput.value).toEqual('Secondary Endpoint')
  })

  it('renders the title', () => {
    const { getByRole } = setupComponent(<AddChain chain={{}} />)

    const titleSection = getByRole('title')
    expect(titleSection.textContent).toBe('Add New Chain')
  })

  it('renders the submit button text', () => {
    const { getByRole } = setupComponent(
      <AddChain chain={{ id: 137, name: 'Polygon' }} />,
    )

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Add Chain')
  })

  it('renders the correct text after the form is submitted', async () => {
    const { user, getByRole } = setupComponent(
      <AddChain chain={{ id: 137, name: 'Polygon' }} />,
    )

    await user.click(getByRole('button'))

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toBe('Creating')
  })

  it('renders a warning if the entered chain id already exists', () => {
    const { getByRole } = setupComponent(
      <AddChain chain={{ id: 1, name: 'Mainnet' }} />,
    )

    const submitButton = getByRole('button')
    expect(submitButton.textContent).toMatch(/chain id already exists/i)
  })
})

describe('submitting', () => {
  it('does not allow submit if the chain id already exists', async () => {
    store.addNetwork({
      id: 1,
      type: 'ethereum',
      name: 'Mainnet',
      explorer: 'https://etherscan.io',
      symbol: 'ETH',
      on: true,
      connection: {
        primary: { connected: true },
      },
    })

    const { user, getByRole } = setupComponent(
      <AddChain chain={{ id: 1, name: 'Mainnet' }} />,
    )

    await user.click(getByRole('button'))

    expect(link.send).not.toHaveBeenCalled()
  })

  it('adds a valid chain', async () => {
    const { user, getByRole } = setupComponent(
      <AddChain
        chain={{
          id: 42162,
          type: 'ethereum',
          name: 'Arbitrum Rinkeby',
          symbol: 'ETH',
          explorer: 'https://rinkeby.arbiscan.io',
          primaryRpc: 'https://arbitrum-rinkeby.infura.com',
          secondaryRpc: 'https://myrpc.arbrink.net',
          layer: 'sidechain',
        }}
      />,
    )

    await user.click(getByRole('button'))

    expect(link.send).toHaveBeenNthCalledWith(1, 'tray:addChain', {
      id: 42162,
      name: 'Arbitrum Rinkeby',
      symbol: 'ETH',
      explorer: 'https://rinkeby.arbiscan.io',
      type: 'ethereum',
      layer: 'sidechain',
      primaryRpc: 'https://arbitrum-rinkeby.infura.com',
      secondaryRpc: 'https://myrpc.arbrink.net',
    })
  })

  it('allows the user to change RPCs before submitting', async () => {
    const { user, getByRole, getByLabelText } = setupComponent(
      <AddChain
        chain={{
          id: 42162,
          name: 'Arbitrum Rinkeby',
          primaryRpc: 'https://arbitrum-rinkeby.infura.com',
          secondaryRpc: 'https://myrpc.arbrink.net',
        }}
      />,
    )

    const primaryRpcInput = getByLabelText('Primary RPC')
    await user.clear(primaryRpcInput)
    await user.type(primaryRpcInput, 'https://arbitrum-rpc.mydomain.com')

    const secondaryRpcInput = getByLabelText('Secondary RPC')
    await user.clear(secondaryRpcInput)
    await user.type(secondaryRpcInput, 'https://myrpc-rinkeby.arbitrum.io')

    await user.click(getByRole('button'))

    expect(link.send).toHaveBeenNthCalledWith(
      1,
      'tray:addChain',
      expect.objectContaining({
        primaryRpc: 'https://arbitrum-rpc.mydomain.com',
        secondaryRpc: 'https://myrpc-rinkeby.arbitrum.io',
      }),
    )
  })
})
