import { Blockchain } from '@/types/global';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { envVariables } from '@/lib/envVariables';
import { BoostResponse, ClaimableResponse, LocksResponse, PoolResponse } from '@/types/api';
import {
  getCachedBoost,
  clearCachedBoost,
  getCachedClaimable,
  clearCachedClaimable,
  getCachedLocks,
  clearCachedLocks,
  getCachedPool,
  clearCachedPool,
} from '../../../../cache/dashboard';
import { fetchBoost, fetchClaimable, fetchLocks, fetchPool } from '../../services/query/contract';

interface UseTokenBalanceParams {
  chain: Blockchain;
  tokenAddressOrMint: string;
}

export function useTokenDerivative(
  { chain, tokenAddressOrMint }: UseTokenBalanceParams,
  options?: UseQueryOptions<string, Error>,
) {
  return useQuery<string, Error>({
    queryKey: ['tokenDerivative', chain, tokenAddressOrMint],
    enabled: !!chain && !!tokenAddressOrMint,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      switch (chain.name) {
        case 'Ethereum':
        case 'Base': {
          const rpcUrl =
            chain.name === 'Ethereum'
              ? process.env.NEXT_PUBLIC_ETH_RPC_URL!
              : process.env.NEXT_PUBLIC_BASE_RPC_URL!;
          const provider = new ethers.JsonRpcProvider(rpcUrl);

          const abi = ['function tokenDerivatives(address token) view returns (address)'];

          const buffcatContract =
            chain.id == 'eth'
              ? envVariables.buffcatContract.eth
              : envVariables.buffcatContract.base;
          if (buffcatContract == '') {
            throw new Error('Buffcat contract address not set.');
          }

          const contract = new ethers.Contract(buffcatContract, abi, provider);

          console.log('Blockchain: ', chain.name);
          console.log('Buffcat Contract: ', buffcatContract);
          console.log('Token: ', tokenAddressOrMint);

          const tokenDerivative = await contract.tokenDerivatives(tokenAddressOrMint);
          return String(tokenDerivative);
        }

        default:
          throw new Error(`Unsupported chain: ${chain}`);
      }
    },
    ...options,
  });
}

export function useBoost(
  chain: Blockchain,
  userKey: string,
  options?: Omit<UseQueryOptions<BoostResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain && !!userKey;

  const query = useQuery<BoostResponse, Error>({
    queryKey: ['boost', chain?.id, userKey],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedBoost(chain.id, userKey);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchBoost(chain.id, userKey);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedBoost(chain.id, userKey);
    return query.refetch();
  };

  return { ...query, refresh };
}

export function useClaimable(
  chain: Blockchain,
  options?: Omit<UseQueryOptions<ClaimableResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain;

  const query = useQuery<ClaimableResponse, Error>({
    queryKey: ['claimable', chain?.id],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedClaimable(chain.id);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchClaimable(chain.id);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedClaimable(chain.id);
    return query.refetch();
  };

  return { ...query, refresh };
}

export function useLocks(
  chain: Blockchain,
  userKey: string,
  options?: Omit<UseQueryOptions<LocksResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain && !!userKey;

  const query = useQuery<LocksResponse, Error>({
    queryKey: ['locks', chain?.id, userKey],
    enabled,
    staleTime: 1000 * 60 * 5,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedLocks(chain.id, userKey);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchLocks(chain.id, userKey);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedLocks(chain.id, userKey);
    return query.refetch();
  };

  return { ...query, refresh };
}

export function usePool(
  chain: Blockchain,
  options?: Omit<UseQueryOptions<PoolResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const enabled = !!chain;

  const query = useQuery<PoolResponse, Error>({
    queryKey: ['pool', chain?.id],
    enabled,
    staleTime: Infinity,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const cachedData = getCachedPool(chain.id);
      if (cachedData.isCached && cachedData.value !== null) {
        return cachedData.value;
      }
      return fetchPool(chain.id);
    },
    ...options,
  });

  const refresh = async () => {
    clearCachedPool(chain.id);
    return query.refetch();
  };

  return { ...query, refresh };
}
