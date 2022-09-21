import HotSignerWorker from '../HotSigner/worker'

class RingSignerWorker extends HotSignerWorker {
  keys: any
  constructor() {
    super()
    this.keys = null
    process.on('message', (message) => this.handleMessage(message))
  }

  unlock({ encryptedKeys, password }: any, pseudoCallback: any) {
    try {
      this.keys = this._decrypt(encryptedKeys, password)
        .split(':')
        .map((key) => Buffer.from(key, 'hex'))
      pseudoCallback(null)
    } catch (e) {
      pseudoCallback('Invalid password')
    }
  }

  lock(_: any, pseudoCallback: any) {
    this.keys = null
    pseudoCallback(null)
  }

  addKey({ encryptedKeys, key, password }: any, pseudoCallback: any) {
    let keys
    // If signer already has encrypted keys -> decrypt them and add new key
    if (encryptedKeys)
      // @ts-expect-error TS(2488): Type 'string[] | null' must have a '[Symbol.iterat... Remove this comment to see the full error message
      keys = [...this._decryptKeys(encryptedKeys, password), key]
    // Else -> generate new list of keys
    else keys = [key]
    // Encrypt and return list of keys
    encryptedKeys = this._encryptKeys(keys, password)
    pseudoCallback(null, encryptedKeys)
  }

  removeKey({ encryptedKeys, index, password }: any, pseudoCallback: any) {
    if (!encryptedKeys) return pseudoCallback('Signer does not have any keys')
    // Get list of decrypted keys
    let keys = this._decryptKeys(encryptedKeys, password)
    // Remove key from list
    // @ts-expect-error TS(2531): Object is possibly 'null'.
    keys = keys.filter((key) => key !== keys[index])
    // Return encrypted list (or null if empty)
    const result = keys.length > 0 ? this._encryptKeys(keys, password) : null
    pseudoCallback(null, result)
  }

  signMessage({ index, message }: any, pseudoCallback: any) {
    // Make sure signer is unlocked
    if (!this.keys) return pseudoCallback('Signer locked')
    // Sign message
    super.signMessage(this.keys[index], message, pseudoCallback)
  }

  signTypedData(params: any, pseudoCallback: any) {
    // Make sure signer is unlocked
    if (!this.keys) return pseudoCallback('Signer locked')
    // Sign Typed Data
    super.signTypedData(this.keys[params.index], params, pseudoCallback)
  }

  signTransaction({ index, rawTx }: any, pseudoCallback: any) {
    // Make sure signer is unlocked
    if (!this.keys) return pseudoCallback('Signer locked')
    // Sign transaction
    super.signTransaction(this.keys[index], rawTx, pseudoCallback)
  }

  _decryptKeys(encryptedKeys: any, password: any) {
    if (!encryptedKeys) return null
    const keyString = this._decrypt(encryptedKeys, password)
    return keyString.split(':')
  }

  _encryptKeys(keys: any, password: any) {
    const keyString = keys.join(':')
    return this._encrypt(keyString, password)
  }
}

const ringSignerWorker = new RingSignerWorker() // eslint-disable-line
