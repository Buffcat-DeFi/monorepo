export type SupportedBlockchain = 'eth' | 'solana' | 'base';

export type Blockchain = {
  chainId: number;
  id: SupportedBlockchain;
  name: string;
  logoUrl: string;
  isSupported: boolean;
};

export type CoinGeckoTokenType = {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
};

export enum LockType {
  FLEXIBLE,
  FIXED,
}

export type LockInfo = {
  amount: number;
  lockStart: number;
  lockEnd: number;
  lastClaim: number;
  withdrawn: number;
  _days: number;
  daysOfUnclaimedRewards: number;
  lockedToken: string;
  lockType: LockType;
};
