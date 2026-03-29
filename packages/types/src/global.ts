export type BlockchainParam = 'eth' | 'solana' | 'base';

export type Blockchain = {
  id: BlockchainParam;
  name: string;
  logoUrl: string;
  isSupported: boolean;
};
