import { ipcMain, dialog } from 'electron'
import { readFile } from 'fs'
import { isAddress } from 'web3-utils'
import { randomBytes } from 'crypto'

import accounts from '../accounts'
import signers from '../signers'
// @ts-expect-error TS(2306): File '/Users/amlcodes/development/projects/frame/m... Remove this comment to see the full error message
import { status as _status } from '../launch'
import provider from '../provider'
import store from '../store'
// @ts-expect-error TS(2614): Module '"../dapps"' has no exported member 'add'. ... Remove this comment to see the full error message
import { add, launch as _launch, remove as _remove, move } from '../dapps'
// const ens = require('../ens')
// const ipfs = require('../ipfs')

import { resolveName } from '../accounts/aragon'
import { arraysEqual, randomLetters } from '../../resources/utils'
import { default as TrezorBridge } from '../../main/signers/trezor/bridge'

const rpc = {
  getState: (cb: any) => {
    cb(null, store())
  },
  getFrameId(window: any, cb: any) {
    if (window.frameId) {
      cb(null, window.frameId)
    } else {
      cb(new Error('No frameId set for this window'))
    }
  },
  signTransaction: accounts.signTransaction,
  signMessage: accounts.signMessage,
  getAccounts: accounts.getAccounts,
  getCoinbase: accounts.getCoinbase,
  // Review
  // getSigners: signers.getSigners,
  setSigner: (id: any, cb: any) => {
    const previousAddresses = accounts.getSelectedAddresses()

    accounts.setSigner(id, cb)

    const currentAddresses = accounts.getSelectedAddresses()

    if (!arraysEqual(previousAddresses, currentAddresses)) {
      provider.accountsChanged(currentAddresses)
    }
  },
  // setSignerIndex: (index, cb) => {
  //   accounts.setSignerIndex(index, cb)
  //   provider.accountsChanged(accounts.getSelectedAddresses())
  //   setTimeout(() => {
  //     accounts.balanceScan()
  //   }, 320)
  // },
  unsetSigner: (id: any, cb: any) => {
    const previousAddresses = accounts.getSelectedAddresses()

    accounts.unsetSigner(cb)

    const currentAddresses = accounts.getSelectedAddresses()

    if (!arraysEqual(previousAddresses, currentAddresses)) {
      provider.accountsChanged(currentAddresses)
    }
  },
  // setSignerIndex: signers.setSignerIndex,
  // unsetSigner: signers.unsetSigner,
  trezorPin: (id: any, pin: any, cb: any) => {
    cb()
    TrezorBridge.pinEntered(id, pin)
  },
  trezorPhrase: (id: any, phrase: any, cb: any) => {
    cb()
    TrezorBridge.passphraseEntered(id, phrase)
  },
  trezorEnterPhrase: (id: any, cb: any) => {
    cb()
    TrezorBridge.enterPassphraseOnDevice(id)
  },
  createLattice: (deviceId: any, deviceName: any, cb: any) => {
    if (!deviceId) {
      return cb(new Error('No Device ID'))
    }

    store.updateLattice(deviceId, {
      deviceId,
      baseUrl: 'https://signing.gridpl.us',
      endpointMode: 'default',
      paired: true,
      deviceName: (deviceName || 'GridPlus').substring(0, 14),
      tag: randomLetters(6),
      privKey: randomBytes(32).toString('hex'),
    })

    cb(null, { id: 'lattice-' + deviceId })
  },
  async latticePair(id: any, pin: any, cb: any) {
    const signer = signers.get(id)

    if (signer && (signer as any).pair) {
      try {
        const hasActiveWallet = await (signer as any).pair(pin)
        cb(null, hasActiveWallet)
      } catch (e) {
        cb((e as any).message)
      }
    }
  },
  launchStatus: _status,
  providerSend: (payload: any, cb: any) => provider.send(payload, cb),
  connectionStatus: (cb: any) => {
    cb(null, {
      primary: {
        status: provider.connection.primary.status,
        network: provider.connection.primary.network,
        type: provider.connection.primary.type,
        connected: provider.connection.primary.connected,
      },
      secondary: {
        status: provider.connection.secondary.status,
        network: provider.connection.secondary.network,
        type: provider.connection.secondary.type,
        connected: provider.connection.secondary.connected,
      },
    })
  },
  confirmRequestApproval(
    req: any,
    approvalType: any,
    approvalData: any,
    cb: any,
  ) {
    accounts.confirmRequestApproval(req.handlerId, approvalType, approvalData)
  },
  approveRequest(req: any, cb: any) {
    accounts.setRequestPending(req)
    if (req.type === 'transaction') {
      provider.approveTransactionRequest(req, (err, res) => {
        if (err) return accounts.setRequestError(req.handlerId, err)
        // @ts-expect-error TS(2345): Argument of type 'string | undefined' is not assig... Remove this comment to see the full error message
        setTimeout(() => accounts.setTxSent(req.handlerId, res), 1800)
      })
    } else if (req.type === 'sign') {
      provider.approveSign(req, (err, res) => {
        if (err) return accounts.setRequestError(req.handlerId, err)
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 2.
        accounts.setRequestSuccess(req.handlerId, res)
      })
    } else if (req.type === 'signTypedData') {
      provider.approveSignTypedData(req, (err, res) => {
        if (err) return accounts.setRequestError(req.handlerId, err)
        // @ts-expect-error TS(2554): Expected 1 arguments, but got 2.
        accounts.setRequestSuccess(req.handlerId, res)
      })
    }
  },
  declineRequest(req: any, cb: any) {
    if (
      req.type === 'transaction' ||
      req.type === 'sign' ||
      req.type === 'signTypedData'
    ) {
      accounts.declineRequest(req.handlerId)
      provider.declineRequest(req)
    }
  },
  addAragon(account: any, cb: any) {
    accounts.addAragon(account, cb)
  },
  createFromAddress(address: any, cb: any) {
    if (!isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.add(address, { type: 'Address' })
    cb()
  },
  createAccount(address: any, options: any, cb: any) {
    if (!isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.add(address, options)
    cb()
  },
  removeAccount(address: any, options: any, cb: any) {
    // if (!utils.isAddress(address)) return cb(new Error('Invalid Address'))
    accounts.remove(address)
    cb()
  },
  createFromPhrase(phrase: any, password: any, cb: any) {
    signers.createFromPhrase(phrase, password, cb)
  },
  locateKeystore(cb: any) {
    dialog
      .showOpenDialog({ properties: ['openFile'] })
      .then((file) => {
        const keystore = file || { filePaths: [] }
        if ((keystore.filePaths || []).length > 0) {
          readFile(keystore.filePaths[0], 'utf8', (err, data) => {
            if (err) return cb(err)
            try {
              cb(null, JSON.parse(data))
            } catch (err) {
              cb(err)
            }
          })
        } else {
          cb(new Error('No Keystore Found'))
        }
      })
      .catch(cb)
  },
  createFromKeystore(
    keystore: any,
    keystorePassword: any,
    password: any,
    cb: any,
  ) {
    signers.createFromKeystore(keystore, keystorePassword, password, cb)
  },
  createFromPrivateKey(privateKey: any, password: any, cb: any) {
    signers.createFromPrivateKey(privateKey, password, cb)
  },
  addPrivateKey(id: any, privateKey: any, password: any, cb: any) {
    signers.addPrivateKey(id, privateKey, password, cb)
  },
  removePrivateKey(id: any, index: any, password: any, cb: any) {
    signers.removePrivateKey(id, index, password, cb)
  },
  addKeystore(
    id: any,
    keystore: any,
    keystorePassword: any,
    password: any,
    cb: any,
  ) {
    signers.addKeystore(id, keystore, keystorePassword, password, cb)
  },
  unlockSigner(id: any, password: any, cb: any) {
    signers.unlock(id, password, cb)
  },
  lockSigner(id: any, cb: any) {
    signers.lock(id, cb)
  },
  remove(id: any) {
    signers.remove(id)
  },
  resolveAragonName(name: any, chainId: any, cb: any) {
    resolveName(name, chainId)
      .then((result) => cb(null, result))
      .catch(cb)
  },
  verifyAddress(cb: any) {
    const res = (err: any, data: any) => cb(err, data || false)
    accounts.verifyAddress(true, res)
  },
  setBaseFee(fee: any, handlerId: any, cb: any) {
    accounts.setBaseFee(fee, handlerId, true, cb)
    // store.setGasDefault(netType, netId, level, price)
  },
  setPriorityFee(fee: any, handlerId: any, cb: any) {
    accounts.setPriorityFee(fee, handlerId, true, cb)
    // store.setGasDefault(netType, netId, level, price)
  },
  setGasPrice(price: any, handlerId: any, cb: any) {
    accounts.setGasPrice(price, handlerId, true, cb)
    // store.setGasDefault(netType, netId, level, price)
  },
  setGasLimit(limit: any, handlerId: any, cb: any) {
    accounts.setGasLimit(limit, handlerId, true, cb)
  },
  removeFeeUpdateNotice(handlerId: any, cb: any) {
    accounts.removeFeeUpdateNotice(handlerId, cb)
  },
  signerCompatibility(handlerId: any, cb: any) {
    accounts.signerCompatibility(handlerId, cb)
  },
  // flow
  async flowCommand(command: any, cb: any) {
    // console.log('flowCommand', command, cb)
    await add(command.input, {}, (err: any, res: any) => {
      if (err || res) console.log(err, res)
    })
    await _launch(command.input, (err: any, res: any) => {
      if (err || res) console.log(err, res)
    })
  },
  addDapp(domain: any, options: any, cb: any) {
    if (!(domain.endsWith('.eth') || domain.endsWith('.xyz'))) domain += '.eth'
    // console.log('addDapp', domain, options, cb)
    add(domain, options, cb)
  },
  removeDapp(domain: any, cb: any) {
    _remove(domain, cb)
  },
  moveDapp(fromArea: any, fromIndex: any, toArea: any, toIndex: any, cb: any) {
    move(fromArea, fromIndex, toArea, toIndex, cb)
  },
  launchDapp(domain: any, cb: any) {
    _launch(domain, cb)
  },
  openDapp(domain: any, options: any, cb: any) {
    if (domain.endsWith('.eth')) {
      // console.log(' RPC openDapp ', domain, options, cb)
      add(domain, options, cb)
    } else {
      console.log('input needs to be ens name')
    }
  },
}

const unwrap = (v: any) => (v !== undefined || v !== null ? JSON.parse(v) : v)
const wrap = (v: any) => (v !== undefined || v !== null ? JSON.stringify(v) : v)

ipcMain.on('main:rpc', (event, id, method, ...args) => {
  id = unwrap(id)
  method = unwrap(method)
  args = args.map((arg) => unwrap(arg))
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  if (rpc[method]) {
    if (method === 'getFrameId') {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      rpc[method](
        (event.sender as any).getOwnerBrowserWindow(),
        ...args,
        (...args: any[]) => {
          event.sender.send(
            'main:rpc',
            id,
            ...args.map((arg) =>
              arg instanceof Error ? wrap(arg.message) : wrap(arg),
            ),
          )
        },
      )
    } else {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      rpc[method](...args, (...args: any[]) => {
        event.sender.send(
          'main:rpc',
          id,
          ...args.map((arg) =>
            arg instanceof Error ? wrap(arg.message) : wrap(arg),
          ),
        )
      })
    }
  } else {
    const args = [new Error('Unknown RPC method: ' + method)]
    event.sender.send(
      'main:rpc',
      id,
      ...args.map((arg) =>
        arg instanceof Error ? wrap(arg.message) : wrap(arg),
      ),
    )
  }
})
