import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  userRequestSchema,
  boostResponseSchema,
  type ErrorResponse,
  type BoostResponse,
} from '@/types/api';
import { getCacheKey } from '@/features/dashboard/lib/cache/keys';
import { redis } from '@/lib/redis';
import { jsonError, sleep, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import { getEvmAbi } from '@/features/dashboard/lib/utils';

async function getCachedData(cacheKey: string): Promise<BoostResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    const parsed = boostResponseSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<BoostResponse | ErrorResponse>> {
  const parsedRequest = userRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
    userKey: request.nextUrl.searchParams.get('userKey'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain, userKey } = parsedRequest.data;
  const cacheKey = getCacheKey('boost', chain, userKey);

  const cached = await getCachedData(cacheKey);
  if (cached) {
    return NextResponse.json<BoostResponse>(cached, { status: 200 });
  }

  const lockKey = `lock:${cacheKey}`;
  const lock = await redis.set(lockKey, '1', { nx: true, ex: 10 });

  if (!lock) {
    await sleep(100);
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return NextResponse.json<BoostResponse>(cached, { status: 200 });
    } else {
      return jsonError('Please retry shortly', 429);
    }
  }

  try {
    const buffcatAbi = getEvmAbi(chain);
    const rpcUrl = getEvmRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = envVariables.buffcatContract[chain];

    if (!contractAddress) {
      return jsonError('Contract address not set for this chain.', 500);
    }

    const contract = new ethers.Contract(contractAddress, buffcatAbi, provider);

    const boostEndTime = await contract.referralBoostEndTime(userKey);

    const response: BoostResponse = {
      data: boostEndTime.toString(),
    };

    await redis.set(cacheKey, response, { ex: 3600 });
    return NextResponse.json<BoostResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch boost data.', 500);
  } finally {
    if (lock) await redis.del(lockKey);
  }
}
