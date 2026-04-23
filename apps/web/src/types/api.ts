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
