import React, { useMemo, useState } from "react";
import { selectedBlockchainAtom } from "@/store/global";
import { useAtomValue } from "jotai";
import Image from "next/image";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { typography } from "@/styles/typography";
import { TokenSelectorAtom } from "@/types/state";
import { useAllTokensList } from "../hooks/query/tokens";
import { placeholders } from "@/constants/placeholders";
import { Loading } from "@/components/Loading";
import { CoinGeckoTokenType } from "@/types/global";

interface TokenSelectorProps extends TokenSelectorAtom {}

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  isOpen,
  onClose,
  onSelectToken,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const { isFetching, data: tokensList } = useAllTokensList(selectedBlockchain);

  const limitedList = useMemo(() => {
    if (tokensList) {
      return tokensList.slice(0, 101);
    }
    return [];
  }, [tokensList]);

  const filteredList = useMemo(() => {
    if (tokensList && searchTerm.trim() != "") {
      const newFilteredTokens = tokensList.filter(
        (token: CoinGeckoTokenType) => {
          // Filter by search term only
          if (token.name && token.symbol) {
            return (
              token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              token.symbol.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }
        },
      );
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
          <div className={typography.h4}>Select A Token</div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-custom-primary-color/10 rounded cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <Separator />

        {/* Search input - fixed height */}
        <div className="p-4 flex-shrink-0">
          <Input
            type="text"
            placeholder="Search by name or symbol"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-hidden px-4 pb-4">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {isFetching ? (
                <div className="flex justify-center py-8">
                  <Loading type="dots" size="dxl" />
                </div>
              ) : !tokensList ? (
                <div className="text-center py-8">
                  <p className="mb-2">
                    {selectedBlockchain.name} Tokens Not Available
                  </p>
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
                    hover:bg-custom-primary-color hover:text-custom-tertiary-text"
                    onClick={() => onSelectToken && onSelectToken(token)}
                  >
                    {selectedBlockchain.id == "base"
                      ? token.logoURI &&
                        token.logoURI !== "" && (
                          <Image
                            height={32}
                            width={32}
                            src={token.logoURI || placeholders.tokenImage}
                            alt={token.name}
                            className="w-8 h-8 mr-3 rounded-full flex-shrink-0"
                          />
                        )
                      : token.logoURI &&
                        token.logoURI !== "" && (
                          <Image
                            height={32}
                            width={32}
                            src={token.logoURI || placeholders.tokenImage}
                            alt={token.name}
                            className="w-8 h-8 mr-3 rounded-full flex-shrink-0"
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
