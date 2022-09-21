import { resolve as _resolve, dirname } from 'path'
import { readdirSync, readFileSync } from 'fs'
import { ensureDirSync } from 'fs-extra'
import { app } from 'electron'
import { error } from 'electron-log'
import { generateMnemonic } from 'bip39'
// @ts-expect-error TS(7016): Could not find a declaration file for module 'zxcv... Remove this comment to see the full error message
import zxcvbn from 'zxcvbn'

// @ts-expect-error TS(2459): Module '"../../crypt"' declares 'stringToKey' loca... Remove this comment to see the full error message
import { stringToKey } from '../../crypt'

import SeedSigner from './SeedSigner'
import RingSigner from './RingSigner'
import { stripHexPrefix } from 'ethereumjs-util'

const USER_DATA = app
  ? app.getPath('userData')
  : // @ts-expect-error TS(2532): Object is possibly 'undefined'.
    _resolve(dirname(require.main.filename), '../.userData')
const SIGNERS_PATH = _resolve(USER_DATA, 'signers')

const wait = async (ms: any) =>
  new Promise((resolve) => setTimeout(resolve, ms))

export function newPhrase(cb: any) {
  cb(null, generateMnemonic())
}
export function createFromSeed(
  signers: any,
  seed: any,
  password: any,
  cb: any,
) {
  if (!seed) return cb(new Error('Seed required to create hot signer'))
  if (!password) return cb(new Error('Password required to create hot signer'))
  if (password.length < 12)
    return cb(new Error('Hot account password is too short'))
  if (zxcvbn(password).score < 3)
    return cb(new Error('Hot account password is too weak'))
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const signer = new SeedSigner()
  signer.addSeed(seed, password, (err: any, result: any) => {
    if (err) {
      signer.close()
      return cb(err)
    }
    signers.add(signer)
    cb(null, signer)
  })
}
export function createFromPhrase(
  signers: any,
  phrase: any,
  password: any,
  cb: any,
) {
  if (!phrase) return cb(new Error('Phrase required to create hot signer'))
  if (!password) return cb(new Error('Password required to create hot signer'))
  if (password.length < 12)
    return cb(new Error('Hot account password is too short'))
  if (zxcvbn(password).score < 3)
    return cb(new Error('Hot account password is too weak'))
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const signer = new SeedSigner()
  signer.addPhrase(phrase, password, (err: any) => {
    if (err) {
      signer.close()
      return cb(err)
    }
    signers.add(signer)
    cb(null, signer)
  })
}
export function createFromPrivateKey(
  signers: any,
  privateKey: any,
  password: any,
  cb: any,
) {
  const privateKeyHex = stripHexPrefix(privateKey)

  if (!privateKeyHex)
    return cb(new Error('Private key required to create hot signer'))
  if (!password) return cb(new Error('Password required to create hot signer'))
  if (password.length < 12)
    return cb(new Error('Hot account password is too short'))
  if (zxcvbn(password).score < 3)
    return cb(new Error('Hot account password is too weak'))
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const signer = new RingSigner()

  signer.addPrivateKey(privateKeyHex, password, (err: any) => {
    if (err) {
      signer.close()
      return cb(err)
    }
    signers.add(signer)
    cb(null, signer)
  })
}
export function createFromKeystore(
  signers: any,
  keystore: any,
  keystorePassword: any,
  password: any,
  cb: any,
) {
  if (!keystore) return cb(new Error('Keystore required'))
  if (!keystorePassword) return cb(new Error('Keystore password required'))
  if (!password) return cb(new Error('Password required to create hot signer'))
  if (password.length < 12)
    return cb(new Error('Hot account password is too short'))
  if (zxcvbn(password).score < 3)
    return cb(new Error('Hot account password is too weak'))
  // @ts-expect-error TS(2554): Expected 1 arguments, but got 0.
  const signer = new RingSigner()
  signer.addKeystore(keystore, keystorePassword, password, (err: any) => {
    if (err) {
      signer.close()
      return cb(err)
    }
    signers.add(signer)
    cb(null, signer)
  })
}
export function scan(signers: any) {
  const storedSigners = {}

  const scan = async () => {
    // Ensure signer directory exists
    ensureDirSync(SIGNERS_PATH)

    // Find stored signers, read them from disk and add them to storedSigners
    readdirSync(SIGNERS_PATH).forEach((file) => {
      try {
        const signer = JSON.parse(
          readFileSync(_resolve(SIGNERS_PATH, file), 'utf8'),
        )
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        storedSigners[signer.id] = signer
      } catch (e) {
        error(`Corrupt signer file: ${file}`)
      }
    })

    // Add stored signers
    for (const id of Object.keys(storedSigners)) {
      await wait(100)
      const { addresses, encryptedKeys, encryptedSeed, type, network } =
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        storedSigners[id]
      if (addresses && addresses.length) {
        const id = stringToKey(addresses.join()).toString('hex')
        if (!signers.exists(id)) {
          if (type === 'seed') {
            signers.add(new SeedSigner({ network, addresses, encryptedSeed }))
          } else if (type === 'ring') {
            signers.add(new RingSigner({ network, addresses, encryptedKeys }))
          }
        }
      }
    }
  }

  // Delay creating child process until after initial load
  setTimeout(scan, 4000)

  return scan
}
