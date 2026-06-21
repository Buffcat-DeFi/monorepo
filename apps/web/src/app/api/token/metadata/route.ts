import { NextRequest, NextResponse } from 'next/server';
import { tokenRequestSchema, type ErrorResponse, type TokenMetadataResponse } from '@/types/api';
import { getCacheKey } from '@/features/dashboard/lib/cache/keys';
import { redis } from '@/lib/redis';
import { jsonError, sleep } from '@/lib/utils';

async function getCachedData(cacheKey: string): Promise<TokenMetadataResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as TokenMetadataResponse;
    }
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<TokenMetadataResponse | ErrorResponse>> {
  const parsedRequest = tokenRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
    tokenAddress: request.nextUrl.searchParams.get('tokenAddress'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain, tokenAddress } = parsedRequest.data;
  const cacheKey = getCacheKey('token_metadata', chain, tokenAddress);

  const cached = await getCachedData(cacheKey);
  if (cached) {
    return NextResponse.json<TokenMetadataResponse>(cached, { status: 200 });
  }

  const lockKey = `lock:${cacheKey}`;
  const lock = await redis.set(lockKey, '1', { nx: true, ex: 10 });

  if (!lock) {
    await sleep(100);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json<TokenMetadataResponse>(cached, { status: 200 });
    } else {
      return jsonError('Please retry shortly', 429);
    }
  }

  try {
    const url = `https://api.geckoterminal.com/api/v2/networks/${chain}/tokens/${tokenAddress}?include_composition=false&include_inactive_source=false`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`GeckoTerminal API error: ${res.status} ${res.statusText}`);
    }

    const payload = (await res.json()) as TokenMetadataResponse;

    await redis.set(cacheKey, payload, { ex: 3600 });
    return NextResponse.json<TokenMetadataResponse>(payload, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch token metadata.', 500);
  } finally {
    if (lock) await redis.del(lockKey);
  }
}
