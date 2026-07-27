'use client';
import { CircleQuestionMark } from 'lucide-react';
import ImageWithFallback from '@/components/ImageWithFallback';
import { placeholders } from '@/constants/placeholders';
import { Blockchain } from '@/types/global';
import { useTokenMetadata, useERCMetadata } from '@/hooks/query/tokens';

interface TokenRowProps {
  address: string;
  chain: Blockchain;
  action?: React.ReactNode;
}

export default function TokenRow({ address, chain, action }: TokenRowProps) {
  const { data: metadata, isLoading, isError } = useTokenMetadata(chain, address);
  const isMetaUnavailable = isLoading || isError || !metadata?.data;
  const { data: ercMeta } = useERCMetadata(chain, address, { enabled: isMetaUnavailable });

  const symbol =
    !isMetaUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMeta?.symbol || address;

  const name =
    !isMetaUnavailable && metadata?.data?.attributes?.name
      ? metadata.data.attributes.name
      : ercMeta?.name || symbol;

  const logoUrl = metadata?.data?.attributes?.image_url;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-custom-primary-color/20 last:border-0 hover:bg-black/5 transition-colors">
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
        ) : logoUrl ? (
          <ImageWithFallback
            src={logoUrl}
            alt={symbol}
            width={32}
            height={32}
            fallbackSrc={placeholders.tokenImage}
            className="rounded-full border border-custom-primary-color/20"
          />
        ) : (
          <CircleQuestionMark className="w-8 h-8 text-gray-400 flex-shrink-0" />
        )}
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-custom-primary-text">
            {isLoading ? '...' : name}
          </span>
          <span className="text-xs text-custom-muted-text font-mono">
            {address.slice(0, 10)}…{address.slice(-6)}
          </span>
        </div>
      </div>
      {action}
    </div>
  );
}
