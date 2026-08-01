import { SupportedBlockchain } from "@/types/global";

export const envVariables: {
  buffcatContract: Record<SupportedBlockchain, string>;
} = {
  buffcatContract: {
    eth: '',
    base: '0x31eCd0a6d66263Bc1d0150a0e0eEfc9204D6A391',
    solana: '',
  },
};
