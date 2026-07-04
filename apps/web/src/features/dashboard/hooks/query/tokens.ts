import { Blockchain, CoinGeckoToken } from '@/types/global';
import { ERC20MetadataResponse, TokenMetadataResponse } from '@/types/api';
import { getCachedTokenMetadata, clearCachedTokenMetadata } from '../../lib/cache/tokens';
import { fetchTokenMetadata } from '../../services/query/tokens';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { cacheAllTokens, getCachedAllTokens } from '../../lib/cache/tokens';
import { getTokensList } from '../../services/query/tokens';
import { ethers } from 'ethers';

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

export function useTokenMetadata(
  chain: Blockchain,
  tokenAddress: string,
  options?: Omit<UseQueryOptions<TokenMetadataResponse | null, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain && !!tokenAddress;

  const query = useQuery<TokenMetadataResponse | null, Error>({
    queryKey: ['tokenMetadata', chain?.id, tokenAddress],
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const cachedData = getCachedTokenMetadata(chain.id, tokenAddress);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      try {
        return await fetchTokenMetadata(chain.id, tokenAddress);
      } catch (error) {
        return null; // Cache the failure as null to prevent infinite refetching of unknown tokens
      }
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

export function useERCMetadata(
  chain: Blockchain,
  tokenAddress: string,
  options?: Omit<UseQueryOptions<ERC20MetadataResponse | null, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain && !!tokenAddress;

  return useQuery({
    queryKey: ['ercMetadata', chain?.id, tokenAddress],
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const rpcUrl =
        chain.name === 'Ethereum'
          ? process.env.NEXT_PUBLIC_ETH_RPC_URL!
          : process.env.NEXT_PUBLIC_BASE_RPC_URL!;
      const provider = new ethers.JsonRpcProvider(rpcUrl);

      const abi = [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
      ];

      const contract = new ethers.Contract(tokenAddress, abi, provider);

      try {
        const [name, symbol, decimals] = await Promise.all([
          contract.name().catch(() => null),
          contract.symbol().catch(() => `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`),
          contract.decimals().catch(() => null),
        ]);

        return { name, symbol, decimals: Number(decimals) };
      } catch (e) {
        return null;
      }
    },
    ...options,
  });
}
