import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  chainRequestSchema,
  poolResponseSchema,
  type ErrorResponse,
  type PoolResponse,
} from '@/types/api';
import { getCacheKey } from '@/cache/keys';
import { redis } from '@/cache/redis';
import { jsonError, sleep, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import buffcatAbi from '@/lib/evm/buffcat.json';

async function getCachedData(cacheKey: string): Promise<PoolResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    const parsed = poolResponseSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<PoolResponse | ErrorResponse>> {
  const parsedRequest = chainRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain } = parsedRequest.data;
  const cacheKey = getCacheKey('pool', chain);

  const cached = await getCachedData(cacheKey);
  if (cached) {
    return NextResponse.json<PoolResponse>(cached, { status: 200 });
  }

  const lockKey = `lock:${cacheKey}`;
  const lock = await redis.set(lockKey, '1', { nx: true, ex: 10 });

  if (!lock) {
    await sleep(100);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json<PoolResponse>(cached, { status: 200 });
    } else {
      return jsonError('Please retry shortly', 429);
    }
  }

  try {
    const rpcUrl = getEvmRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = envVariables.buffcatContract[chain];

    if (!contractAddress) {
      return jsonError('Contract address not set for this chain.', 500);
    }

    const contract = new ethers.Contract(contractAddress, buffcatAbi.abi, provider);

    const [
      dailyNonStablePoolClaimLimit,
      dailyStablePoolClaimLimit,
      nonStableRewardPoolUSDValue,
      stableRewardPoolUSDValue,
    ] = await Promise.all([
      contract.dailyNonStablePoolClaimLimit(),
      contract.dailyStablePoolClaimLimit(),
      contract.nonStableRewardPoolUSDValue(),
      contract.stableRewardPoolUSDValue(),
    ]);

    const response: PoolResponse = {
      data: {
        dailyNonStablePoolClaimLimit: dailyNonStablePoolClaimLimit.toString(),
        dailyStablePoolClaimLimit: dailyStablePoolClaimLimit.toString(),
        nonStableRewardPoolUSDValue: nonStableRewardPoolUSDValue.toString(),
        stableRewardPoolUSDValue: stableRewardPoolUSDValue.toString(),
      },
    };

    await redis.set(cacheKey, response, { ex: 3600 });
    return NextResponse.json<PoolResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch pool data.', 500);
  } finally {
    if (lock) await redis.del(lockKey);
  }
}
