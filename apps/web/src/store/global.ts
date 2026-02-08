import { blockchains } from "@/constants/blockchains";
import { Blockchain, CoinGeckoTokenType } from "../types/global";
import { TokenSelectorAtom, SelectedTokensAtom, Tab } from "../types/state";
import { atom } from "jotai";

export const currentUserAtom = atom<{
  address: string;
  loggedIn: boolean;
  chainId: number;
}>({
  address: "",
  loggedIn: false,
  chainId: blockchains[0].chainId
});

export const tokenSelectorAtom = atom<TokenSelectorAtom>({
  isOpen: false,
  onClose: () => {},
  onSelectToken: (token: CoinGeckoTokenType) => {},
});

export const selectedTokensAtom = atom<SelectedTokensAtom>({
  lockToken: {
    eth: null,
    base: null,
  },
  unlockToken: {
    eth: null,
    base: null,
  },
});

export const currentTabAtom = atom<Tab>("lock");

export const selectedBlockchainAtom = atom<Blockchain>(blockchains[0]);
