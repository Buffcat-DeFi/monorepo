import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { type ErrorResponse, type DataFeedResponse, tokenRequestSchema } from '@/types/api';
import { jsonError, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import { getEvmAbi } from '@/features/dashboard/lib/utils';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<DataFeedResponse | ErrorResponse>> {
  const parsedRequest = tokenRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
    tokenAddress: request.nextUrl.searchParams.get('tokenAddress'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain, tokenAddress } = parsedRequest.data;

  try {
    const buffcatAbi = getEvmAbi(chain);
    const rpcUrl = getEvmRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = envVariables.buffcatContract[chain];

    if (!contractAddress) {
      return jsonError('Contract address not set for this chain.', 500);
    }

    const contract = new ethers.Contract(contractAddress, buffcatAbi, provider);
    const feedAddress: string = await contract.dataFeeds(tokenAddress);

    const response: DataFeedResponse = { data: feedAddress };
    return NextResponse.json<DataFeedResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch data feed.', 500);
  }
}
