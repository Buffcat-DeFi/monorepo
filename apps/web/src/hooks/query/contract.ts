import { clearCachedWhitelist, getCachedWhitelist } from '@/cache/config';
import { fetchWhitelist } from '@/services/query/contract';
import { WhitelistResponse } from '@/types/api';
import { Blockchain } from '@/types/global';
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

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
