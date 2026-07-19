import { NextRequest, NextResponse } from 'next/server';
import { tokenRequestSchema, type ErrorResponse, type ERC20MetadataResponse } from '@/types/api';
import { getCacheKey } from '@/cache/keys';
import { redis } from '@/cache/redis';
import { getEvmRpcUrl, jsonError, sleep } from '@/lib/utils';
import { ethers } from 'ethers';

async function getCachedData(cacheKey: string): Promise<ERC20MetadataResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return cached as ERC20MetadataResponse;
    }
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ERC20MetadataResponse | ErrorResponse>> {
  const parsedRequest = tokenRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
    tokenAddress: request.nextUrl.searchParams.get('tokenAddress'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain, tokenAddress } = parsedRequest.data;
  const cacheKey = getCacheKey('erc_token_metadata', chain, tokenAddress);

  const cached = await getCachedData(cacheKey);
  if (cached) {
    return NextResponse.json<ERC20MetadataResponse>(cached, { status: 200 });
  }

  const lockKey = `lock:${cacheKey}`;
  const lock = await redis.set(lockKey, '1', { nx: true, ex: 10 });

  if (!lock) {
    await sleep(100);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json<ERC20MetadataResponse>(cached, { status: 200 });
    } else {
      return jsonError('Please retry shortly', 429);
    }
  }

  try {
    const rpcUrl = getEvmRpcUrl(chain);

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const abi = [
      'function name() view returns (string)',
      'function symbol() view returns (string)',
      'function decimals() view returns (uint8)',
    ];

    const contract = new ethers.Contract(tokenAddress, abi, provider);

    const [name, symbol, decimals] = await Promise.all([
      contract.name().catch(() => null),
      contract.symbol().catch(() => null),
      contract.decimals().catch(() => null),
    ]);

    const payload = {
      name,
      symbol,
      decimals: decimals !== null ? Number(decimals) : null,
    };

    await redis.set(cacheKey, payload, { ex: 3600 });

    return NextResponse.json<ERC20MetadataResponse>(payload, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch token metadata.', 500);
  } finally {
    if (lock) await redis.del(lockKey);
  }
}
