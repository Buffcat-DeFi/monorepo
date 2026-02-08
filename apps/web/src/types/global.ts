export type SupportedBlockchain = "eth" | "base";

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
