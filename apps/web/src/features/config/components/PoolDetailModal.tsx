'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, CircleQuestionMark, ExternalLink, Link2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ImageWithFallback';
import { placeholders } from '@/constants/placeholders';
import { Blockchain } from '@/types/global';
import { useTokenMetadata, useERCMetadata } from '@/hooks/query/tokens';
import { useTokenPool } from '../hooks/query/contract';
import { useMemo } from 'react';

interface PoolDetailModalProps {
  tokenAddress: string;
  chain: Blockchain;
  isOpen: boolean;
  onClose: () => void;
}

export default function PoolDetailModal({
  tokenAddress,
  chain,
  isOpen,
  onClose,
}: PoolDetailModalProps) {
  const {
    data: pool,
    isLoading,
    isFetching: isPoolFetching,
    isError,
    refresh: poolRefresh,
  } = useTokenPool(chain, tokenAddress, { enabled: isOpen && !!tokenAddress });

  // ── Main token metadata ────────────────────────────────────────────────────
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

  // ── Paired token metadata ──────────────────────────────────────────────────
  const pairedTokenAddress = pool?.data?.pairedToken || '';
  const isZeroAddress = pairedTokenAddress === '0x0000000000000000000000000000000000000000';

  const {
    data: pairedMetadata,
    isLoading: isPairedMetaLoading,
    isFetching: isPairedMetaFetching,
    isError: isPairedMetaError,
    refresh: pairedMetaRefresh,
  } = useTokenMetadata(chain, pairedTokenAddress, {
    enabled: isOpen && !!pairedTokenAddress && !isZeroAddress,
  });
  const isPairedMetaUnavailable = isPairedMetaLoading || isPairedMetaError || !pairedMetadata?.data;
  const {
    data: pairedErcMeta,
    isFetching: isPairedErcMetaFetching,
    refresh: pairedErcMetaRefresh,
  } = useERCMetadata(chain, pairedTokenAddress, {
    enabled: isOpen && isPairedMetaUnavailable && !!pairedTokenAddress && !isZeroAddress,
  });

  const pairedSymbol =
    !isPairedMetaUnavailable && pairedMetadata?.data?.attributes?.symbol
      ? pairedMetadata.data.attributes.symbol
      : pairedErcMeta?.symbol || pairedTokenAddress;

  const pairedName =
    !isPairedMetaUnavailable && pairedMetadata?.data?.attributes?.name
      ? pairedMetadata.data.attributes.name
      : pairedErcMeta?.name || pairedSymbol;

  const pairedLogoUrl = pairedMetadata?.data?.attributes?.image_url;

  const uniswapUrl =
    chain.id === 'base'
      ? `https://app.uniswap.org/explore/pools/base/${pool?.data?.pool}`
      : `https://app.uniswap.org/explore/pools/ethereum/${pool?.data?.pool}`;

  const isAnyFetching =
    isPoolFetching ||
    isMetaFetching ||
    isErcMetaFetching ||
    isPairedMetaFetching ||
    isPairedErcMetaFetching;

  const handleRefresh = async () => {
    try {
      await Promise.all([
        poolRefresh(),
        metaRefresh(),
        ercMetaRefresh(),
        ...(pairedTokenAddress && !isZeroAddress ? [pairedMetaRefresh(), pairedErcMetaRefresh()] : []),
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-custom-primary-color custom-box-shadow rounded-2xl bg-custom-bg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Uniswap Pool Details
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
              Failed to fetch pool data. Token may not have a pool configured.
            </span>
          </div>
        )}

        {pool && (
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

            {/* Pool details */}
            <div className="rounded-xl border border-custom-primary-color/30 p-4 space-y-3">
              <div>
                <p className="text-xs text-custom-muted-text uppercase tracking-widest font-bold mb-1">
                  Pool Address
                </p>
                <p className="font-mono text-sm break-all text-custom-primary-text">
                  {pool.data.pool}
                </p>
              </div>
              <div>
                <p className="text-xs text-custom-muted-text uppercase tracking-widest font-bold mb-1">
                  Paired Token
                </p>
                {isZeroAddress ? (
                  <p className="text-sm text-custom-muted-text italic">None (Zero Address)</p>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    {isPairedMetaLoading ? (
                      <div className="w-5 h-5 rounded-full bg-gray-200 animate-pulse" />
                    ) : pairedLogoUrl ? (
                      <ImageWithFallback
                        src={pairedLogoUrl}
                        alt={pairedSymbol}
                        width={20}
                        height={20}
                        fallbackSrc={placeholders.tokenImage}
                        className="rounded-full border border-custom-primary-color/20"
                      />
                    ) : (
                      <CircleQuestionMark className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="font-semibold text-sm text-custom-primary-text whitespace-nowrap">
                      {isPairedMetaLoading ? '...' : pairedSymbol}
                    </span>
                    <span className="font-mono text-xs text-custom-muted-text truncate">
                      ({pool.data.pairedToken})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {pool.data.pool !== '0x0000000000000000000000000000000000000000' && (
              <a
                href={uniswapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 w-full justify-center rounded-xl border-2 border-custom-primary-color py-2 font-semibold text-sm hover:bg-custom-primary-color hover:text-custom-secondary-text transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> View on Uniswap
              </a>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
