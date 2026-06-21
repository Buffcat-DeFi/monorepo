import { getCacheKey } from "./keys";
import { SupportedBlockchain } from "@/types/global";
import { BoostResponse, ClaimableResponse, LocksResponse, PoolResponse } from "@/types/api";

export function cacheBoost(chain: SupportedBlockchain, userKey: string, value: BoostResponse) {
  try {
    const cacheKey = getCacheKey("boost", chain, userKey);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedBoost(chain: SupportedBlockchain, userKey: string): { isCached: boolean; value: BoostResponse | null } {
  try {
    const cacheKey = getCacheKey("boost", chain, userKey);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as BoostResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedBoost(chain: SupportedBlockchain, userKey: string) {
  try {
    const cacheKey = getCacheKey("boost", chain, userKey);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cacheClaimable(chain: SupportedBlockchain, value: ClaimableResponse) {
  try {
    const cacheKey = getCacheKey("claimable", chain);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedClaimable(chain: SupportedBlockchain): { isCached: boolean; value: ClaimableResponse | null } {
  try {
    const cacheKey = getCacheKey("claimable", chain);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as ClaimableResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedClaimable(chain: SupportedBlockchain) {
  try {
    const cacheKey = getCacheKey("claimable", chain);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cacheLocks(chain: SupportedBlockchain, userKey: string, value: LocksResponse) {
  try {
    const cacheKey = getCacheKey("locks", chain, userKey);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedLocks(chain: SupportedBlockchain, userKey: string): { isCached: boolean; value: LocksResponse | null } {
  try {
    const cacheKey = getCacheKey("locks", chain, userKey);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as LocksResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedLocks(chain: SupportedBlockchain, userKey: string) {
  try {
    const cacheKey = getCacheKey("locks", chain, userKey);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}

export function cachePool(chain: SupportedBlockchain, value: PoolResponse) {
  try {
    const cacheKey = getCacheKey("pool", chain);
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch (error) {
    console.error(error);
  }
}

export function getCachedPool(chain: SupportedBlockchain): { isCached: boolean; value: PoolResponse | null } {
  try {
    const cacheKey = getCacheKey("pool", chain);
    const cachedValue = localStorage.getItem(cacheKey);
    if (!cachedValue) return { isCached: false, value: null };
    const parsedValue = JSON.parse(cachedValue) as PoolResponse;
    return { isCached: true, value: parsedValue };
  } catch (error) {
    console.error(error);
    return { isCached: false, value: null };
  }
}

export function clearCachedPool(chain: SupportedBlockchain) {
  try {
    const cacheKey = getCacheKey("pool", chain);
    localStorage.removeItem(cacheKey);
  } catch (error) {
    console.error(error);
  }
}
