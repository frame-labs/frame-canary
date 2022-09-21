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
  : resolve(dirname(require.main.filename), '../.userData')
const SIGNERS_PATH = resolve(USER_DATA, 'signers')

class HotSigner extends Signer {
  constructor(signer, workerPath) {
    super()
    this.status = 'locked'
    this.addresses = signer ? signer.addresses : []
    this._worker = fork(workerPath)
    this._getToken()
    this.ready = false
  }

  save(data) {
    // Construct signer
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

  lock(cb) {
    this._callWorker({ method: 'lock' }, () => {
      this.status = 'locked'
      this.update()
      info('Signer locked')
      cb(null)
    })
  }

  unlock(password, data, cb) {
    const params = { password, ...data }
    this._callWorker({ method: 'unlock', params }, (err, result) => {
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

  signMessage(index, message, cb) {
    const payload = { method: 'signMessage', params: { index, message } }
    this._callWorker(payload, cb)
  }

  signTypedData(index, version, typedData, cb) {
    const payload = {
      method: 'signTypedData',
      params: { index, typedData, version },
    }
    this._callWorker(payload, cb)
  }

  signTransaction(index, rawTx, cb) {
    const payload = { method: 'signTransaction', params: { index, rawTx } }
    this._callWorker(payload, cb)
  }

  verifyAddress(index, address, display, cb = () => {}) {
    const payload = { method: 'verifyAddress', params: { index, address } }
    this._callWorker(payload, (err, verified) => {
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
        cb(err)
      } else {
        info('Hot signer verify address matched')
        cb(null, verified)
      }
    })
  }

  _getToken() {
    const listener = ({ type, token }) => {
      if (type === 'token') {
        this._token = token
        this._worker.removeListener('message', listener)
        this.ready = true
        this.emit('ready')
      }
    }
    this._worker.addListener('message', listener)
  }

  _callWorker(payload, cb) {
    if (!this._worker) throw Error('Worker not running')
    // If token not yet received -> retry in 100 ms
    if (!this._token)
      return setTimeout(() => this._callWorker(payload, cb), 100)
    // Generate message id
    const id = uuid()
    // Handle response
    const listener = (response) => {
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
