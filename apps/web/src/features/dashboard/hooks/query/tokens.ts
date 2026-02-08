import { Blockchain, CoinGeckoTokenType } from "@/types/global";
import { cacheAllTokens, getCachedAllTokens } from "../../lib/cache/tokens";
import { getTokensList } from "../../services/query/tokens";
import { useQuery } from "@tanstack/react-query";

export function useAllTokensList(blockchain: Blockchain) {
  return useQuery<CoinGeckoTokenType[] | undefined>({
    queryKey: [`allTokensList_for_${blockchain}`, blockchain],
    queryFn: async () => {
      const cachedData = getCachedAllTokens(blockchain.id);
      if (cachedData.isCached && cachedData.lockTokens)
        return cachedData.lockTokens;
      const tokens = await getTokensList(blockchain);
      cacheAllTokens(tokens, blockchain.id);
      return tokens;
    },
  });
}
