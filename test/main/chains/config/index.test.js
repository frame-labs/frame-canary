import chainConfig from '../../../../main/chains/config'
import {
  beforeEach,
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  test,
  jest,
} from '@jest/globals'
describe('polygon', () => {
  it('sets the chain id', () => {
    const config = chainConfig(137)

    expect(config.chainIdBN().toNumber()).toBe(137)
  })

  it('sets EIP-1559 to be disabled by default', () => {
    const config = chainConfig(137, 'istanbul')

    expect(config.gteHardfork('london')).toBe(false)
  })
})
