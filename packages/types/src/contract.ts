export type LockType = 'FLEXIBLE' | 'FIXED';

export type LockInfo = {
  amount: number;
  lockStart: number;
  lockEnd: number;
  lastClaim: number;
  withdrawn: number;
  days: number;
  daysOfUnclaimedRewards: number;
  lockedToken: string;
  lockType: LockType;
};

export type Lock = LockInfo & {
  index: number;
};

export type PoolValues = {
  nonStableRewardPoolUsdValue: number | null;
  stableRewardPoolUsdValue: number | null;
  nonStableDailyClaimLimit: number | null;
  stableDailyClaimLimit: number | null;
};

export type ContractTokenData = {
  address: string;
  amount: number;
};
