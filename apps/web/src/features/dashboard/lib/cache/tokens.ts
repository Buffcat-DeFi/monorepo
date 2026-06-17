import { CoinGeckoToken, SupportedBlockchain } from '@/types/global';
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
