import { SupportedBlockchain } from "@/types/global";

export type CacheKey = "all_tokens_list";

export function getCacheKey(
  cacheKey: CacheKey,
  blockchainParam: SupportedBlockchain
) {
  return `buff_cat_${blockchainParam}_${cacheKey}`;
}

export function getCacheTimestampKey(
  cacheKey: CacheKey,
  blockchainParam: SupportedBlockchain
) {
  return `buff_cat_${blockchainParam}_${cacheKey}_timestamp`;
}
