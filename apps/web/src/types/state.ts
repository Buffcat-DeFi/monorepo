import { CoinGeckoToken, SupportedBlockchain } from './global';
import { CoingeckoApiResponse } from './api';

export type TokenSelectorAtom = {
  isOpen: boolean;
  mode: 'all' | 'locks';
  onClose: () => void;
  onSelectToken: (token: CoinGeckoToken) => void;
};

export type SelectedTokensAtom = {
  lockToken: {
    [key in SupportedBlockchain]: CoinGeckoToken | null;
  };
  unlockToken: {
    [key in SupportedBlockchain]: CoinGeckoToken | null;
  };
  rewardTokens: {
    [key in SupportedBlockchain]: CoinGeckoToken[] | null;
  };
};

export type Tab = 'lock' | 'unlock' | 'rewards';

export type CacheKey =
  | 'all_tokens_cache'
  | 'locks_cache'
  | 'lock_tokens_metadata_cache'
  | 'pool_values_cache'
  | 'claimable_tokens_cache'
  | 'claimable_tokens_metadata_cache'
  | 'referral_boost_end_time_cache'
  | 'user_reward_calculations_cache';

export type RewardPerLock = {
  fees: number | null;
  expectedRewardsInUsd: number | null;
};

export type RewardCalculations = {
  allExpectedRewards: RewardPerLock[];
  totalExpectedRewards: number | null;
};

export type SelectedRewardToken = CoingeckoApiResponse & {
  address: string;
  amount: number;
};

export type UserState = {
  address: string;
  selectedLockIndex: number;
  loggedIn: boolean;
};
