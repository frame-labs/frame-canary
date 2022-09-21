/* globals test expect */

// eslint-disable-next-line @typescript-eslint/no-var-requires
import Web3 from 'web3'
const web3 = new Web3(
  new Web3.providers.WebsocketProvider('ws://localhost:1248'),
)
import {
  beforeEach,
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  test,
  jest,
  afterEach,
} from '@jest/globals'
test('Send Transaction', (done) => {
  web3.eth
    .getAccounts()
    .then((accounts) => {
      web3.eth
        .sendTransaction({
          value: Web3.utils.toHex(Math.round(1000000000000000 * Math.random())),
          to: '0x030e6af4985f111c265ee3a279e5a9f6aa124fd5',
          from: accounts[0],
        })
        .on('transactionHash', (hash) => {
          expect(hash).toBeTruthy()
          done()
        })
    })
    .catch((err) => {
      console.log(err)
    })
})

test('sign_personal and ecRecover', (done) => {
  const message = 'Frame Test'
  web3.eth.getAccounts().then((accounts) => {
    web3.eth.personal
      .sign(message, accounts[0])
      .then((signed) => {
        web3.eth.personal
          .ecRecover(message, signed)
          .then((result) => {
            expect(result.toLowerCase()).toBe(accounts[0].toLowerCase())
            console.log(
              JSON.stringify({
                address: accounts[0],
                msg: message,
                sig: signed,
                version: '2',
              }),
            )
            done()
          })
          .catch((err) => {
            console.log(err)
          })
      })
      .catch((err) => {
        console.log(err)
      })
  })
})

test('eth_sign and ecRecover', (done) => {
  const message = 'Frame Test'
  web3.eth.getAccounts().then((accounts) => {
    web3.eth
      .sign(message, accounts[0])
      .then((signed) => {
        web3.eth.personal
          .ecRecover(message, signed)
          .then((result) => {
            expect(result.toLowerCase()).toBe(accounts[0].toLowerCase())
            console.log(
              JSON.stringify({
                address: accounts[0],
                msg: message,
                sig: signed,
                version: '2',
              }),
            )
            done()
          })
          .catch((err) => {
            console.log(err)
          })
      })
      .catch((err) => {
        console.log(err)
      })
  })
})
