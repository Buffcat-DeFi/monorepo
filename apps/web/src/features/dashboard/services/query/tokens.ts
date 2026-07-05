import { Blockchain, CoinGeckoToken, SupportedBlockchain } from '@/types/global';
import { ERC20MetadataResponse, TokenMetadataResponse } from '@/types/api';
import { cacheERCTokenMetadata, cacheTokenMetadata } from '../../lib/cache/tokens';

const tokens: CoinGeckoToken[] = [
  {
    chainId: 1,
    address: '0xD969897Adeb947a22E9621dB2db186e6eA11140f',
    name: 'Token1',
    symbol: 'T1',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0x59deCAF1289BbF615Ac8b1024127eC7FF842aB01',
    name: 'Token2',
    symbol: 'T2',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0xE85FD09eBc17A3aAB5f7BA691142506ab38EC1B7',
    name: 'Token3',
    symbol: 'T3',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0x839cBf32175fC81712dc2c59617C0cd2B5d421cf',
    name: 'Token4',
    symbol: 'T4',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0x9812525C76ca09F30410c0402aBC612aBc3bCaDc',
    name: 'Token5',
    symbol: 'T5',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0xf6c7d4c414cBF89017858eC1AF04236072563029',
    name: 'Token6',
    symbol: 'T6',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0xdd3f8638B7FAefF0FA61D0596917cF788436D495',
    name: 'Token7',
    symbol: 'T7',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0xc32840a611a3F29F759D1302bfb19d898dD458d5',
    name: 'Token8',
    symbol: 'T8',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0x6f058a2abc238D775531e1d391d7E0337d024Df7',
    name: 'Token9',
    symbol: 'T9',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0xF9C0092ae1f3B2E08D07ceAD0C2927318e7B3E21',
    name: 'USD Centric',
    symbol: 'USDC',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    chainId: 1,
    address: '0xaC10e29fFc0e2Ba64c0D91db7EA31fE45FE43E68',
    name: 'USD Tether',
    symbol: 'USDT',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
];

export async function getTokensList(blockchain: Blockchain): Promise<CoinGeckoToken[]> {
  try {
    if (blockchain.id == 'eth') return tokens;
    const url = `https://tokens.coingecko.com/${blockchain.name.toLowerCase()}/all.json`;
    const res = await fetch(url);
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    return data.tokens;
  } catch (error) {
    console.log(`Error fetching token list for ${blockchain.name}`);
    console.log(error);
    return [];
  }
}

export async function fetchTokenMetadata(
  chain: SupportedBlockchain,
  tokenAddress: string,
): Promise<TokenMetadataResponse> {
  const response = await fetch(
    `/api/token/metadata/coingecko?chain=${chain}&tokenAddress=${tokenAddress}`,
  );
  const payload = await response.json();
  if (response.ok) {
    cacheTokenMetadata(chain, tokenAddress, payload);
    return payload;
  }
  throw new Error(payload.message || 'Failed to fetch token metadata');
}

export async function fetchERCTokenMetadata(
  chain: SupportedBlockchain,
  tokenAddress: string,
): Promise<ERC20MetadataResponse> {
  const response = await fetch(
    `/api/token/metadata/erc?chain=${chain}&tokenAddress=${tokenAddress}`,
  );
  const payload = await response.json();
  if (response.ok) {
    cacheERCTokenMetadata(chain, tokenAddress, payload);
    return payload;
  }
  throw new Error(payload.message || 'Failed to fetch token metadata');
}
