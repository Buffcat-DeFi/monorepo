import { cacheWhitelist } from '@/cache/config';
import { WhitelistResponse } from '@/types/api';
import { SupportedBlockchain } from '@/types/global';

export async function fetchWhitelist(chain: SupportedBlockchain): Promise<WhitelistResponse> {
  const response = await fetch(`/api/contract/whitelist?chain=${chain}`);
  const payload = await response.json();
  if (response.ok) {
    cacheWhitelist(chain, payload);
    return payload;
  }
  throw new Error(payload.message || 'Failed to fetch whitelist');
}
