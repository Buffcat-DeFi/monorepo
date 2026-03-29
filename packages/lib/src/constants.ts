import { BlockchainParam, Blockchain } from '@buffcat/types';

export const contractAddresses: {
  [key in BlockchainParam]: string;
} = {
  eth: '0x09635F643e140090A9A8Dcd712eD6285858ceBef',
  base: '',
  bsc: '',
  solana: '5gkSpRz74mVfNEnqGpArAxK2UZyY5fjv1Bg1nXrhgH6E',
};

export const blockchains: Blockchain[] = [
  {
    id: 'eth',
    name: 'Ethereum',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    isSupported: true,
  },
  {
    id: 'base',
    name: 'Base',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/27789.png',
    isSupported: true,
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png',
    isSupported: true,
  },
  {
    id: 'solana',
    name: 'Solana',
    logoUrl: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
    isSupported: true,
  },
];

export const placeholders = {
  text: 'N/A',
  tokenId: 0,
  tokenName: 'Token',
  tokenSymbol: 'TKN',
  tokenDecimals: 0,
  tokenImage: './circle-question-mark.svg',
  tokenAddress: '0x0000000000000000000000000000000000000000',
  tokenPrice: 0,
  userAddress: '0x0000000000000000000000000000000000000000',
  tokenAmount: 0,
};

export const rpcUrls: {
  [key in BlockchainParam]: string;
} = {
  eth: '',
  base: '',
  bsc: '',
  solana: '',
};
