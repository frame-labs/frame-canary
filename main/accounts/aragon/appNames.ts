// @ts-expect-error TS(7016): Could not find a declaration file for module 'eth-... Remove this comment to see the full error message
import namehash from 'eth-ens-namehash'

const knownApps = [
  'voting',
  'token-manager',
  'finance',
  'vault',
  'agent',
  'survey',
  'payroll',
  'kernel',
  'acl',
  'evmreg',
  'apm-registry',
  'apm-repo',
  'apm-enssub',
]

const hashes = Object.fromEntries(
  knownApps.map((app) => [namehash.hash(`${app}.aragonpm.eth`), app]),
)

export default hashes
