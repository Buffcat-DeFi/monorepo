import { CoinGeckoTokenType, SupportedBlockchain } from "./global";

export type TokenSelectorAtom = {
  isOpen: boolean;
  onClose: () => void;
  onSelectToken: (token: CoinGeckoTokenType) => void;
};

export type SelectedTokensAtom = {
  lockToken: {
    [key in SupportedBlockchain]: CoinGeckoTokenType | null;
  };
  unlockToken: {
    [key in SupportedBlockchain]: CoinGeckoTokenType | null;
  };
};

export type Tab = "lock" | "unlock";
