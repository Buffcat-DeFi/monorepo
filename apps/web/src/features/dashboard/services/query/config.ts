import { SupportedBlockchain } from "@/types/global";
import { WhitelistResponse, StableCoinsResponse, TokenPoolResponse, DataFeedResponse } from "@/types/api";
import { cacheWhitelist, cacheStableCoins, cacheTokenPool, cacheDataFeed } from "../../lib/cache/config";

export async function fetchWhitelist(chain: SupportedBlockchain): Promise<WhitelistResponse> {
  const response = await fetch(`/api/contract/whitelist?chain=${chain}`);
  const payload = await response.json();
  if (response.ok) {
    cacheWhitelist(chain, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch whitelist");
}

export async function fetchStableCoins(chain: SupportedBlockchain): Promise<StableCoinsResponse> {
  const response = await fetch(`/api/contract/stable?chain=${chain}`);
  const payload = await response.json();
  if (response.ok) {
    cacheStableCoins(chain, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch stable coins");
}

export async function fetchTokenPool(chain: SupportedBlockchain, tokenAddress: string): Promise<TokenPoolResponse> {
  const response = await fetch(`/api/contract/pairs?chain=${chain}&tokenAddress=${tokenAddress}`);
  const payload = await response.json();
  if (response.ok) {
    cacheTokenPool(chain, tokenAddress, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch token pool");
}

export async function fetchDataFeed(chain: SupportedBlockchain, tokenAddress: string): Promise<DataFeedResponse> {
  const response = await fetch(`/api/contract/feed?chain=${chain}&tokenAddress=${tokenAddress}`);
  const payload = await response.json();
  if (response.ok) {
    cacheDataFeed(chain, tokenAddress, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch data feed");
}
