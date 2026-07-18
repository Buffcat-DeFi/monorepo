import { Blockchain } from '@/types/global';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
  WhitelistResponse,
  StableCoinsResponse,
  TokenPoolResponse,
  DataFeedResponse,
} from '@/types/api';
import {
  getCachedWhitelist,
  clearCachedWhitelist,
  getCachedStableCoins,
  clearCachedStableCoins,
  getCachedTokenPool,
  clearCachedTokenPool,
  getCachedDataFeed,
  clearCachedDataFeed,
} from '../../lib/cache/config';
import {
  fetchWhitelist,
  fetchStableCoins,
  fetchTokenPool,
  fetchDataFeed,
} from '../../services/query/config';

export function useWhitelist(
  chain: Blockchain,
  options?: Omit<UseQueryOptions<WhitelistResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain;

  const query = useQuery<WhitelistResponse, Error>({
    queryKey: ['whitelist', chain?.id],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedWhitelist(chain.id);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchWhitelist(chain.id);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedWhitelist(chain.id);
    return query.refetch();
  };

  return { ...query, refresh };
}

export function useStableCoins(
  chain: Blockchain,
  options?: Omit<UseQueryOptions<StableCoinsResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain;

  const query = useQuery<StableCoinsResponse, Error>({
    queryKey: ['stable_coins', chain?.id],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedStableCoins(chain.id);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchStableCoins(chain.id);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedStableCoins(chain.id);
    return query.refetch();
  };

  return { ...query, refresh };
}

export function useTokenPool(
  chain: Blockchain,
  tokenAddress: string,
  options?: Omit<UseQueryOptions<TokenPoolResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain && !!tokenAddress;

  const query = useQuery<TokenPoolResponse, Error>({
    queryKey: ['token_pool', chain?.id, tokenAddress],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedTokenPool(chain.id, tokenAddress);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchTokenPool(chain.id, tokenAddress);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedTokenPool(chain.id, tokenAddress);
    return query.refetch();
  };

  return { ...query, refresh };
}

export function useDataFeed(
  chain: Blockchain,
  tokenAddress: string,
  options?: Omit<UseQueryOptions<DataFeedResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain && !!tokenAddress;

  const query = useQuery<DataFeedResponse, Error>({
    queryKey: ['data_feed', chain?.id, tokenAddress],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedDataFeed(chain.id, tokenAddress);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchDataFeed(chain.id, tokenAddress);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedDataFeed(chain.id, tokenAddress);
    return query.refetch();
  };

  return { ...query, refresh };
}
