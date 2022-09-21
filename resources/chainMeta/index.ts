// @ts-expect-error TS(2307): Cannot find module './icons/arbitrum.svg' or its c... Remove this comment to see the full error message
import arbitrum from './icons/arbitrum.svg'
// @ts-expect-error TS(2307): Cannot find module './icons/fantom.svg' or its cor... Remove this comment to see the full error message
import fantom from './icons/fantom.svg'
// @ts-expect-error TS(2307): Cannot find module './icons/optimism.svg' or its c... Remove this comment to see the full error message
import optimism from './icons/optimism.svg'
// @ts-expect-error TS(2307): Cannot find module './icons/polygon.svg' or its co... Remove this comment to see the full error message
import polygon from './icons/polygon.svg'
// @ts-expect-error TS(2307): Cannot find module './icons/xdai.svg' or its corre... Remove this comment to see the full error message
import xdai from './icons/xdai.svg'

export default {
  '0x1': {
    chainId: 1,
    name: 'mainnet',
    icon: '',
    primaryColor: 'var(--good)',
  },
  '0x3': {
    chainId: 3,
    name: 'ropsten',
    icon: '',
    primaryColor: 'rgb(255, 153, 51)',
  },
  '0x4': {
    chainId: 4,
    name: 'rinkeby',
    icon: '',
    primaryColor: 'rgb(255, 153, 51)',
  },
  '0x5': {
    chainId: 5,
    name: 'görli',
    icon: '',
    primaryColor: 'rgb(255, 153, 51)',
  },
  '0x2a': {
    chainId: 42,
    name: 'kovan',
    icon: '',
    primaryColor: 'rgb(255, 153, 51)',
  },
  '0xa': {
    chainId: 10,
    name: 'optimism',
    icon: optimism,
    primaryColor: 'rgb(246, 36, 35)',
  },
  '0x64': {
    chainId: 100,
    name: 'xdai',
    icon: xdai,
    primaryColor: 'rgb(90, 181, 178)',
  },
  '0x89': {
    chainId: 137,
    name: 'polygon',
    icon: polygon,
    primaryColor: 'rgb(140, 97, 232)',
  },
  '0xfa': {
    chainId: 250,
    name: 'fantom',
    icon: fantom,
    primaryColor: 'rgb(51, 103, 246)',
  },
  '0xa4b1': {
    chainId: 42161,
    name: 'arbitrum',
    icon: arbitrum,
    primaryColor: 'rgb(62, 173, 241)',
  },
}
