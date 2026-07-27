import { SupportedBlockchain } from "@/types/global";

export const envVariables: {
  buffcatContract: Record<SupportedBlockchain, string>;
} = {
  buffcatContract: {
    eth: '0x3a671867b72ebeb3da6F1113A73b188609B99522',
    base: '',
    solana: '',
  },
};
