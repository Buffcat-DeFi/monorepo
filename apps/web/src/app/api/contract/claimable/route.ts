import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  chainRequestSchema,
  claimableResponseSchema,
  type ErrorResponse,
  type ClaimableResponse,
} from '@/types/api';
import { getCacheKey } from '@/features/dashboard/lib/cache/keys';
import { redis } from '@/lib/redis';
import { jsonError, sleep, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import { getEvmAbi } from '@/features/dashboard/lib/utils';

async function getCachedData(cacheKey: string): Promise<ClaimableResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    const parsed = claimableResponseSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ClaimableResponse | ErrorResponse>> {
  const parsedRequest = chainRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain } = parsedRequest.data;
  const cacheKey = getCacheKey('claimable', chain);

  // const cached = await getCachedData(cacheKey);
  // if (cached) {
  //   return NextResponse.json<ClaimableResponse>(cached, { status: 200 });
  // }

  // const lockKey = `lock:${cacheKey}`;
  // const lock = await redis.set(lockKey, '1', { nx: true, ex: 10 });

  // if (!lock) {
  //   await sleep(100);
  //   const cached = await getCachedData(cacheKey);
  //   if (cached) {
  //     return NextResponse.json<ClaimableResponse>(cached, { status: 200 });
  //   } else {
  //     return jsonError('Please retry shortly', 429);
  //   }
  // }

  try {
    const buffcatAbi = getEvmAbi(chain);
    const rpcUrl = getEvmRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = envVariables.buffcatContract[chain];

    if (!contractAddress) {
      return jsonError('Contract address not set for this chain.', 500);
    }

    const contract = new ethers.Contract(contractAddress, buffcatAbi, provider);

    const poolTokens: string[] = await contract.getPoolTokens.staticCall();

    const response: ClaimableResponse = {
      data: poolTokens,
    };

    // await redis.set(cacheKey, response, { ex: 3600 });
    return NextResponse.json<ClaimableResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch claimable pool tokens.', 500);
  } finally {
    // if (lock) await redis.del(lockKey);
  }
}
