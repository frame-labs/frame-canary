import { resolve } from 'path'
import HotSigner from '../HotSigner'
import { validateMnemonic, mnemonicToSeed } from 'bip39'
// @ts-expect-error TS(2497): This module can only be referenced with ECMAScript... Remove this comment to see the full error message
import { fromMasterSeed } from 'hdkey'
// @ts-expect-error TS(7016): Could not find a declaration file for module 'ethe... Remove this comment to see the full error message
import publicKeyToAddress from 'ethereum-public-key-to-address'

const WORKER_PATH = resolve(__dirname, 'worker.js')

class SeedSigner extends HotSigner {
  constructor(signer: any) {
    super(signer, WORKER_PATH)
    this.encryptedSeed = signer && signer.encryptedSeed
    this.type = 'seed'
    this.model = 'phrase'
    if (this.encryptedSeed) this.update()
  }

  addSeed(seed: any, password: any, cb: any) {
    if (this.encryptedSeed)
      return cb(new Error('This signer already has a seed'))

    this._callWorker(
      { method: 'encryptSeed', params: { seed, password } },
      (err: any, encryptedSeed: any) => {
        if (err) return cb(err)

        // Derive addresses
        const wallet = fromMasterSeed(Buffer.from(seed, 'hex'))

        const addresses = []
        for (let i = 0; i < 100; i++) {
          const publicKey = wallet.derive("m/44'/60'/0'/0/" + i).publicKey
          const address = publicKeyToAddress(publicKey)
          addresses.push(address)
        }

        // Update signer
        this.encryptedSeed = encryptedSeed
        this.addresses = addresses
        this.update()

        cb(null)
      },
    )
  }

  async addPhrase(phrase: any, password: any, cb: any) {
    // Validate phrase
    if (!validateMnemonic(phrase))
      return cb(new Error('Invalid mnemonic phrase'))
    // Get seed
    const seed = await mnemonicToSeed(phrase)
    // Add seed to signer
    this.addSeed(seed.toString('hex'), password, cb)
  }

  save() {
    super.save({ encryptedSeed: this.encryptedSeed })
  }

  unlock(password: any, cb: any) {
    super.unlock(password, { encryptedSeed: this.encryptedSeed }, cb)
  }
}

export default SeedSigner
