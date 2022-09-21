import { addHexPrefix } from 'ethereumjs-util'
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
export const weiToHex = (wei) => addHexPrefix(wei.toString(16))
export const gweiToHex = (gwei) => weiToHex(gwei * 1e9)
export const flushPromises = () =>
  // @ts-ignore
  new Promise(jest.requireActual('timers').setImmediate)
