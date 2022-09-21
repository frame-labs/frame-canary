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
module.exports = {
  get: jest.fn(),
  set: jest.fn(),
  queue: jest.fn(),
}
