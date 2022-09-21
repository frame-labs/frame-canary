// NPM modules
const codec = require('abi-codec')
const namehash = require('eth-ens-namehash')
const contentHash = require('content-hash')

// Frame modules
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'provider'.
const provider = require('../provider').default
// @ts-expect-error TS(2451): Cannot redeclare block-scoped variable 'store'.
const store = require('../store').default

// Local modules
const interfaces = require('./artifacts/interfaces')
const registryAddresses = require('./artifacts/addresses')

/* PUBLIC */
exports.resolveName = async (name: any) => {
  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // If no resolver found -> return null
  if (!resolverAddress) return null

  // Encode function input
  const node = namehash.hash(name)
  const input = codec.encodeInput(interfaces.resolver, 'addr', [node])

  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interfaces.resolver, 'addr', output)
  return decodedOutput[0]
}

exports.resolveAddress = async (address: any) => {
  // Construct name
  const name = `${address.slice(2)}.addr.reverse`

  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // If no resolver found -> return null
  if (!resolverAddress) return null

  // Encode function input
  const node = namehash.hash(name)
  const input = codec.encodeInput(interfaces.resolver, 'name', [node])

  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(interfaces.resolver, 'name', output)
  return decodedOutput[0]
}

exports.resolveContent = async (name: any) => {
  // Get resolver address
  const resolverAddress = await getResolverAddress(name)

  // If no resolver found -> return null
  if (!resolverAddress) return null

  // Encode function input
  const node = namehash.hash(name)
  const input = codec.encodeInput(interfaces.resolver, 'contenthash', [node])

  // Make JSON RPC call
  const params = { to: resolverAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return the content hash in text format
  const decodedOutput = codec.decodeOutput(
    interfaces.resolver,
    'contenthash',
    output,
  )

  if (decodedOutput[0] === null) return null

  const hash = contentHash.decode(decodedOutput[0])
  // const type = contentHash.getCodec(decodedOutput[0])
  // if (type === 'ipfs-ns') return `ipfs://${hash}`
  // if (type === 'swarm-ns') return `bzz://${hash}`
  return hash
}

/* PRIVATE */
const getResolverAddress = async (name: any) => {
  // Hash name
  const hash = namehash.hash(name)

  // Get registry contract address for selected network
  const networkId = store('main.currentNetwork.id')
  const registryAddress = registryAddresses[networkId]

  // Encode function input
  const input = codec.encodeInput(interfaces.registry, 'resolver', [hash])

  // Make JSON RPC call
  const params = { to: registryAddress, data: input }
  const output = await makeCall('eth_call', params)

  // If output empty -> return null
  if (output === '0x') return null

  // Decode output and return value
  const decodedOutput = codec.decodeOutput(
    interfaces.registry,
    'resolver',
    output,
  )
  return decodedOutput[0]
}

const makeCall = (method: any, params: any) => {
  return new Promise((resolve, reject) => {
    // Construct JSON RPC payload
    const payload = {
      jsonrpc: '2.0',
      id: 1,
      method: method,
      params: [params, 'latest'],
    }

    // Send payload to provider and resolve promise with result
    provider.send(payload, ({ result }: any) => resolve(result))
  })
}
