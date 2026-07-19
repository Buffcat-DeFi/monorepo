'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, BarChart3, CircleQuestionMark, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ImageWithFallback';
import { placeholders } from '@/constants/placeholders';
import { Blockchain } from '@/types/global';
import { useTokenMetadata, useERCMetadata } from '@/hooks/query/tokens';
import { useDataFeed } from '../hooks/query/contract';
import { useMemo } from 'react';

interface FeedDetailModalProps {
  tokenAddress: string;
  chain: Blockchain;
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedDetailModal({
  tokenAddress,
  chain,
  isOpen,
  onClose,
}: FeedDetailModalProps) {
  const {
    data: feed,
    isLoading,
    isFetching: isFeedFetching,
    isError,
    refresh: feedRefresh,
  } = useDataFeed(chain, tokenAddress, { enabled: isOpen && !!tokenAddress });

  // ── Token metadata ─────────────────────────────────────────────────────────
  const {
    data: metadata,
    isLoading: isMetaLoading,
    isFetching: isMetaFetching,
    isError: isMetaError,
    refresh: metaRefresh,
  } = useTokenMetadata(chain, tokenAddress, {
    enabled: isOpen && !!tokenAddress,
  });
  const isMetaUnavailable = isMetaLoading || isMetaError || !metadata?.data;
  const {
    data: ercMeta,
    isFetching: isErcMetaFetching,
    refresh: ercMetaRefresh,
  } = useERCMetadata(chain, tokenAddress, {
    enabled: isOpen && isMetaUnavailable && !!tokenAddress,
  });

  const symbol =
    !isMetaUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMeta?.symbol || tokenAddress;

  const name =
    !isMetaUnavailable && metadata?.data?.attributes?.name
      ? metadata.data.attributes.name
      : ercMeta?.name || symbol;

  const logoUrl = metadata?.data?.attributes?.image_url;

  const chainlinkUrl = `https://data.chain.link/feeds/${feed?.data}`;

  const isAnyFetching = isFeedFetching || isMetaFetching || isErcMetaFetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([feedRefresh(), metaRefresh(), ercMetaRefresh()]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-custom-primary-color custom-box-shadow rounded-2xl bg-custom-bg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Chainlink Data Feed
          </DialogTitle>
        </DialogHeader>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isAnyFetching}
          className="absolute right-14 top-4 border-custom-primary-color rounded-xl cursor-pointer w-8 h-8 flex items-center justify-center p-0 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAnyFetching ? 'animate-spin' : ''}`} />
        </Button>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-custom-muted-text" />
          </div>
        )}

        {isError && (
          <div className="flex items-center gap-2 py-4 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">
              Failed to fetch feed data. Token may not have a data feed configured.
            </span>
          </div>
        )}

        {feed && (
          <div className="space-y-4">
            {/* Token header */}
            <div className="flex items-center gap-3 pb-3 border-b border-custom-primary-color/20">
              {isMetaLoading ? (
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              ) : logoUrl ? (
                <ImageWithFallback
                  src={logoUrl}
                  alt={symbol}
                  width={40}
                  height={40}
                  fallbackSrc={placeholders.tokenImage}
                  className="rounded-full border border-custom-primary-color/20"
                />
              ) : (
                <CircleQuestionMark className="w-10 h-10 text-gray-400 flex-shrink-0" />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-base text-custom-primary-text truncate">
                  {isMetaLoading ? '...' : name} ({isMetaLoading ? '...' : symbol})
                </span>
                <span className="text-xs text-custom-muted-text font-mono truncate">
                  {tokenAddress}
                </span>
              </div>
            </div>

            {/* Feed address */}
            <div className="rounded-xl border border-custom-primary-color/30 p-4">
              <p className="text-xs text-custom-muted-text uppercase tracking-widest font-bold mb-1">
                Feed Address
              </p>
              <p className="font-mono text-sm break-all text-custom-primary-text">{feed.data}</p>
            </div>

            {feed.data !== '0x0000000000000000000000000000000000000000' && (
              <a
                href={chainlinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full justify-center rounded-xl border-2 border-custom-primary-color py-2 font-semibold text-sm hover:bg-custom-primary-color hover:text-custom-secondary-text transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> View on Chainlink
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
