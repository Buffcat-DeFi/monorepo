import { Blockchain, CoinGeckoToken } from '@/types/global';
import { TokenMetadataResponse } from "@/types/api";
import { getCachedTokenMetadata, clearCachedTokenMetadata } from "../../lib/cache/tokens";
import { fetchTokenMetadata } from "../../services/query/tokens";
import { UseQueryOptions } from "@tanstack/react-query";
import { cacheAllTokens, getCachedAllTokens } from '../../lib/cache/tokens';
import { getTokensList } from '../../services/query/tokens';
import { useQuery } from '@tanstack/react-query';

export function useAllTokensList(blockchain: Blockchain) {
  return useQuery<CoinGeckoToken[] | undefined>({
    queryKey: [`allTokensList_for_${blockchain}`, blockchain],
    queryFn: async () => {
      const cachedData = getCachedAllTokens(blockchain.id);
      if (cachedData.isCached && cachedData.lockTokens) return cachedData.lockTokens;
      const tokens = await getTokensList(blockchain);
      cacheAllTokens(tokens, blockchain.id);
      return tokens;
    },
  });
}

export function useTokenMetadata(chain: Blockchain, tokenAddress: string, options?: Omit<UseQueryOptions<TokenMetadataResponse, Error>, "queryKey" | "queryFn">) {
  const enabled = !!chain && !!tokenAddress;

  const query = useQuery<TokenMetadataResponse, Error>({
    queryKey: ["tokenMetadata", chain?.id, tokenAddress],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedTokenMetadata(chain.id, tokenAddress);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchTokenMetadata(chain.id, tokenAddress);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedTokenMetadata(chain.id, tokenAddress);
    return query.refetch();
  };

  return {
    ...query,
    refresh,
  };
}
