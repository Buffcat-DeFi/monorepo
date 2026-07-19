import { CoinGeckoToken, SupportedBlockchain } from '@/types/global';
import { ERC20MetadataResponse, TokenMetadataResponse } from '@/types/api';
import { getCacheKey, getCacheTimestampKey } from './keys';
import { ALL_TOKENS_LIST_CACHE_DURATION } from './durations';

export function cacheAllTokens(parsedTokens: CoinGeckoToken[], blockchain: SupportedBlockchain) {
  try {
    const cacheKey = getCacheKey('all_tokens_list', blockchain);
    const cacheTimestampKey = getCacheTimestampKey('all_tokens_list', blockchain);
    localStorage.setItem(cacheKey, JSON.stringify(parsedTokens));
    localStorage.setItem(cacheTimestampKey, Date.now().toString());
  } catch (error) {
    console.error(error);
  }
}

export function getCachedAllTokens(blockchain: SupportedBlockchain): {
  isCached: boolean;
  lockTokens: CoinGeckoToken[] | null;
} {
  try {
    const cacheKey = getCacheKey('all_tokens_list', blockchain);
    const cacheTimestampKey = getCacheTimestampKey('all_tokens_list', blockchain);
    const timestamp = localStorage.getItem(cacheTimestampKey);
    const now = Date.now();
    if (timestamp && now - parseInt(timestamp) < ALL_TOKENS_LIST_CACHE_DURATION) {
      const cachedTokens = localStorage.getItem(cacheKey);
      if (cachedTokens) {
        const parsedTokens = JSON.parse(cachedTokens);
        if (parsedTokens && parsedTokens.length > 0) {
          return {
            isCached: true,
            lockTokens: parsedTokens,
          };
        }
      }
    }
    return { isCached: false, lockTokens: null };
  } catch (error) {
    console.error(error);
    return { isCached: false, lockTokens: null };
  }
}

export function cacheTokenMetadata(
  chain: SupportedBlockchain,
  tokenAddress: string,
  value: TokenMetadataResponse,
) {
  try {
    const cacheKey = getCacheKey('token_metadata', chain, tokenAddress);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedTokenMetadata(
  chain: SupportedBlockchain,
  tokenAddress: string,
): { isCached: boolean; value: TokenMetadataResponse | null } {
  try {
    const cacheKey = getCacheKey('token_metadata', chain, tokenAddress);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as TokenMetadataResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedTokenMetadata(chain: SupportedBlockchain, tokenAddress: string) {
  try {
    const cacheKey = getCacheKey('token_metadata', chain, tokenAddress);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cacheERCTokenMetadata(
  chain: SupportedBlockchain,
  tokenAddress: string,
  value: ERC20MetadataResponse,
) {
  try {
    const cacheKey = getCacheKey('erc_token_metadata', chain, tokenAddress);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedERCTokenMetadata(
  chain: SupportedBlockchain,
  tokenAddress: string,
): { isCached: boolean; value: ERC20MetadataResponse | null } {
  try {
    const cacheKey = getCacheKey('erc_token_metadata', chain, tokenAddress);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as ERC20MetadataResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedERCTokenMetadata(chain: SupportedBlockchain, tokenAddress: string) {
  try {
    const cacheKey = getCacheKey('erc_token_metadata', chain, tokenAddress);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}
