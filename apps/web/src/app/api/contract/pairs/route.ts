import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { type ErrorResponse, type TokenPoolResponse, tokenRequestSchema } from '@/types/api';
import { jsonError, getEvmRpcUrl } from '@/lib/utils';
import { envVariables } from '@/lib/envVariables';
import buffcatAbi from '@/lib/evm/buffcat.json';

const TOKEN_POOLS_ABI = [
  'function tokenPools(address) view returns (address pool, address pairedToken)',
];

export async function GET(
  request: NextRequest,
): Promise<NextResponse<TokenPoolResponse | ErrorResponse>> {
  const parsedRequest = tokenRequestSchema.safeParse({
    chain: request.nextUrl.searchParams.get('chain'),
    tokenAddress: request.nextUrl.searchParams.get('tokenAddress'),
  });

  if (!parsedRequest.success) {
    return jsonError('Invalid request parameters.', 400);
  }

  const { chain, tokenAddress } = parsedRequest.data;

  try {
    const rpcUrl = getEvmRpcUrl(chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contractAddress = envVariables.buffcatContract[chain];

    if (!contractAddress) {
      return jsonError('Contract address not set for this chain.', 500);
    }

    const contract = new ethers.Contract(contractAddress, buffcatAbi.abi, provider);
    const result = await contract.tokenPools(tokenAddress);

    const response: TokenPoolResponse = {
      data: { pool: result.pool, pairedToken: result.pairedToken },
    };
    return NextResponse.json<TokenPoolResponse>(response, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonError('Failed to fetch token pool.', 500);
  }
}
