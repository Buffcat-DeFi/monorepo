import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { type ErrorResponse, type WhitelistResponse, chainRequestSchema } from '@/types/api';
import { jsonError, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import { getEvmAbi } from '@/features/dashboard/lib/utils';

export async function GET(
  request: NextRequest,
): Promise<NextResponse<WhitelistResponse | ErrorResponse>> {
  const parsedRequest = chainRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain } = parsedRequest.data;

  try {
    const buffcatAbi = getEvmAbi(chain);
    const rpcUrl = getEvmRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = envVariables.buffcatContract[chain];

    if (!contractAddress) {
      return jsonError('Contract address not set for this chain.', 500);
    }

    const contract = new ethers.Contract(contractAddress, buffcatAbi, provider);
    const tokens: string[] = await contract.getWhitelistedTokens();

    const response: WhitelistResponse = { data: tokens };
    return NextResponse.json<WhitelistResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch whitelisted tokens.', 500);
  }
}
