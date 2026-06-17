import { blockchains } from '@/constants/blockchains';
import { Blockchain, CoinGeckoToken } from '../types/global';
import { TokenSelectorAtom, SelectedTokensAtom, Tab } from '../types/state';
import { atom } from 'jotai';

export const currentUserAtom = atom<{
  address: string;
  loggedIn: boolean;
  chainId: number;
}>({
  address: '',
  loggedIn: false,
  chainId: blockchains[0].chainId,
});

export const tokenSelectorAtom = atom<TokenSelectorAtom>({
  isOpen: false,
  onClose: () => {},
  onSelectToken: (token: CoinGeckoToken) => {},
});

export const selectedTokensAtom = atom<SelectedTokensAtom>({
  lockToken: {
    eth: null,
    base: null,
    solana: null,
  },
  unlockToken: {
    eth: null,
    base: null,
    solana: null,
  },
  rewardTokens: {
    eth: null,
    base: null,
    solana: null,
  },
});

export const currentTabAtom = atom<Tab>('lock');

export const selectedBlockchainAtom = atom<Blockchain>(blockchains[0]);

export const selectedLockAtom = atom<string>('1');
