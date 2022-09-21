import { resolve, dirname } from 'path'
import { writeFileSync } from 'fs'
import { ensureDirSync, removeSync } from 'fs-extra'
import { fork } from 'child_process'
import { app } from 'electron'
import { debug, info, error as _error } from 'electron-log'
import { v4 as uuid } from 'uuid'

import Signer from '../../Signer'
import store from '../../../store'
// Mock windows module during tests
const windows = app ? require('../../../windows') : { broadcast: () => {} }
// Mock user data dir during tests
const USER_DATA = app
  ? app.getPath('userData')
  : // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    resolve(dirname(require.main.filename), '../.userData')
const SIGNERS_PATH = resolve(USER_DATA, 'signers')

class HotSigner extends Signer {
  _token: any
  _worker: any
  encryptedKeys: any
  encryptedSeed: any
  ready: any
  constructor(signer: any, workerPath: any) {
    super()
    this.status = 'locked'
    this.addresses = signer ? signer.addresses : []
    this._worker = fork(workerPath)
    this._getToken()
    this.ready = false
  }

  save(data: any) {
    // Construct signer
    // @ts-expect-error TS(2339): Property 'network' does not exist on type 'HotSign... Remove this comment to see the full error message
    const { id, addresses, type, network } = this
    const signer = { id, addresses, type, network, ...data }

    // Ensure signers directory exists
    ensureDirSync(SIGNERS_PATH)

    // Write signer to disk
    writeFileSync(resolve(SIGNERS_PATH, `${id}.json`), JSON.stringify(signer), {
      mode: 0o600,
    })

    // Log
    debug('Signer saved to disk')
  }

  delete() {
    const signerPath = resolve(SIGNERS_PATH, `${this.id}.json`)

    // Overwrite file
    writeFileSync(
      signerPath,
      '00000000000000000000000000000000000000000000000000000000000000000000',
      { mode: 0o600 },
    )

    // Remove file
    removeSync(signerPath)

    // Log
    info('Signer erased from disk')
  }

  lock(cb: any) {
    this._callWorker({ method: 'lock' }, () => {
      this.status = 'locked'
      this.update()
      info('Signer locked')
      cb(null)
    })
  }

  unlock(password: any, data: any, cb: any) {
    const params = { password, ...data }
    this._callWorker({ method: 'unlock', params }, (err: any, result: any) => {
      if (err) return cb(err)
      this.status = 'ok'
      this.update()
      info('Signer unlocked')
      cb(null)
    })
  }

  close() {
    if (this.ready) this._worker.disconnect()
    else this.once('ready', () => this._worker.disconnect())
    store.removeSigner(this.id)
    info('Signer closed')
  }

  update() {
    // Get derived ID
    const derivedId = this.fingerprint()

    // On new ID ->
    if (!this.id) {
      // Update id
      this.id = derivedId
      // Write to disk
      this.save({
        encryptedKeys: this.encryptedKeys,
        encryptedSeed: this.encryptedSeed,
      })
    } else if (this.id !== derivedId) {
      // On changed ID
      // Erase from disk
      // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
      this.delete(this.id)
      // Remove from store
      store.removeSigner(this.id)
      // Update id
      this.id = derivedId
      // Write to disk
      this.save({
        encryptedKeys: this.encryptedKeys,
        encryptedSeed: this.encryptedSeed,
      })
    }

    store.updateSigner(this.summary())
    info('Signer updated')
  }

  signMessage(index: any, message: any, cb: any) {
    const payload = { method: 'signMessage', params: { index, message } }
    this._callWorker(payload, cb)
  }

  signTypedData(index: any, version: any, typedData: any, cb: any) {
    const payload = {
      method: 'signTypedData',
      params: { index, typedData, version },
    }
    this._callWorker(payload, cb)
  }

  signTransaction(index: any, rawTx: any, cb: any) {
    const payload = { method: 'signTransaction', params: { index, rawTx } }
    this._callWorker(payload, cb)
  }

  // @ts-expect-error TS(2416): Property 'verifyAddress' in type 'HotSigner' is no... Remove this comment to see the full error message
  verifyAddress(index: any, address: any, display: any, cb = () => {}) {
    const payload = { method: 'verifyAddress', params: { index, address } }
    this._callWorker(payload, (err: any, verified: any) => {
      if (err || !verified) {
        if (!err) {
          store.notify('hotSignerMismatch')
          err = new Error('Unable to verify address')
        }
        this.lock(() => {
          if (err) {
            _error('HotSigner verifyAddress: Unable to verify address')
          } else {
            _error('HotSigner verifyAddress: Address mismatch')
          }
          _error(err)
        })
        // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
        cb(err)
      } else {
        info('Hot signer verify address matched')
        // @ts-expect-error TS(2554): Expected 0 arguments, but got 2.
        cb(null, verified)
      }
    })
  }

  _getToken() {
    const listener = ({ type, token }: any) => {
      if (type === 'token') {
        this._token = token
        this._worker.removeListener('message', listener)
        this.ready = true
        this.emit('ready')
      }
    }
    this._worker.addListener('message', listener)
  }

  // @ts-expect-error TS(7023): '_callWorker' implicitly has return type 'any' bec... Remove this comment to see the full error message
  _callWorker(payload: any, cb: any) {
    if (!this._worker) throw Error('Worker not running')
    // If token not yet received -> retry in 100 ms
    if (!this._token)
      return setTimeout(() => this._callWorker(payload, cb), 100)
    // Generate message id
    const id = uuid()
    // Handle response
    const listener = (response: any) => {
      if (response.type === 'rpc' && response.id === id) {
        const error = response.error ? new Error(response.error) : null
        cb(error, response.result)
        this._worker.removeListener('message', listener)
      }
    }
    this._worker.addListener('message', listener)
    // Make RPC call
    this._worker.send({ id, token: this._token, ...payload })
  }
}

export default HotSigner
