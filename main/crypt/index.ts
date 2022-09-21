import crypto from 'crypto'

const stringToKey = (pass: any) => {
  const hash = crypto.createHash('sha256').update(pass)
  return Buffer.from(hash.digest('hex').substring(0, 32))
}

module.exports = { stringToKey }
