import { SupportedBlockchain } from "@/types/global";
import { BoostResponse, ClaimableResponse, LocksResponse, PoolResponse } from "@/types/api";
import { cacheBoost, cacheClaimable, cacheLocks, cachePool } from "../../lib/cache/contract";

export async function fetchBoost(chain: SupportedBlockchain, userKey: string): Promise<BoostResponse> {
  const response = await fetch(`/api/contract/boost?chain=${chain}&userKey=${userKey}`);
  const payload = await response.json();
  if (response.ok) {
    cacheBoost(chain, userKey, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch boost");
}

export async function fetchClaimable(chain: SupportedBlockchain): Promise<ClaimableResponse> {
  const response = await fetch(`/api/contract/claimable?chain=${chain}`);
  const payload = await response.json();
  if (response.ok) {
    cacheClaimable(chain, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch claimable");
}

export async function fetchLocks(chain: SupportedBlockchain, userKey: string): Promise<LocksResponse> {
  const response = await fetch(`/api/contract/locks?chain=${chain}&userKey=${userKey}`);
  const payload = await response.json();
  if (response.ok) {
    cacheLocks(chain, userKey, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch locks");
}

export async function fetchPool(chain: SupportedBlockchain): Promise<PoolResponse> {
  const response = await fetch(`/api/contract/pool?chain=${chain}`);
  const payload = await response.json();
  if (response.ok) {
    cachePool(chain, payload);
    return payload;
  }
  throw new Error(payload.message || "Failed to fetch pool");
}
