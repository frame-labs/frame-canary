import {
  randomBytes,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  scryptSync,
} from 'crypto'
import { signTypedMessage } from 'eth-sig-util'
import { TransactionFactory } from '@ethereumjs/tx'
import Common from '@ethereumjs/common'

import {
  BN,
  hashPersonalMessage,
  toBuffer,
  ecsign,
  addHexPrefix,
  pubToAddress,
  ecrecover,
} from 'ethereumjs-util'

function chainConfig(chain: any, hardfork: any) {
  const chainId = new BN(chain)

  return Common.isSupportedChainId(chainId)
    ? new Common({ chain: chainId.toNumber(), hardfork })
    : Common.custom(
        { chainId: chainId.toNumber() },
        { baseChain: 'mainnet', hardfork },
      )
}

class HotSignerWorker {
  token: any
  constructor() {
    this.token = randomBytes(32).toString('hex')
    // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
    process.send({ type: 'token', token: this.token })
  }

  handleMessage({ id, method, params, token }: any) {
    // Define (pseudo) callback
    const pseudoCallback = (error: any, result: any) => {
      // Add correlation id to response
      const response = { id, error, result, type: 'rpc' }
      // Send response to parent process
      // @ts-expect-error TS(2722): Cannot invoke an object which is possibly 'undefin... Remove this comment to see the full error message
      process.send(response)
    }
    // Verify token
    if (!timingSafeEqual(Buffer.from(token), Buffer.from(this.token)))
      // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
      return pseudoCallback('Invalid token')
    // If method exists -> execute
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    if (this[method]) return this[method](params, pseudoCallback)
    // Else return error
    // @ts-expect-error TS(2554): Expected 2 arguments, but got 1.
    pseudoCallback(`Invalid method: '${method}'`)
  }

  signMessage(key: any, message: any, pseudoCallback: any) {
    // Hash message
    const hash = hashPersonalMessage(toBuffer(message))

    // Sign message
    const signed = ecsign(hash, key)

    // Return serialized signed message
    const hex = Buffer.concat([
      Buffer.from(signed.r),
      Buffer.from(signed.s),
      Buffer.from([signed.v]),
    ]).toString('hex')

    pseudoCallback(null, addHexPrefix(hex))
  }

  signTypedData(key: any, params: any, pseudoCallback: any) {
    try {
      const signature = signTypedMessage(
        key,
        { data: params.typedData },
        params.version,
      )
      pseudoCallback(null, signature)
    } catch (e) {
      pseudoCallback((e as any).message)
    }
  }

  signTransaction(key: any, rawTx: any, pseudoCallback: any) {
    if (!rawTx.chainId) {
      console.error(`invalid chain id ${rawTx.chainId} for transaction`)
      return pseudoCallback('could not determine chain id for transaction')
    }

    const chainId = parseInt(rawTx.chainId)
    const hardfork = parseInt(rawTx.type) === 2 ? 'london' : 'berlin'
    const common = chainConfig(chainId, hardfork)

    const tx = TransactionFactory.fromTxData(rawTx, { common })
    const signedTx = tx.sign(key)
    const serialized = signedTx.serialize().toString('hex')

    pseudoCallback(null, addHexPrefix(serialized))
  }

  verifyAddress({ index, address }: any, pseudoCallback: any) {
    const message = '0x' + randomBytes(32).toString('hex')
    // @ts-expect-error TS(2554): Expected 3 arguments, but got 2.
    this.signMessage({ index, message }, (err: any, signedMessage: any) => {
      // Handle signing errors
      if (err) return pseudoCallback(err)
      // Signature -> buffer
      const signature = Buffer.from(signedMessage.replace('0x', ''), 'hex')
      // Ensure correct length
      if (signature.length !== 65)
        return pseudoCallback(
          new Error('Frame verifyAddress signature has incorrect length'),
        )
      // Verify address
      let v = signature[64]
      v = v === 0 || v === 1 ? v + 27 : v
      const r = toBuffer(signature.slice(0, 32))
      const s = toBuffer(signature.slice(32, 64))
      const hash = hashPersonalMessage(toBuffer(message))
      const verifiedAddress =
        '0x' + pubToAddress(ecrecover(hash, v, r, s)).toString('hex')
      // Return result
      pseudoCallback(
        null,
        verifiedAddress.toLowerCase() === address.toLowerCase(),
      )
    })
  }

  _encrypt(string: any, password: any) {
    const salt = randomBytes(16)
    const iv = randomBytes(16)
    // @ts-expect-error TS(2769): No overload matches this call.
    const cipher = createCipheriv(
      'aes-256-cbc',
      this._hashPassword(password, salt),
      iv,
    )
    const encrypted = Buffer.concat([cipher.update(string), cipher.final()])
    return (
      salt.toString('hex') +
      ':' +
      iv.toString('hex') +
      ':' +
      encrypted.toString('hex')
    )
  }

  _decrypt(string: any, password: any) {
    const parts = string.split(':')
    const salt = Buffer.from(parts.shift(), 'hex')
    const iv = Buffer.from(parts.shift(), 'hex')
    // @ts-expect-error TS(2769): No overload matches this call.
    const decipher = createDecipheriv(
      'aes-256-cbc',
      this._hashPassword(password, salt),
      iv,
    )
    const encryptedString = Buffer.from(parts.join(':'), 'hex')
    const decrypted = Buffer.concat([
      decipher.update(encryptedString),
      decipher.final(),
    ])
    return decrypted.toString()
  }

  _hashPassword(password: any, salt: any) {
    try {
      return scryptSync(password, salt, 32, {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 36000000,
      })
    } catch (e) {
      console.error('Error during hashPassword', e) // TODO: Handle Error
    }
  }
}

export default HotSignerWorker
