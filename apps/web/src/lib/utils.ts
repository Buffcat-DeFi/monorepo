import { ErrorResponse } from '@/types/api';
import { ClassValue, clsx } from 'clsx';
import { NextResponse } from 'next/server';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getEvmRpcUrl(chain: 'eth' | 'base') {
  const rpcUrl = chain === 'eth' ? process.env.ETH_RPC_URL : process.env.BASE_RPC_URL;

  if (!rpcUrl) {
    throw new Error(`RPC URL not configured for ${chain}.`);
  }

  return rpcUrl;
}

export function getSolanaRpcUrl() {
  const rpcUrl = process.env.SOL_RPC_URL ?? 'https://api.mainnet-beta.solana.com';

  if (!rpcUrl) {
    throw new Error('RPC URL not configured for solana.');
  }

  return rpcUrl;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json<ErrorResponse>(
    { message },
    {
      status,
    },
  );
}
