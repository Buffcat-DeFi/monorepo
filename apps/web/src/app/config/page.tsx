'use client';

import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAtomValue } from 'jotai';
import { selectedBlockchainAtom, currentUserAtom } from '@/store/global';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  RefreshCw,
  Download,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  CircleQuestionMark,
  AlertCircle,
  Loader2,
  Settings,
  Database,
  Coins,
  BarChart3,
  Link2,
} from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { envVariables } from '@/lib/envVariables';
import { useTokenMetadata, useERCMetadata } from '@/features/dashboard/hooks/query/tokens';
import {
  useWhitelist,
  useStableCoins,
  useTokenPool,
  useDataFeed,
} from '@/features/dashboard/hooks/query/config';
import { useTransactionDialog } from '@/features/dashboard/hooks/transactionDialogHook';
import { getEvmAbi } from '@/features/dashboard/lib/utils';
import ImageWithFallback from '@/components/ImageWithFallback';
import { placeholders } from '@/constants/placeholders';
import { Blockchain } from '@/types/global';

// ─── Token Row ──────────────────────────────────────────────────────────────

function TokenRow({
  address,
  chain,
  action,
}: {
  address: string;
  chain: Blockchain;
  action?: React.ReactNode;
}) {
  const { data: metadata, isLoading, isError } = useTokenMetadata(chain, address);
  const isMetaUnavailable = isLoading || isError || !metadata?.data;
  const { data: ercMeta } = useERCMetadata(chain, address, { enabled: isMetaUnavailable });

  const symbol =
    !isMetaUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : (ercMeta?.symbol ?? `${address.slice(0, 6)}…${address.slice(-4)}`);

  const name =
    !isMetaUnavailable && metadata?.data?.attributes?.name
      ? metadata.data.attributes.name
      : (ercMeta?.name ?? symbol);

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

// ─── Pool Detail Modal ───────────────────────────────────────────────────────

function PoolDetailModal({
  tokenAddress,
  chain,
  isOpen,
  onClose,
}: {
  tokenAddress: string;
  chain: Blockchain;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    data: pool,
    isLoading,
    isError,
  } = useTokenPool(chain, tokenAddress, { enabled: isOpen && !!tokenAddress });
  const uniswapUrl =
    chain.id === 'base'
      ? `https://app.uniswap.org/explore/pools/base/${pool?.data?.pool}`
      : `https://app.uniswap.org/explore/pools/ethereum/${pool?.data?.pool}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-custom-primary-color custom-box-shadow rounded-2xl bg-custom-bg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Uniswap Pool Details
          </DialogTitle>
        </DialogHeader>
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
                <p className="font-mono text-sm break-all text-custom-primary-text">
                  {pool.data.pairedToken}
                </p>
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

// ─── Feed Detail Modal ───────────────────────────────────────────────────────

function FeedDetailModal({
  tokenAddress,
  chain,
  isOpen,
  onClose,
}: {
  tokenAddress: string;
  chain: Blockchain;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    data: feed,
    isLoading,
    isError,
  } = useDataFeed(chain, tokenAddress, { enabled: isOpen && !!tokenAddress });
  const chainlinkUrl = `https://data.chain.link/feeds/${feed?.data}`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-2 border-custom-primary-color custom-box-shadow rounded-2xl bg-custom-bg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Chainlink Data Feed
          </DialogTitle>
        </DialogHeader>
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

// ─── CSV Utils ───────────────────────────────────────────────────────────────

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseAddressCsv(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim().split(',')[0].trim())
    .filter((addr) => addr.startsWith('0x') && addr.length === 42);
}

function parsePoolsCsv(text: string): { token: string; pool: string; pairedToken: string }[] {
  return text
    .split('\n')
    .map((l) => {
      const [token, pool, pairedToken] = l.split(',').map((x) => x.trim());
      return { token, pool, pairedToken };
    })
    .filter(
      ({ token, pool, pairedToken }) =>
        token?.startsWith('0x') && pool?.startsWith('0x') && pairedToken?.startsWith('0x'),
    );
}

function parseFeedsCsv(text: string): { token: string; feed: string }[] {
  return text
    .split('\n')
    .map((l) => {
      const [token, feed] = l.split(',').map((x) => x.trim());
      return { token, feed };
    })
    .filter(({ token, feed }) => token?.startsWith('0x') && feed?.startsWith('0x'));
}

// ─── CSV Upload Panel ────────────────────────────────────────────────────────

function CsvUploadPanel({
  label,
  hint,
  onParsed,
  preview,
}: {
  label: string;
  hint: string;
  onParsed: (text: string) => void;
  preview: React.ReactNode;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onParsed(text);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileRef.current?.click()}
        className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-custom-primary-color/40
          rounded-xl p-6 cursor-pointer hover:border-custom-primary-color hover:bg-black/5 transition-all"
      >
        <Upload className="w-6 h-6 text-custom-muted-text" />
        <p className="text-sm font-semibold text-custom-primary-text">{label}</p>
        <p className="text-xs text-custom-muted-text">{hint}</p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {preview}
    </div>
  );
}

// ─── Tab: Whitelist ──────────────────────────────────────────────────────────

function WhitelistTab() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const { data, isLoading, isError, refresh } = useWhitelist(chain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatAbi = useMemo(() => getEvmAbi(chain.id), [chain.id]);

  const [addCsvText, setAddCsvText] = useState('');
  const [removeCsvText, setRemoveCsvText] = useState('');
  const addAddresses = parseAddressCsv(addCsvText);
  const removeAddresses = parseAddressCsv(removeCsvText);

  const contractAddress = envVariables.buffcatContract[chain.id === 'eth' ? 'eth' : 'base'];

  const handleDownload = () => {
    if (!data?.data) return;
    const csv = 'address\n' + data.data.join('\n');
    downloadCsv(`whitelist_${chain.id}.csv`, csv);
  };

  const handleAdd = async () => {
    if (!addAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'whitelistTokens',
          args: [addAddresses],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Whitelist Tokens?',
        description: `Add ${addAddresses.length} token(s) to the whitelist.`,
        successMessage: 'Tokens whitelisted successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Whitelisting ${addAddresses.length} token(s) on ${chain.name}...`,
      },
    );
  };

  const handleRemove = async () => {
    if (!removeAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'blacklistTokens',
          args: [removeAddresses],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Blacklist Tokens?',
        description: `Remove ${removeAddresses.length} token(s) from the whitelist.`,
        successMessage: 'Tokens blacklisted successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Blacklisting ${removeAddresses.length} token(s) on ${chain.name}...`,
      },
    );
  };

  return (
    <div className="space-y-4">
      {/* GET Panel */}
      <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg custom-box-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="font-bold text-sm uppercase tracking-wider">Whitelisted Tokens</span>
              <Badge className="rounded-full bg-custom-primary-color text-custom-secondary-text text-[10px] px-2 py-0.5">
                ON-CHAIN
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
                className="border-custom-primary-color rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Fetching...' : 'Fetch'}
              </Button>
              {data?.data && data.data.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-custom-primary-color rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" /> CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isError && (
            <div className="flex items-center gap-2 py-4 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Failed to fetch. Try again.</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-custom-muted-text">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Fetching from chain...</span>
            </div>
          )}
          {!isLoading && !isError && !data && (
            <div className="py-8 text-center text-custom-muted-text text-sm">
              Click <strong>Fetch</strong> to load whitelisted tokens from the contract.
            </div>
          )}
          {data?.data && (
            <div className="rounded-xl border border-custom-primary-color/30 overflow-hidden">
              <div className="bg-black/5 px-4 py-2 flex justify-between text-xs font-bold uppercase tracking-wider text-custom-muted-text">
                <span>Token</span>
                <span>{data.data.length} total</span>
              </div>
              {data.data.length === 0 ? (
                <p className="text-center text-sm text-custom-muted-text py-6">
                  No whitelisted tokens found.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto no-scrollbar">
                  {data.data.map((addr) => (
                    <TokenRow key={addr} address={addr} chain={chain} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Panel */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              <span className="font-bold text-sm">Add Tokens</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: one address per line</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Whitelist"
              hint="Format: address (one per line)"
              onParsed={setAddCsvText}
              preview={
                addAddresses.length > 0 && (
                  <div className="rounded-xl border border-green-500/30 bg-green-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      {addAddresses.length} address(es) parsed
                    </p>
                    {addAddresses.slice(0, 5).map((a) => (
                      <p key={a} className="text-xs font-mono text-green-800 truncate">
                        {a}
                      </p>
                    ))}
                    {addAddresses.length > 5 && (
                      <p className="text-xs text-green-600">+{addAddresses.length - 5} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleAdd}
              disabled={!addAddresses.length}
              className="w-full cursor-pointer bg-custom-primary-color text-custom-secondary-text hover:bg-custom-primary-color/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Whitelist{' '}
              {addAddresses.length > 0 ? `(${addAddresses.length})` : 'Tokens'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm">Remove Tokens</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: one address per line</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Blacklist"
              hint="Format: address (one per line)"
              onParsed={setRemoveCsvText}
              preview={
                removeAddresses.length > 0 && (
                  <div className="rounded-xl border border-red-500/30 bg-red-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-red-700 mb-1">
                      {removeAddresses.length} address(es) parsed
                    </p>
                    {removeAddresses.slice(0, 5).map((a) => (
                      <p key={a} className="text-xs font-mono text-red-800 truncate">
                        {a}
                      </p>
                    ))}
                    {removeAddresses.length > 5 && (
                      <p className="text-xs text-red-600">+{removeAddresses.length - 5} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleRemove}
              disabled={!removeAddresses.length}
              variant="destructive"
              className="w-full cursor-pointer rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Blacklist{' '}
              {removeAddresses.length > 0 ? `(${removeAddresses.length})` : 'Tokens'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Stable Coins ───────────────────────────────────────────────────────

function StableCoinsTab() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const { data, isLoading, isError, refresh } = useStableCoins(chain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatAbi = useMemo(() => getEvmAbi(chain.id), [chain.id]);
  const contractAddress = envVariables.buffcatContract[chain.id === 'eth' ? 'eth' : 'base'];

  const [addCsvText, setAddCsvText] = useState('');
  const [removeCsvText, setRemoveCsvText] = useState('');
  const addAddresses = parseAddressCsv(addCsvText);
  const removeAddresses = parseAddressCsv(removeCsvText);

  const handleDownload = () => {
    if (!data?.data) return;
    const csv = 'address\n' + data.data.join('\n');
    downloadCsv(`stablecoins_${chain.id}.csv`, csv);
  };

  const handleAdd = async () => {
    if (!addAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'addStableCoin',
          args: [addAddresses],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Add Stable Coins?',
        description: `Add ${addAddresses.length} stable coin(s) to the contract.`,
        successMessage: 'Stable coins added successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Adding ${addAddresses.length} stable coin(s) on ${chain.name}...`,
      },
    );
  };

  const handleRemove = async () => {
    if (!removeAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'removeStableCoin',
          args: [removeAddresses],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Remove Stable Coins?',
        description: `Remove ${removeAddresses.length} stable coin(s).`,
        successMessage: 'Stable coins removed successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Removing ${removeAddresses.length} stable coin(s) on ${chain.name}...`,
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg custom-box-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              <span className="font-bold text-sm uppercase tracking-wider">Stable Coins</span>
              <Badge className="rounded-full bg-custom-primary-color text-custom-secondary-text text-[10px] px-2 py-0.5">
                ON-CHAIN
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={isLoading}
                className="border-custom-primary-color rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Fetching...' : 'Fetch'}
              </Button>
              {data?.data && data.data.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-custom-primary-color rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" /> CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isError && (
            <div className="flex items-center gap-2 py-4 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Failed to fetch. Try again.</span>
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-8 gap-2 text-custom-muted-text">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Fetching from chain...</span>
            </div>
          )}
          {!isLoading && !isError && !data && (
            <div className="py-8 text-center text-custom-muted-text text-sm">
              Click <strong>Fetch</strong> to load stable coins from the contract.
            </div>
          )}
          {data?.data && (
            <div className="rounded-xl border border-custom-primary-color/30 overflow-hidden">
              <div className="bg-black/5 px-4 py-2 flex justify-between text-xs font-bold uppercase tracking-wider text-custom-muted-text">
                <span>Token</span>
                <span>{data.data.length} total</span>
              </div>
              {data.data.length === 0 ? (
                <p className="text-center text-sm text-custom-muted-text py-6">
                  No stable coins found.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto no-scrollbar">
                  {data.data.map((addr) => (
                    <TokenRow key={addr} address={addr} chain={chain} />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              <span className="font-bold text-sm">Add Stable Coins</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: one address per line</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Add"
              hint="Format: address (one per line)"
              onParsed={setAddCsvText}
              preview={
                addAddresses.length > 0 && (
                  <div className="rounded-xl border border-green-500/30 bg-green-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      {addAddresses.length} parsed
                    </p>
                    {addAddresses.slice(0, 5).map((a) => (
                      <p key={a} className="text-xs font-mono text-green-800 truncate">
                        {a}
                      </p>
                    ))}
                    {addAddresses.length > 5 && (
                      <p className="text-xs text-green-600">+{addAddresses.length - 5} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleAdd}
              disabled={!addAddresses.length}
              className="w-full cursor-pointer bg-custom-primary-color text-custom-secondary-text hover:bg-custom-primary-color/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add{' '}
              {addAddresses.length > 0 ? `(${addAddresses.length})` : 'Stable Coins'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm">Remove Stable Coins</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: one address per line</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Remove"
              hint="Format: address (one per line)"
              onParsed={setRemoveCsvText}
              preview={
                removeAddresses.length > 0 && (
                  <div className="rounded-xl border border-red-500/30 bg-red-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-red-700 mb-1">
                      {removeAddresses.length} parsed
                    </p>
                    {removeAddresses.slice(0, 5).map((a) => (
                      <p key={a} className="text-xs font-mono text-red-800 truncate">
                        {a}
                      </p>
                    ))}
                    {removeAddresses.length > 5 && (
                      <p className="text-xs text-red-600">+{removeAddresses.length - 5} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleRemove}
              disabled={!removeAddresses.length}
              variant="destructive"
              className="w-full cursor-pointer rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove{' '}
              {removeAddresses.length > 0 ? `(${removeAddresses.length})` : 'Stable Coins'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Token Pools ────────────────────────────────────────────────────────

function TokenPoolsTab() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const { data: whitelistData, isLoading: wlLoading, refresh: wlRefresh } = useWhitelist(chain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatAbi = useMemo(() => getEvmAbi(chain.id), [chain.id]);
  const contractAddress = envVariables.buffcatContract[chain.id === 'eth' ? 'eth' : 'base'];

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [addCsvText, setAddCsvText] = useState('');
  const [removeCsvText, setRemoveCsvText] = useState('');
  const addRows = parsePoolsCsv(addCsvText);
  const removeAddresses = parseAddressCsv(removeCsvText);

  const handleDownload = () => {
    if (!whitelistData?.data) return;
    const csv = 'token,pool,pairedToken\n' + whitelistData.data.map((a) => `${a},,`).join('\n');
    downloadCsv(`token_pools_${chain.id}.csv`, csv);
  };

  const handleAdd = async () => {
    if (!addRows.length) return toast.error('No valid rows in CSV.');
    await withConfirmation(
      async () => {
        const tokens = addRows.map((r) => r.token);
        const pools = addRows.map((r) => r.pool);
        const pairedTokens = addRows.map((r) => r.pairedToken);
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'addTokenPools',
          args: [tokens, pools, pairedTokens, BigInt(addRows.length)],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Add Token Pools?',
        description: `Add ${addRows.length} pool mapping(s).`,
        successMessage: 'Token pools added successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Adding ${addRows.length} pool mapping(s) on ${chain.name}...`,
      },
    );
  };

  const handleRemove = async () => {
    if (!removeAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'removeTokenPools',
          args: [removeAddresses],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Remove Token Pools?',
        description: `Remove ${removeAddresses.length} pool mapping(s).`,
        successMessage: 'Token pools removed successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Removing ${removeAddresses.length} pool mapping(s) on ${chain.name}...`,
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg custom-box-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="font-bold text-sm uppercase tracking-wider">
                Token ↔ Uniswap Pools
              </span>
              <Badge className="rounded-full bg-custom-primary-color text-custom-secondary-text text-[10px] px-2 py-0.5">
                PER-TOKEN
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={wlRefresh}
                disabled={wlLoading}
                className="border-custom-primary-color rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${wlLoading ? 'animate-spin' : ''}`} />
                {wlLoading ? 'Fetching...' : 'Load Whitelist'}
              </Button>
              {whitelistData?.data && whitelistData.data.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="border-custom-primary-color rounded-xl cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" /> Template CSV
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!whitelistData?.data && (
            <div className="py-8 text-center text-custom-muted-text text-sm">
              Click <strong>Load Whitelist</strong> first, then click a token to view its pool.
            </div>
          )}
          {whitelistData?.data && (
            <div className="rounded-xl border border-custom-primary-color/30 overflow-hidden">
              <div className="bg-black/5 px-4 py-2 flex justify-between text-xs font-bold uppercase tracking-wider text-custom-muted-text">
                <span>Token</span>
                <span>Click to view pool</span>
              </div>
              {whitelistData.data.length === 0 ? (
                <p className="text-center text-sm text-custom-muted-text py-6">
                  No whitelisted tokens found.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto no-scrollbar">
                  {whitelistData.data.map((addr) => (
                    <TokenRow
                      key={addr}
                      address={addr}
                      chain={chain}
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedToken(addr)}
                          className="border-custom-primary-color/50 rounded-lg text-xs cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" /> View Pool
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PoolDetailModal
        tokenAddress={selectedToken ?? ''}
        chain={chain}
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              <span className="font-bold text-sm">Add Token Pools</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: token, pool, pairedToken</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Add Pools"
              hint="Format: token,pool,pairedToken"
              onParsed={setAddCsvText}
              preview={
                addRows.length > 0 && (
                  <div className="rounded-xl border border-green-500/30 bg-green-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      {addRows.length} row(s) parsed
                    </p>
                    {addRows.slice(0, 3).map((r, i) => (
                      <p key={i} className="text-xs font-mono text-green-800 truncate">
                        {r.token.slice(0, 10)}… → {r.pool.slice(0, 10)}…
                      </p>
                    ))}
                    {addRows.length > 3 && (
                      <p className="text-xs text-green-600">+{addRows.length - 3} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleAdd}
              disabled={!addRows.length}
              className="w-full cursor-pointer bg-custom-primary-color text-custom-secondary-text hover:bg-custom-primary-color/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Pools{' '}
              {addRows.length > 0 ? `(${addRows.length})` : ''}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm">Remove Token Pools</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: token addresses to remove</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Remove Pools"
              hint="Format: token address (one per line)"
              onParsed={setRemoveCsvText}
              preview={
                removeAddresses.length > 0 && (
                  <div className="rounded-xl border border-red-500/30 bg-red-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-red-700 mb-1">
                      {removeAddresses.length} parsed
                    </p>
                    {removeAddresses.slice(0, 5).map((a) => (
                      <p key={a} className="text-xs font-mono text-red-800 truncate">
                        {a}
                      </p>
                    ))}
                    {removeAddresses.length > 5 && (
                      <p className="text-xs text-red-600">+{removeAddresses.length - 5} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleRemove}
              disabled={!removeAddresses.length}
              variant="destructive"
              className="w-full cursor-pointer rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove Pools{' '}
              {removeAddresses.length > 0 ? `(${removeAddresses.length})` : ''}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Tab: Data Feeds ─────────────────────────────────────────────────────────

function DataFeedsTab() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const { data: whitelistData, isLoading: wlLoading, refresh: wlRefresh } = useWhitelist(chain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatAbi = useMemo(() => getEvmAbi(chain.id), [chain.id]);
  const contractAddress = envVariables.buffcatContract[chain.id === 'eth' ? 'eth' : 'base'];

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [addCsvText, setAddCsvText] = useState('');
  const [removeCsvText, setRemoveCsvText] = useState('');
  const addRows = parseFeedsCsv(addCsvText);
  const removeAddresses = parseAddressCsv(removeCsvText);

  const handleAdd = async () => {
    if (!addRows.length) return toast.error('No valid rows in CSV.');
    await withConfirmation(
      async () => {
        const tokens = addRows.map((r) => r.token);
        const feeds = addRows.map((r) => r.feed);
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'addDataFeeds',
          args: [tokens, feeds],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Add Data Feeds?',
        description: `Add ${addRows.length} Chainlink feed mapping(s).`,
        successMessage: 'Data feeds added successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Adding ${addRows.length} data feed(s) on ${chain.name}...`,
      },
    );
  };

  const handleRemove = async () => {
    if (!removeAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: contractAddress as `0x${string}`,
          abi: buffcatAbi,
          functionName: 'removeDataFeeds',
          args: [removeAddresses],
          chainId: chain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Remove Data Feeds?',
        description: `Remove ${removeAddresses.length} feed mapping(s).`,
        successMessage: 'Data feeds removed successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Removing ${removeAddresses.length} data feed(s) on ${chain.name}...`,
      },
    );
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg custom-box-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="font-bold text-sm uppercase tracking-wider">
                Chainlink Data Feeds
              </span>
              <Badge className="rounded-full bg-custom-primary-color text-custom-secondary-text text-[10px] px-2 py-0.5">
                BASE ONLY
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={wlRefresh}
              disabled={wlLoading}
              className="border-custom-primary-color rounded-xl cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${wlLoading ? 'animate-spin' : ''}`} />
              {wlLoading ? 'Fetching...' : 'Load Whitelist'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {!whitelistData?.data && (
            <div className="py-8 text-center text-custom-muted-text text-sm">
              Click <strong>Load Whitelist</strong> first, then click a token to view its Chainlink
              feed.
            </div>
          )}
          {whitelistData?.data && (
            <div className="rounded-xl border border-custom-primary-color/30 overflow-hidden">
              <div className="bg-black/5 px-4 py-2 flex justify-between text-xs font-bold uppercase tracking-wider text-custom-muted-text">
                <span>Token</span>
                <span>Click to view feed</span>
              </div>
              {whitelistData.data.length === 0 ? (
                <p className="text-center text-sm text-custom-muted-text py-6">
                  No whitelisted tokens found.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto no-scrollbar">
                  {whitelistData.data.map((addr) => (
                    <TokenRow
                      key={addr}
                      address={addr}
                      chain={chain}
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedToken(addr)}
                          className="border-custom-primary-color/50 rounded-lg text-xs cursor-pointer"
                        >
                          <BarChart3 className="w-3 h-3 mr-1" /> View Feed
                        </Button>
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <FeedDetailModal
        tokenAddress={selectedToken ?? ''}
        chain={chain}
        isOpen={!!selectedToken}
        onClose={() => setSelectedToken(null)}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-600" />
              <span className="font-bold text-sm">Add Data Feeds</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: token, dataFeed</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Add Feeds"
              hint="Format: token,dataFeed"
              onParsed={setAddCsvText}
              preview={
                addRows.length > 0 && (
                  <div className="rounded-xl border border-green-500/30 bg-green-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-green-700 mb-1">
                      {addRows.length} row(s) parsed
                    </p>
                    {addRows.slice(0, 3).map((r, i) => (
                      <p key={i} className="text-xs font-mono text-green-800 truncate">
                        {r.token.slice(0, 10)}… → {r.feed.slice(0, 10)}…
                      </p>
                    ))}
                    {addRows.length > 3 && (
                      <p className="text-xs text-green-600">+{addRows.length - 3} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleAdd}
              disabled={!addRows.length}
              className="w-full cursor-pointer bg-custom-primary-color text-custom-secondary-text hover:bg-custom-primary-color/90 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Feeds{' '}
              {addRows.length > 0 ? `(${addRows.length})` : ''}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-custom-primary-color bg-custom-bg">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              <span className="font-bold text-sm">Remove Data Feeds</span>
            </div>
            <p className="text-xs text-custom-muted-text">CSV: token addresses to remove</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Remove Feeds"
              hint="Format: token address (one per line)"
              onParsed={setRemoveCsvText}
              preview={
                removeAddresses.length > 0 && (
                  <div className="rounded-xl border border-red-500/30 bg-red-50/50 p-3 max-h-32 overflow-y-auto no-scrollbar">
                    <p className="text-xs font-bold text-red-700 mb-1">
                      {removeAddresses.length} parsed
                    </p>
                    {removeAddresses.slice(0, 5).map((a) => (
                      <p key={a} className="text-xs font-mono text-red-800 truncate">
                        {a}
                      </p>
                    ))}
                    {removeAddresses.length > 5 && (
                      <p className="text-xs text-red-600">+{removeAddresses.length - 5} more</p>
                    )}
                  </div>
                )
              }
            />
            <Button
              onClick={handleRemove}
              disabled={!removeAddresses.length}
              variant="destructive"
              className="w-full cursor-pointer rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Remove Feeds{' '}
              {removeAddresses.length > 0 ? `(${removeAddresses.length})` : ''}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

const tabs = [
  { value: 'whitelist', label: 'Whitelist', icon: Database },
  { value: 'stable', label: 'Stable Coins', icon: Coins },
  { value: 'pools', label: 'Token Pools', icon: Link2 },
  { value: 'feeds', label: 'Data Feeds', icon: BarChart3 },
];

export default function ConfigPage() {
  return (
    <div className="min-h-screen mx-auto px-4 pb-20">
      {/* Hero */}
      <motion.div
        className="text-center mt-8 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-3 rounded-full border-2 border-custom-primary-color bg-custom-bg px-4 py-2.5 shadow-[4px_4px_0px_#000000] mb-5">
          <Settings className="w-4 h-4" />
          <span className="text-[10px] font-extrabold tracking-[0.16em] text-custom-primary-text sm:text-xs sm:tracking-[0.18em]">
            CONTRACT CONFIGURATION
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-center">
          Buffcat <span className="crypto-orange-gradient">Config</span>
        </h1>
        <p className="mt-4 text-base text-custom-muted-text max-w-xl mx-auto">
          Manage token whitelists, stable coins, Uniswap pool mappings, and Chainlink data feeds
          on-chain.
        </p>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <Tabs defaultValue="whitelist">
          <TabsList className="w-full bg-transparent flex justify-start items-center border-b-2 border-gray-200 rounded-none pb-1 mb-6 gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
                  data-[state=active]:shadow-none text-sm font-semibold text-gray-400 data-[state=active]:text-black relative
                  rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute
                  data-[state=active]:after:bottom-[-4px] data-[state=active]:after:left-0
                  data-[state=active]:after:right-0 data-[state=active]:after:h-0.5
                  data-[state=active]:after:bg-black transition-colors hover:text-gray-600 flex items-center gap-1.5 px-3 whitespace-nowrap"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="whitelist" className="mt-0">
              <motion.div
                key="whitelist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <WhitelistTab />
              </motion.div>
            </TabsContent>

            <TabsContent value="stable" className="mt-0">
              <motion.div
                key="stable"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StableCoinsTab />
              </motion.div>
            </TabsContent>

            <TabsContent value="pools" className="mt-0">
              <motion.div
                key="pools"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TokenPoolsTab />
              </motion.div>
            </TabsContent>

            <TabsContent value="feeds" className="mt-0">
              <motion.div
                key="feeds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DataFeedsTab />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
}
