import React, { useMemo, useState } from 'react';
import { selectedBlockchainAtom, selectedLockAtom } from '@/store/global';
import { useAtomValue, useSetAtom } from 'jotai';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { typography } from '@/styles/typography';
import { TokenSelectorAtom } from '@/types/state';
import { useAllTokensList, useTokenMetadata, useERCMetadata } from '../../../hooks/query/tokens';
import { useClaimable } from '../hooks/query/contract';
import { placeholders } from '@/constants/placeholders';
import { Loading } from '@/components/Loading';
import { CoinGeckoToken, Blockchain } from '@/types/global';
import { userLocks } from '@/store/global';
import { ethers } from 'ethers';
import { CircleQuestionMark } from 'lucide-react';
import { Lock } from '@/types/api';

interface TokenSelectorProps extends TokenSelectorAtom {}

const TokenSelectorClaimableItem = ({
  tokenAddress,
  chain,
  onSelect,
}: {
  tokenAddress: string;
  chain: Blockchain;
  onSelect: (t: string) => void;
}) => {
  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(chain, tokenAddress);

  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;

  const {
    data: ercMetadata,
    isLoading: ercMetadataLoading,
    isError: ercMetadataError,
  } = useERCMetadata(chain, tokenAddress, {
    enabled: !!isMetadataUnavailable,
  });

  const isERCMetadataUnavailable = ercMetadataLoading || ercMetadataError || !ercMetadata;

  const symbol =
    !isMetadataUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMetadata?.symbol || `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  const name =
    !isMetadataUnavailable && metadata?.data?.attributes?.name
      ? metadata.data.attributes.name
      : ercMetadata?.name || symbol;

  const decimals =
    !isMetadataUnavailable && metadata?.data?.attributes?.decimals
      ? metadata.data.attributes.decimals
      : ercMetadata?.decimals || 18;

  const logoUrl = metadata?.data?.attributes?.image_url;

  const logo =
    !isMetadataUnavailable && logoUrl ? (
      <Image
        height={32}
        width={32}
        src={logoUrl}
        alt={symbol}
        className="w-8 h-8 mr-3 rounded-full flex-shrink-0"
      />
    ) : (
      <CircleQuestionMark size={32} className="w-8 h-8 mr-3 text-gray-400 flex-shrink-0" />
    );

  const handleSelect = () => {
    onSelect(tokenAddress);
  };

  return (
    <button
      className="w-full flex items-center px-3 py-3 rounded-lg cursor-pointer hover:bg-custom-primary-color hover:text-custom-secondary-text"
      onClick={handleSelect}
    >
      {logo}
      <div className="text-left min-w-0 flex-1">
        <div className="font-medium truncate">{name}</div>
        {!isERCMetadataUnavailable && <div className="text-sm opacity-70">{symbol}</div>}
      </div>
    </button>
  );
};

const TokenSelectorLockItem = ({
  index,
  lock,
  chain,
  onSelect,
}: {
  index: string;
  lock: Lock;
  chain: Blockchain;
  onSelect: (t: Lock) => void;
}) => {
  const setSelectedLock = useSetAtom(selectedLockAtom);

  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(chain, lock.lockedToken);

  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;

  const {
    data: ercMetadata,
    isLoading: ercMetadataLoading,
    isError: ercMetadataError,
  } = useERCMetadata(chain, lock.lockedToken, {
    enabled: !!isMetadataUnavailable,
  });

  const isERCMetadataUnavailable = ercMetadataLoading || ercMetadataError || !ercMetadata;

  const symbol =
    !isMetadataUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMetadata?.symbol || `${lock.lockedToken.slice(0, 6)}...${lock.lockedToken.slice(-4)}`;

  const name =
    !isMetadataUnavailable && metadata?.data?.attributes?.name
      ? metadata.data.attributes.name
      : ercMetadata?.name || symbol;

  const decimals =
    !isMetadataUnavailable && metadata?.data?.attributes?.decimals
      ? metadata.data.attributes.decimals
      : ercMetadata?.decimals || 18;

  const logoUrl = metadata?.data?.attributes?.image_url;

  const logo =
    !isMetadataUnavailable && logoUrl ? (
      <Image
        height={32}
        width={32}
        src={logoUrl}
        alt={symbol}
        className="w-8 h-8 mr-3 rounded-full flex-shrink-0"
      />
    ) : (
      <CircleQuestionMark size={32} className="w-8 h-8 mr-3 text-gray-400 flex-shrink-0" />
    );

  const amount = ethers.formatUnits(lock.amount, decimals);
  const withdrawn = ethers.formatUnits(lock.withdrawn, decimals);
  const formattedAmount = (parseFloat(amount) - parseFloat(withdrawn)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });

  const handleSelect = () => {
    onSelect(lock);
    setSelectedLock(index);
  };

  return (
    <button
      className="w-full flex items-center px-3 py-3 rounded-lg cursor-pointer hover:bg-custom-primary-color hover:text-custom-secondary-text"
      onClick={handleSelect}
    >
      {logo}
      <div className="text-left min-w-0 flex-1 flex justify-between items-center">
        <div>
          <div className="font-medium truncate">{name}</div>
          {!isERCMetadataUnavailable && <div className="text-sm opacity-70">{symbol}</div>}
        </div>
        <div className="text-sm font-semibold pr-2">{formattedAmount}</div>
      </div>
    </button>
  );
};

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  isOpen,
  mode,
  onClose,
  onSelectLockToken,
  onSelectUnlockToken,
  onSelectRewardToken,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const { isFetching, data: tokensList } = useAllTokensList(selectedBlockchain);
  const locks = useAtomValue(userLocks);
  const { data: claimableResponse, isLoading: isClaimableLoading } = useClaimable(
    selectedBlockchain,
    { enabled: mode === 'claimable' },
  );
  const claimableTokens = claimableResponse?.data || [];

  const limitedList = useMemo(() => {
    if (tokensList) {
      return tokensList.slice(0, 101);
    }
    return [];
  }, [tokensList]);

  const filteredList = useMemo(() => {
    if (tokensList && searchTerm.trim() != '') {
      const newFilteredTokens = tokensList.filter((token: CoinGeckoToken) => {
        // Filter by search term only
        if (token.name && token.symbol) {
          return (
            token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
      return newFilteredTokens.slice(0, 10);
    }
    return [];
  }, [tokensList, searchTerm]);

  const displayList = useMemo(() => {
    if (filteredList && filteredList?.length > 0) {
      return filteredList;
    }
    return limitedList;
  }, [limitedList, filteredList]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center backdrop-blur-sm bg-custom-primary-color/30"
      onClick={onClose}
    >
      <div
        className="top-20 relative rounded-xl w-full md:max-w-md h-[90vh] flex flex-col
        bg-custom-secondary-color border border-custom-primary-color/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between p-4">
          <div className={typography.h4}>
            {mode === 'locks'
              ? 'Select A Lock'
              : mode === 'claimable'
                ? 'Select Claimable Token'
                : 'Select A Token'}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-custom-primary-color/10 rounded cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <Separator />

        {/* Search input - fixed height */}
        {mode !== 'locks' && mode !== 'claimable' && (
          <div className="p-4 flex-shrink-0">
            <Input
              type="text"
              placeholder="Search by name or symbol"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Scrollable content area */}
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <ScrollArea className="h-full">
            <div className="space-y-1 mt-4">
              {mode === 'locks' ? (
                locks.length === 0 ? (
                  <div className="text-center py-8">
                    <div>No Locks Found</div>
                  </div>
                ) : (
                  locks.map((lock, index) => (
                    <TokenSelectorLockItem
                      key={index.toString()}
                      index={index.toString()}
                      lock={lock}
                      chain={selectedBlockchain}
                      onSelect={(lock) => onSelectUnlockToken && onSelectUnlockToken(lock)}
                    />
                  ))
                )
              ) : mode === 'claimable' ? (
                isClaimableLoading ? (
                  <div className="flex justify-center py-8">
                    <Loading type="dots" size="dxl" />
                  </div>
                ) : claimableTokens.length === 0 ? (
                  <div className="text-center py-8">
                    <div>No Claimable Tokens Found</div>
                  </div>
                ) : (
                  claimableTokens.map((tokenAddress) => (
                    <TokenSelectorClaimableItem
                      key={tokenAddress}
                      tokenAddress={tokenAddress}
                      chain={selectedBlockchain}
                      onSelect={(token) => onSelectRewardToken && onSelectRewardToken(token)}
                    />
                  ))
                )
              ) : isFetching ? (
                <div className="flex justify-center py-8">
                  <Loading type="dots" size="dxl" />
                </div>
              ) : !tokensList ? (
                <div className="text-center py-8">
                  <p className="mb-2">{selectedBlockchain.name} Tokens Not Available</p>
                </div>
              ) : displayList.length === 0 ? (
                <div className="text-center py-8">
                  <div>No Token Found</div>
                </div>
              ) : (
                displayList.map((token) => (
                  <button
                    key={token.address}
                    className="w-full flex items-center px-3 py-3 rounded-lg cursor-pointer
                    hover:bg-custom-primary-color hover:text-custom-secondary-text"
                    onClick={() => onSelectLockToken && onSelectLockToken(token)}
                  >
                    {token.logoURI && token.logoURI !== '' ? (
                      <Image
                        height={32}
                        width={32}
                        src={token.logoURI || placeholders.tokenImage}
                        alt={token.name}
                        className="w-8 h-8 mr-3 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <CircleQuestionMark
                        size={32}
                        className="w-8 h-8 mr-3 text-gray-400 flex-shrink-0"
                      />
                    )}
                    <div className="text-left min-w-0 flex-1">
                      <div className="font-medium truncate">{token.name}</div>
                      <div className="text-sm opacity-70">{token.symbol}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
