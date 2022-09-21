// Return Frame Time

const counts = {}

module.exports = async (blockNumber: any) => {
  if (!blockNumber)
    blockNumber = await provider.request({ method: 'eth_blockNumbr' })
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  counts[blockNumber] = counts[blockNumber] || 0
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  return blockNumber + ':' + counts[blockNumber]
}
