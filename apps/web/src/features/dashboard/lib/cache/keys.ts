import { SupportedBlockchain } from '@/types/global';

export type CacheKey =
  | 'all_tokens_list'
  | 'boost'
  | 'claimable'
  | 'locks'
  | 'pool'
  | 'token_metadata'
  | 'erc_token_metadata'
  | 'token_price'
  | 'whitelist'
  | 'stable_coins'
  | 'token_pool'
  | 'data_feed';

export function getCacheKey(
  cacheKey: CacheKey,
  blockchainParam: SupportedBlockchain,
  userKey?: string,
): string {
  return userKey
    ? `buff_cat_${blockchainParam}_${cacheKey}_${userKey}`
    : `buff_cat_${blockchainParam}_${cacheKey}`;
}

export function getCacheTimestampKey(
  cacheKey: CacheKey,
  blockchainParam: SupportedBlockchain,
  userKey?: string,
): string {
  return userKey
    ? `buff_cat_${blockchainParam}_${cacheKey}_${userKey}_timestamp`
    : `buff_cat_${blockchainParam}_${cacheKey}_timestamp`;
}
