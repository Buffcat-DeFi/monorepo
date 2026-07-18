import { getCacheKey } from "./keys";
import { SupportedBlockchain } from "@/types/global";
import { WhitelistResponse, StableCoinsResponse, TokenPoolResponse, DataFeedResponse } from "@/types/api";

export function cacheWhitelist(chain: SupportedBlockchain, value: WhitelistResponse) {
  try {
    const cacheKey = getCacheKey("whitelist", chain);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedWhitelist(chain: SupportedBlockchain): { isCached: boolean; value: WhitelistResponse | null } {
  try {
    const cacheKey = getCacheKey("whitelist", chain);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as WhitelistResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedWhitelist(chain: SupportedBlockchain) {
  try {
    const cacheKey = getCacheKey("whitelist", chain);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cacheStableCoins(chain: SupportedBlockchain, value: StableCoinsResponse) {
  try {
    const cacheKey = getCacheKey("stable_coins", chain);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedStableCoins(chain: SupportedBlockchain): { isCached: boolean; value: StableCoinsResponse | null } {
  try {
    const cacheKey = getCacheKey("stable_coins", chain);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as StableCoinsResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedStableCoins(chain: SupportedBlockchain) {
  try {
    const cacheKey = getCacheKey("stable_coins", chain);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cacheTokenPool(chain: SupportedBlockchain, tokenAddress: string, value: TokenPoolResponse) {
  try {
    const cacheKey = getCacheKey("token_pool", chain, tokenAddress);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedTokenPool(chain: SupportedBlockchain, tokenAddress: string): { isCached: boolean; value: TokenPoolResponse | null } {
  try {
    const cacheKey = getCacheKey("token_pool", chain, tokenAddress);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as TokenPoolResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedTokenPool(chain: SupportedBlockchain, tokenAddress: string) {
  try {
    const cacheKey = getCacheKey("token_pool", chain, tokenAddress);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cacheDataFeed(chain: SupportedBlockchain, tokenAddress: string, value: DataFeedResponse) {
  try {
    const cacheKey = getCacheKey("data_feed", chain, tokenAddress);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedDataFeed(chain: SupportedBlockchain, tokenAddress: string): { isCached: boolean; value: DataFeedResponse | null } {
  try {
    const cacheKey = getCacheKey("data_feed", chain, tokenAddress);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as DataFeedResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedDataFeed(chain: SupportedBlockchain, tokenAddress: string) {
  try {
    const cacheKey = getCacheKey("data_feed", chain, tokenAddress);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}
