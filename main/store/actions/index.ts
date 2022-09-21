import log from 'electron-log'
// @ts-expect-error TS(1192): Module '"/Users/amlcodes/development/projects/fram... Remove this comment to see the full error message
import panelActions from './panel'

const supportedNetworkTypes = ['ethereum']

function switchChainForOrigins(origins: any, oldChainId: any, newChainId: any) {
  // @ts-expect-error TS(2339): Property 'chain' does not exist on type 'unknown'.
  Object.entries(origins).forEach(([origin, { chain }]) => {
    if (oldChainId === chain.id) {
      origins[origin].chain = { id: newChainId, type: 'ethereum' }
    }
  })
}

function validateNetworkSettings(network: any) {
  const networkId = parseInt(network.id)

  if (
    !Number.isInteger(networkId) ||
    typeof network.type !== 'string' ||
    typeof network.name !== 'string' ||
    typeof network.explorer !== 'string' ||
    typeof network.symbol !== 'string' ||
    !supportedNetworkTypes.includes(network.type)
  ) {
    throw new Error(`Invalid network settings: ${JSON.stringify(network)}`)
  }

  return networkId
}

function includesToken(tokens: any, token: any) {
  const existingAddress = token.address.toLowerCase()
  return tokens.some(
    (t: any) =>
      t.address.toLowerCase() === existingAddress &&
      t.chainId === token.chainId,
  )
}

module.exports = {
  ...panelActions,
  // setSync: (u, key, payload) => u(key, () => payload),
  activateNetwork: (u: any, type: any, chainId: any, active: any) => {
    u('main.networks', type, chainId, 'on', () => active)
    if (!active) {
      u('main', (main: any) => {
        // If de-activating a network that an origin is currently using, switch them to mainnet
        switchChainForOrigins(main.origins, chainId, 1)
        return main
      })
    }
  },
  selectPrimary: (u: any, netType: any, netId: any, value: any) => {
    u(
      'main.networks',
      netType,
      netId,
      'connection.primary.current',
      () => value,
    )
  },
  selectSecondary: (u: any, netType: any, netId: any, value: any) => {
    u(
      'main.networks',
      netType,
      netId,
      'connection.secondary.current',
      () => value,
    )
  },
  setPrimaryCustom: (u: any, netType: any, netId: any, target: any) => {
    if (!netType || !netId) return
    u(
      'main.networks',
      netType,
      netId,
      'connection.primary.custom',
      () => target,
    )
  },
  setSecondaryCustom: (u: any, netType: any, netId: any, target: any) => {
    if (!netType || !netId) return
    u(
      'main.networks',
      netType,
      netId,
      'connection.secondary.custom',
      () => target,
    )
  },
  toggleConnection: (u: any, netType: any, netId: any, node: any, on: any) => {
    u(
      'main.networks',
      netType,
      netId,
      'connection',
      node,
      'on',
      (value: any) => {
        return on !== undefined ? on : !value
      },
    )
  },
  setPrimary: (u: any, netType: any, netId: any, status: any) => {
    u('main.networks', netType, netId, 'connection.primary', (primary: any) => {
      return Object.assign({}, primary, status)
    })
  },
  setSecondary: (u: any, netType: any, netId: any, status: any) => {
    u(
      'main.networks',
      netType,
      netId,
      'connection.secondary',
      (secondary: any) => {
        return Object.assign({}, secondary, status)
      },
    )
  },
  setLaunch: (u: any, launch: any) => u('main.launch', (_: any) => launch),
  toggleLaunch: (u: any) => u('main.launch', (launch: any) => !launch),
  toggleReveal: (u: any) => u('main.reveal', (reveal: any) => !reveal),
  toggleNonceAdjust: (u: any) =>
    u('main.nonceAdjust', (nonceAdjust: any) => !nonceAdjust),
  setPermission: (u: any, address: any, permission: any) => {
    u('main.permissions', address, (permissions = {}) => {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      permissions[permission.handlerId] = permission
      return permissions
    })
  },
  clearPermissions: (u: any, address: any) => {
    u('main.permissions', address, () => {
      return {}
    })
  },
  toggleAccess: (u: any, address: any, handlerId: any) => {
    u('main.permissions', address, (permissions: any) => {
      permissions[handlerId].provider = !permissions[handlerId].provider
      return permissions
    })
  },
  setAccountCloseLock: (u: any, value: any) => {
    u('main.accountCloseLock', () => Boolean(value))
  },
  syncPath: (u: any, path: any, value: any) => {
    if (!path || path === '*' || path.startsWith('main')) return // Don't allow updates to main state
    u(path, () => value)
  },
  dontRemind: (u: any, version: any) => {
    u('main.updater.dontRemind', (dontRemind: any) => {
      if (!dontRemind.includes(version)) {
        return [...dontRemind, version]
      }
      return dontRemind
    })
  },
  setAccount: (u: any, account: any) => {
    u('selected.current', (_: any) => account.id)
    u('selected.minimized', (_: any) => false)
    u('selected.open', (_: any) => true)
  },
  setAccountSignerStatusOpen: (u: any, value: any) => {
    u('selected.signerStatusOpen', () => Boolean(value))
  },
  accountTokensUpdated: (u: any, address: any) => {
    u('main.accounts', address, (account: any) => {
      const balances = {
        ...account.balances,
        lastUpdated: new Date().getTime(),
      }
      const updated = { ...account, balances }
      return updated
    })
  },
  updateAccount: (u: any, updatedAccount: any) => {
    u('main.accounts', updatedAccount.id, (account: any) => {
      // if (account) return updatedAccount // Account exists
      // if (add) return updatedAccount // Account is new and should be added
      return { ...updatedAccount, balances: (account || {}).balances }
    })
  },
  removeAccount: (u: any, id: any) => {
    u('main.accounts', (accounts: any) => {
      delete accounts[id]
      return accounts
    })
  },
  removeSigner: (u: any, id: any) => {
    u('main.signers', (signers: any) => {
      delete signers[id]
      return signers
    })
  },
  updateSigner: (u: any, signer: any) => {
    if (!signer.id) return
    u('main.signers', signer.id, (prev: any) => ({
      ...prev,
      ...signer,
    }))
  },
  newSigner: (u: any, signer: any) => {
    u('main.signers', (signers: any) => {
      signers[signer.id] = { ...signer, createdAt: new Date().getTime() }
      return signers
    })
  },
  setLatticeConfig: (u: any, id: any, key: any, value: any) => {
    u('main.lattice', id, key, () => value)
  },
  updateLattice: (u: any, deviceId: any, update: any) => {
    if (deviceId && update)
      u('main.lattice', deviceId, (current = {}) =>
        Object.assign(current, update),
      )
  },
  removeLattice: (u: any, deviceId: any) => {
    if (deviceId) {
      u('main.lattice', (lattice = {}) => {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        delete lattice[deviceId]
        return lattice
      })
    }
  },
  setLatticeAccountLimit: (u: any, limit: any) => {
    u('main.latticeSettings.accountLimit', () => limit)
  },
  setLatticeEndpointMode: (u: any, mode: any) => {
    u('main.latticeSettings.endpointMode', () => mode)
  },
  setLatticeEndpointCustom: (u: any, url: any) => {
    u('main.latticeSettings.endpointCustom', () => url)
  },
  setLatticeDerivation: (u: any, value: any) => {
    u('main.latticeSettings.derivation', () => value)
  },
  setLedgerDerivation: (u: any, value: any) => {
    u('main.ledger.derivation', () => value)
  },
  setTrezorDerivation: (u: any, value: any) => {
    u('main.trezor.derivation', () => value)
  },
  setLiveAccountLimit: (u: any, value: any) => {
    u('main.ledger.liveAccountLimit', () => value)
  },
  setHardwareDerivation: (u: any, value: any) => {
    u('main.hardwareDerivation', () => value)
  },
  setMenubarGasPrice: (u: any, value: any) => {
    u('main.menubarGasPrice', () => value)
  },
  muteAlphaWarning: (u: any) => {
    u('main.mute.alphaWarning', () => true)
  },
  muteWelcomeWarning: (u: any) => {
    u('main.mute.welcomeWarning', () => true)
  },
  toggleExplorerWarning: (u: any) => {
    u('main.mute.explorerWarning', (v: any) => !v)
  },
  toggleGasFeeWarning: (u: any) => {
    u('main.mute.gasFeeWarning', (v: any) => !v)
  },
  toggleSignerCompatibilityWarning: (u: any) => {
    u('main.mute.signerCompatibilityWarning', (v: any) => !v)
  },
  setAltSpace: (u: any, v: any) => {
    u('main.shortcuts.altSlash', () => v)
  },
  setAutohide: (u: any, v: any) => {
    u('main.autohide', () => v)
  },
  setErrorReporting: (u: any, enable: any) => {
    u('main.privacy.errorReporting', () => enable)
  },
  setGasFees: (u: any, netType: any, netId: any, fees: any) => {
    u('main.networksMeta', netType, netId, 'gas.price.fees', () => fees)
  },
  setGasPrices: (u: any, netType: any, netId: any, prices: any) => {
    u('main.networksMeta', netType, netId, 'gas.price.levels', () => prices)
  },
  setGasDefault: (u: any, netType: any, netId: any, level: any, price: any) => {
    u('main.networksMeta', netType, netId, 'gas.price.selected', () => level)
    if (level === 'custom') {
      u(
        'main.networksMeta',
        netType,
        netId,
        'gas.price.levels.custom',
        () => price,
      )
    } else {
      u('main.networksMeta', netType, netId, 'gas.price.lastLevel', () => level)
    }
  },
  setNativeCurrencyData: (u: any, netType: any, netId: any, currency: any) => {
    u(
      'main.networksMeta',
      netType,
      netId,
      'nativeCurrency',
      (existing: any) => ({
        ...existing,
        ...currency,
      }),
    )
  },
  addNetwork: (u: any, net: any) => {
    try {
      net.id = validateNetworkSettings(net)
      const primaryRpc = net.primaryRpc || ''
      const secondaryRpc = net.secondaryRpc || ''
      delete net.primaryRpc
      delete net.secondaryRpc
      const defaultNetwork = {
        id: 0,
        type: '',
        name: '',
        explorer: '',
        gas: {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' },
          },
        },
        connection: {
          presets: { local: 'direct' },
          primary: {
            on: true,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: primaryRpc,
          },
          secondary: {
            on: false,
            current: 'custom',
            status: 'loading',
            connected: false,
            type: '',
            network: '',
            custom: secondaryRpc,
          },
        },
        on: true,
      }
      const defaultMeta = {
        blockHeight: 0,
        name: net.name,
        symbol: net.symbol,
        nativeCurrency: {
          symbol: net.symbol,
          icon: '',
          name: '',
          decimals: 18,
        },
        gas: {
          price: {
            selected: 'standard',
            levels: { slow: '', standard: '', fast: '', asap: '', custom: '' },
          },
        },
      }
      u('main', (main: any) => {
        if (!main.networks[net.type]) main.networks[net.type] = {}
        if (main.networks[net.type][net.id]) return main // Network already exists, don't overwrite, notify user
        main.networks[net.type][net.id] = { ...defaultNetwork, ...net }
        main.networksMeta[net.type][net.id] = { ...defaultMeta }
        return main
      })
    } catch (e) {
      log.error(e)
    }
  },
  updateNetwork: (u: any, net: any, newNet: any) => {
    try {
      net.id = validateNetworkSettings(net)
      newNet.id = validateNetworkSettings(newNet)
      u('main', (main: any) => {
        const updatedNetwork = Object.assign(
          {},
          main.networks[net.type][net.id],
          newNet,
        )
        Object.keys(updatedNetwork).forEach((k) => {
          if (typeof updatedNetwork[k] === 'string') {
            updatedNetwork[k] = updatedNetwork[k].trim()
          }
        })
        delete main.networks[net.type][net.id]
        main.networks[updatedNetwork.type][updatedNetwork.id] = updatedNetwork
        // @ts-expect-error TS(2339): Property 'chain' does not exist on type 'unknown'.
        Object.entries(main.origins).forEach(([origin, { chain }]) => {
          if (net.id === chain.id) {
            main.origins[origin].chain = updatedNetwork
          }
        })
        return main
      })
    } catch (e) {
      log.error(e)
    }
  },
  removeNetwork: (u: any, net: any) => {
    try {
      net.id = parseInt(net.id)
      // Cannot delete mainnet
      if (!Number.isInteger(net.id)) throw new Error('Invalid chain id')
      if (net.type === 'ethereum' && net.id === 1)
        throw new Error('Cannot remove mainnet')
      u('main', (main: any) => {
        if (Object.keys(main.networks[net.type]).length <= 1) {
          return main // Cannot delete last network without adding a new network of this type first
        }
        // If deleting a network that an origin is currently using, switch them to mainnet
        switchChainForOrigins(main.origins, net.id, 1)
        if (main.networks[net.type]) {
          delete main.networks[net.type][net.id]
          delete main.networksMeta[net.type][net.id]
        }
        return main
      })
    } catch (e) {
      log.error(e)
    }
  },
  // Flow
  addDapp: (
    u: any,
    namehash: any,
    data: any,
    options = { docked: false, added: false },
  ) => {
    u(`main.dapp.details.${namehash}`, () => data)
    u('main.dapp.map', (map: any) => {
      if (options.docked && map.docked.length <= 10) {
        map.docked.push(namehash)
      } else {
        map.added.unshift(namehash)
      }
      return map
    })
  },
  setDappOpen: (u: any, ens: any, open: any) => {
    u('main.openDapps', (dapps: any) => {
      if (open) {
        if (dapps.indexOf(ens) === -1) dapps.push(ens)
      } else {
        dapps = dapps.filter((e: any) => e !== ens)
      }
      return dapps
    })
  },
  removeDapp: (u: any, namehash: any) => {
    u('main.dapp.details', (dapps: any) => {
      dapps = { ...dapps }
      delete dapps[namehash]
      return dapps
    })
    u('main.dapp.map', (map: any) => {
      let index = map.added.indexOf(namehash)
      if (index !== -1) {
        map.added.splice(index, 1)
      } else {
        index = map.docked.indexOf(namehash)
        if (index !== -1) map.docked.splice(index, 1)
      }
      return map
    })
  },
  moveDapp: (
    u: any,
    fromArea: any,
    fromIndex: any,
    toArea: any,
    toIndex: any,
  ) => {
    u('main.dapp.map', (map: any) => {
      const hash = map[fromArea][fromIndex]
      map[fromArea].splice(fromIndex, 1)
      map[toArea].splice(toIndex, 0, hash)
      return map
    })
  },
  setDappStorage: (u: any, hash: any, state: any) => {
    if (state) u(`main.dapp.storage.${hash}`, () => state)
  },
  initOrigin: (u: any, originId: any, origin: any) => {
    u('main.origins', (origins: any) => {
      const now = new Date().getTime()
      const createdOrigin = {
        ...origin,
        session: {
          requests: 1,
          startedAt: now,
          lastUpdatedAt: now,
        },
      }
      return { ...origins, [originId]: createdOrigin }
    })
  },
  addOriginRequest: (u: any, originId: any) => {
    const now = new Date().getTime()
    u('main.origins', originId, (origin: any) => {
      // start a new session if the previous one has already ended
      const isNewSession = origin.session.startedAt < origin.session.endedAt
      const startedAt = isNewSession ? now : origin.session.startedAt
      const requests = isNewSession ? 1 : origin.session.requests + 1
      return {
        ...origin,
        session: {
          requests,
          startedAt,
          endedAt: undefined,
          lastUpdatedAt: now,
        },
      }
    })
  },
  endOriginSession: (u: any, originId: any) => {
    u('main.origins', (origins: any) => {
      const origin = origins[originId]
      if (origin) {
        const now = new Date().getTime()
        const session = Object.assign({}, origin.session, {
          endedAt: now,
          lastUpdatedAt: now,
        })
        origins[originId] = Object.assign({}, origin, { session })
      }
      return origins
    })
  },
  switchOriginChain: (u: any, originId: any, chainId: any, type: any) => {
    if (originId && typeof chainId === 'number' && type === 'ethereum') {
      u('main.origins', originId, (origin: any) => ({
        ...origin,
        chain: { id: chainId, type },
      }))
    }
  },
  clearOrigins: (u: any) => {
    u('main.origins', () => ({}))
  },
  removeOrigin: (u: any, originId: any) => {
    u('main.origins', (origins: any) => {
      delete origins[originId]
      return origins
    })
  },
  setBlockHeight: (u: any, chainId: any, blockHeight: any) => {
    u('main.networksMeta.ethereum', chainId, (chainMeta: any) => ({
      ...chainMeta,
      blockHeight,
    }))
  },
  expandDock: (u: any, expand: any) => {
    u('dock.expand', (s: any) => expand)
  },
  pin: (u: any) => {
    u('main.pin', (pin: any) => !pin)
  },
  saveAccount: (u: any, id: any) => {
    u('main.save.account', () => id)
  },
  setIPFS: (u: any, ipfs: any) => {
    u('main.ipfs', () => ipfs)
  },
  setRates: (u: any, rates: any) => {
    u('main.rates', (existingRates = {}) => ({ ...existingRates, ...rates }))
  },
  // Inventory
  setInventory: (u: any, address: any, inventory: any) => {
    u('main.inventory', address, () => inventory)
  },
  setBalance: (u: any, address: any, balance: any) => {
    u('main.balances', address, (balances = []) => {
      const existingBalances = balances.filter(
        (b) =>
          (b as any).address !== balance.address ||
          (b as any).chainId !== balance.chainId,
      )
      return [...existingBalances, balance]
    })
  },
  // Tokens
  setBalances: (u: any, address: any, newBalances: any) => {
    u('main.balances', address, (balances = []) => {
      const existingBalances = balances.filter((b) => {
        return newBalances.every(
          (bal: any) =>
            bal.chainId !== (b as any).chainId ||
            bal.address !== (b as any).address,
        )
      })
      // TODO: possibly add an option to filter out zero balances
      //const withoutZeroBalances = Object.entries(updatedBalances)
      //.filter(([address, balanceObj]) => !(new BigNumber(balanceObj.balance)).isZero())
      return [...existingBalances, ...newBalances]
    })
  },
  removeBalance: (u: any, chainId: any, address: any) => {
    u('main.balances', (balances = {}) => {
      const key = address.toLowerCase()
      for (const accountAddress in balances) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        const balanceIndex = balances[accountAddress].findIndex(
          (balance: any) =>
            balance.chainId === chainId &&
            balance.address.toLowerCase() === key,
        )
        if (balanceIndex > -1) {
          // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
          balances[accountAddress].splice(balanceIndex, 1)
        }
      }
      return balances
    })
  },
  setScanning: (u: any, address: any, scanning: any) => {
    if (scanning) {
      u('main.scanning', address, () => true)
    } else {
      setTimeout(() => {
        u('main.scanning', address, () => false)
      }, 1000)
    }
  },
  omitToken: (u: any, address: any, omitToken: any) => {
    u('main.accounts', address, 'tokens.omit', (omit: any) => {
      omit = omit || []
      if (omit.indexOf(omitToken) === -1) omit.push(omitToken)
      return omit
    })
  },
  addCustomTokens: (u: any, tokens: any) => {
    u('main.tokens.custom', (existing: any) => {
      // remove any tokens that have been overwritten by one with
      // the same address and chain ID
      const existingTokens = existing.filter(
        (token: any) => !includesToken(tokens, token),
      )
      const tokensToAdd = tokens.map((t: any) => ({
        ...t,
        address: t.address.toLowerCase(),
      }))
      return [...existingTokens, ...tokensToAdd]
    })
  },
  removeCustomTokens: (u: any, tokens: any) => {
    u('main.tokens.custom', (existing: any) => {
      return existing.filter((token: any) => !includesToken(tokens, token))
    })
  },
  addKnownTokens: (u: any, address: any, tokens: any) => {
    u('main.tokens.known', address, (existing = []) => {
      const existingTokens = existing.filter(
        (token) => !includesToken(tokens, token),
      )
      const tokensToAdd = tokens.map((t: any) => ({
        ...t,
        address: t.address.toLowerCase(),
      }))
      return [...existingTokens, ...tokensToAdd]
    })
  },
  removeKnownTokens: (u: any, address: any, tokens: any) => {
    u('main.tokens.known', address, (existing = []) => {
      return existing.filter((token) => !includesToken(tokens, token))
    })
  },
  setColorway: (u: any, colorway: any) => {
    u('main.colorway', () => {
      return colorway
    })
  },
  // Dashboard
  toggleDash: (u: any, force: any) => {
    u('dash.showing', (s: any) =>
      force === 'hide' ? false : force === 'show' ? true : !s,
    )
  },
  closeDash: (u: any) => {
    u('dash.showing', () => false)
    u('dash.nav', () => []) // Reset nav
  },
  setDash: (u: any, update: any) => {
    if (!update.showing) {
      u('dash.nav', () => []) // Reset nav
    }
    u('dash', (dash: any) => Object.assign(dash, update))
  },
  navForward: (u: any, windowId: any, crumb: any) => {
    if (!windowId || !crumb)
      return log.warn('Invalid nav forward', windowId, crumb)
    u('windows', windowId, 'nav', (nav: any) => {
      if (JSON.stringify(nav[0]) !== JSON.stringify(crumb)) nav.unshift(crumb)
      return nav
    })
    u('windows', windowId, 'showing', () => true)
  },
  navUpdate: (u: any, windowId: any, crumb: any, navigate: any) => {
    if (!windowId || !crumb)
      return log.warn('Invalid nav forward', windowId, crumb)
    u('windows', windowId, 'nav', (nav: any) => {
      const updatedNav = {
        view: nav[0].view || crumb.view,
        data: Object.assign({}, nav[0].data, crumb.data),
      }
      if (JSON.stringify(nav[0]) !== JSON.stringify(updatedNav)) {
        if (navigate) {
          nav.unshift(updatedNav)
        } else {
          nav[0] = updatedNav
        }
      }
      return nav
    })
    if (navigate) u('windows', windowId, 'showing', () => true)
  },
  navClearReq: (u: any, handlerId: any) => {
    u('windows.panel.nav', (nav: any) => {
      const newNav = nav.filter((navItem: any) => {
        const item = navItem || {}
        return !item?.req?.handlerId === handlerId
      })
      return newNav
    })
  },
  navBack: (u: any, windowId: any) => {
    if (!windowId) return log.warn('Invalid nav back', windowId)
    u('windows', windowId, 'nav', (nav: any) => {
      nav.shift()
      return nav
    })
  },
  navDash: (u: any, navItem: any) => {
    u('dash.nav', (nav: any) => {
      if (JSON.stringify(nav[0]) !== JSON.stringify(navItem))
        nav.unshift(navItem)
      return nav
    })
    u('dash.showing', () => true)
  },
  backDash: (u: any, numSteps = 1) => {
    u('dash.nav', (nav: any) => {
      while (numSteps > 0 && nav.length > 0) {
        nav.shift()
        numSteps -= 1
      }
      return nav
    })
  },
  muteBetaDisclosure: (u: any) => {
    u('main.mute.betaDisclosure', () => true)
    const navItem = { view: 'accounts', data: {} }
    u('dash.nav', (nav: any) => {
      if (JSON.stringify(nav[0]) !== JSON.stringify(navItem))
        nav.unshift(navItem)
      return nav
    })
    u('dash.showing', () => true)
  },
  muteAragonAccountMigrationWarning: (u: any) => {
    u('main.mute.aragonAccountMigrationWarning', () => true)
    u('dash.showing', () => true)
  },
  // Dapp Frame
  appDapp: (u: any, dapp: any) => {
    u('main.dapps', (dapps: any) => {
      if (dapps && !dapps[dapp.id]) {
        dapps[dapp.id] = dapp
      }
      return dapps || {}
    })
  },
  updateDapp: (u: any, dappId: any, update: any) => {
    u('main.dapps', (dapps: any) => {
      if (dapps && dapps[dappId]) {
        dapps[dappId] = Object.assign({}, dapps[dappId], update)
      }
      return dapps || {}
    })
  },
  addFrame: (u: any, frame: any) => {
    u('main.frames', frame.id, () => frame)
  },
  updateFrame: (u: any, frameId: any, update: any) => {
    u('main.frames', frameId, (frame: any) => Object.assign({}, frame, update))
  },
  removeFrame: (u: any, frameId: any) => {
    u('main.frames', (frames: any) => {
      delete frames[frameId]
      return frames
    })
  },
  focusFrame: (u: any, frameId: any) => {
    u('main.focusedFrame', () => frameId)
  },
  addFrameView: (u: any, frameId: any, view: any) => {
    if (frameId && view) {
      u('main.frames', frameId, (frame: any) => {
        let existing
        Object.keys(frame.views).some((viewId) => {
          if (frame.views[viewId].dappId === view.dappId) {
            existing = viewId
            return true
          } else {
            return false
          }
        })
        if (!existing) {
          frame.views = frame.views || {}
          frame.views[view.id] = view
          frame.currentView = view.id
        } else {
          frame.currentView = existing
        }
        return frame
      })
    }
  },
  setCurrentFrameView: (u: any, frameId: any, viewId: any) => {
    if (frameId) {
      u('main.frames', frameId, (frame: any) => {
        frame.currentView = viewId
        return frame
      })
    }
  },
  updateFrameView: (u: any, frameId: any, viewId: any, update: any) => {
    u('main.frames', frameId, 'views', (views: any) => {
      if (
        (update.show && views[viewId].ready) ||
        (update.ready && views[viewId].show)
      ) {
        Object.keys(views).forEach((id) => {
          if (id !== viewId) views[id].show = false
        })
      }
      views[viewId] = Object.assign({}, views[viewId], update)
      return views
    })
  },
  removeFrameView: (u: any, frameId: any, viewId: any) => {
    u('main.frames', frameId, 'views', (views: any) => {
      delete views[viewId]
      return views
    })
  },
  unsetAccount: (u: any) => {
    u('selected.minimized', (_: any) => true)
    u('selected.open', (_: any) => false)
    u('selected.view', (_: any) => 'default')
    u('selected.showAccounts', (_: any) => false)
    u('windows.panel.nav', () => [])
    setTimeout((_) => {
      u('selected', (signer: any) => {
        signer.last = signer.current
        signer.current = ''
        signer.requests = {}
        signer.view = 'default'
        return signer
      })
    }, 320)
  },
  setAccountFilter: (u: any, value: any) => {
    u('panel.accountFilter', () => value)
  },
  // toggleUSDValue: (u) => {
  //   u('main.showUSDValue', show => !show)
  // }
  // __overwrite: (path, value) => u(path, () => value)
}
