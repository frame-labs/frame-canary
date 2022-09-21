// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'store'.
const store = require('../../../store').default

module.exports = {
  get: (hash: any) => store(`main.dapp.storage.${hash}`),
  update: (hash: any, state: any) => {
    try {
      state = JSON.parse(state)
    } catch (e) {
      state = ''
    }
    store.setDappStorage(hash, state)
  },
}
