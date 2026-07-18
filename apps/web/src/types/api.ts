import { z } from 'zod';

export type ErrorResponse = {
  message: string;
};

export type TokenData = {
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logo: string | null;
  price: number | null;
};

export type BlockNumber = {
  jsonrpc: string;
  id: string;
  result: string;
};

export type CoingeckoApiResponse = {
  data: {
    id: string;
    type: 'token';
    attributes: {
      address: string;
      name: string;
      symbol: string;
      decimals: number;
      image_url: string;
      coingecko_coin_id: string;
      total_supply: string;
      normalized_total_supply: string;
      price_usd: string;
      fdv_usd: string;
      total_reserve_in_usd: string;
      volume_usd: {
        h24: string;
      };
      market_cap_usd: string;
    };
    relationships: {
      top_pools: {
        data: Array<{
          id: string;
          type: 'pool';
        }>;
      };
    };
  };
};

export type ERC20MetadataResponse = {
  name: string | null;
  symbol: string;
  decimals: number | null;
};

export const chainRequestSchema = z.object({
  chain: z.enum(['eth', 'base']),
});

export const userRequestSchema = chainRequestSchema.extend({
  userKey: z.string(),
});

export const tokenRequestSchema = chainRequestSchema.extend({
  tokenAddress: z.string(),
});

export const boostResponseSchema = z.object({
  data: z.string(),
});
export type BoostResponse = z.infer<typeof boostResponseSchema>;

export const claimableResponseSchema = z.object({
  data: z.array(z.string()),
});
export type ClaimableResponse = z.infer<typeof claimableResponseSchema>;

export const lockSchema = z.object({
  amount: z.string(),
  lockStart: z.string(),
  lockEnd: z.string(),
  lastClaim: z.string(),
  withdrawn: z.string(),
  _days: z.string(),
  daysOfUnclaimedRewards: z.string(),
  lockedToken: z.string(),
  lockType: z.number(),
});
export type Lock = z.infer<typeof lockSchema>;

export const locksResponseSchema = z.object({
  data: z.array(lockSchema),
});
export type LocksResponse = z.infer<typeof locksResponseSchema>;

export const poolResponseSchema = z.object({
  data: z.object({
    dailyNonStablePoolClaimLimit: z.string(),
    dailyStablePoolClaimLimit: z.string(),
    nonStableRewardPoolUSDValue: z.string(),
    stableRewardPoolUSDValue: z.string(),
  }),
});
export type PoolResponse = z.infer<typeof poolResponseSchema>;

export type TokenMetadataResponse = CoingeckoApiResponse;

// --- Config types ---

export const whitelistResponseSchema = z.object({
  data: z.array(z.string()),
});
export type WhitelistResponse = z.infer<typeof whitelistResponseSchema>;

export const stableCoinsResponseSchema = z.object({
  data: z.array(z.string()),
});
export type StableCoinsResponse = z.infer<typeof stableCoinsResponseSchema>;

export const tokenPoolResponseSchema = z.object({
  data: z.object({
    pool: z.string(),
    pairedToken: z.string(),
  }),
});
export type TokenPoolResponse = z.infer<typeof tokenPoolResponseSchema>;

export const dataFeedResponseSchema = z.object({
  data: z.string(),
});
export type DataFeedResponse = z.infer<typeof dataFeedResponseSchema>;
