import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import {
  userRequestSchema,
  locksResponseSchema,
  type ErrorResponse,
  type LocksResponse,
  type Lock,
} from '@/types/api';
import { getCacheKey } from '@/cache/keys';
import { redis } from '@/cache/redis';
import { jsonError, sleep, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import { getEvmAbi } from '@/lib/utils';

async function getCachedData(cacheKey: string): Promise<LocksResponse | null> {
  try {
    const cached = await redis.get(cacheKey);
    const parsed = locksResponseSchema.safeParse(cached);
    if (parsed.success) return parsed.data;
  } catch {}
  return null;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse<LocksResponse | ErrorResponse>> {
  const parsedRequest = userRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
    userKey: request.nextUrl.searchParams.get('userKey'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain, userKey } = parsedRequest.data;
  const cacheKey = getCacheKey('locks', chain, userKey);

  // const cached = await getCachedData(cacheKey);
  // if (cached) {
  //   return NextResponse.json<LocksResponse>(cached, { status: 200 });
  // }

  // const lockKey = `lock:${cacheKey}`;
  // const lock = await redis.set(lockKey, '1', { nx: true, ex: 10 });

  // if (!lock) {
  //   await sleep(100);
  //   const cached = await getCachedData(cacheKey);
  //   if (cached) {
  //     return NextResponse.json<LocksResponse>(cached, { status: 200 });
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

    const lockCountBig: bigint = await contract.lockCount(userKey);
    const lockCount = Number(lockCountBig);

    const lockPromises = [];
    for (let i = 0; i < lockCount; i++) {
      lockPromises.push(contract.userLocks(userKey, i));
    }

    const locksData = await Promise.all(lockPromises);

    const locks: Lock[] = locksData.map((l) => ({
      amount: l[0].toString(),
      lockStart: l[1].toString(),
      lockEnd: l[2].toString(),
      lastClaim: l[3].toString(),
      withdrawn: l[4].toString(),
      _days: l[5].toString(),
      daysOfUnclaimedRewards: l[6].toString(),
      lockedToken: l[7],
      lockType: Number(l[8]),
    }));

    const response: LocksResponse = {
      data: locks,
    };

    // await redis.set(cacheKey, response, { ex: 3600 });
    return NextResponse.json<LocksResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch user locks.', 500);
  } finally {
    // if (lock) await redis.del(lockKey);
  }
}
