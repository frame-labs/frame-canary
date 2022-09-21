// @ts-expect-error TS(2497): This module can only be referenced with ECMAScript... Remove this comment to see the full error message
import { fromMasterSeed } from 'hdkey'
import HotSignerWorker from '../HotSigner/worker'

class SeedSignerWorker extends HotSignerWorker {
  seed: any
  constructor() {
    super()
    this.seed = null
    process.on('message', (message) => this.handleMessage(message))
  }

  unlock({ encryptedSeed, password }: any, pseudoCallback: any) {
    try {
      this.seed = this._decrypt(encryptedSeed, password)
      pseudoCallback(null)
    } catch (e) {
      pseudoCallback('Invalid password')
    }
  }

  lock(_: any, pseudoCallback: any) {
    this.seed = null
    pseudoCallback(null)
  }

  encryptSeed({ seed, password }: any, pseudoCallback: any) {
    pseudoCallback(null, this._encrypt(seed.toString('hex'), password))
  }

  signMessage({ index, message }: any, pseudoCallback: any) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign message
    super.signMessage(key, message, pseudoCallback)
  }

  signTypedData(params: any, pseudoCallback: any) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(params.index)
    // Sign message
    super.signTypedData(key, params, pseudoCallback)
  }

  signTransaction({ index, rawTx }: any, pseudoCallback: any) {
    // Make sure signer is unlocked
    if (!this.seed) return pseudoCallback('Signer locked')
    // Derive private key
    const key = this._derivePrivateKey(index)
    // Sign transaction
    super.signTransaction(key, rawTx, pseudoCallback)
  }

  _derivePrivateKey(index: any) {
    let key = fromMasterSeed(Buffer.from(this.seed, 'hex'))
    key = key.derive("m/44'/60'/0'/0/" + index)
    return key.privateKey
  }
}

const seedSignerWorker = new SeedSignerWorker() // eslint-disable-line
