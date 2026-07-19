import { Blockchain, CoinGeckoToken, SupportedBlockchain } from '@/types/global';
import { ERC20MetadataResponse, TokenMetadataResponse } from '@/types/api';
import { cacheERCTokenMetadata, cacheTokenMetadata } from '../../cache/tokens';

export async function getTokensList(blockchain: Blockchain): Promise<CoinGeckoToken[]> {
  try {
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
