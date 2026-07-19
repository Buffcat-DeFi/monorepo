'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { selectedBlockchainAtom } from '@/store/global';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Plus, Trash2, BarChart3 } from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { getEvmAbi } from '@/lib/utils';
import { useTransactionDialog } from '@/hooks/transactionDialogHook';
import { useWhitelist } from '../hooks/query/contract';
import { getContractAddress } from '../lib/utils';
import TokenRow from './TokenRow';
import FeedDetailModal from './FeedDetailModal';
import { CsvUploadPanel, CsvPreviewTable } from './UploadInterface';

export default function DataFeedsPanel() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const { data: whitelistData, isLoading: wlLoading, refresh: wlRefresh } = useWhitelist(chain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatAbi = useMemo(() => getEvmAbi(chain.id), [chain.id]);
  const contractAddress = getContractAddress(chain.id);

  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [addCsvData, setAddCsvData] = useState<Record<string, string>[]>([]);
  const [removeCsvData, setRemoveCsvData] = useState<Record<string, string>[]>([]);

  const addRows = useMemo(() => {
    return addCsvData
      .map((row) => {
        const token = (row.token || row.Token || Object.values(row)[0])?.trim();
        const feed = (row.feed || row.Feed || Object.values(row)[1])?.trim();
        return { token, feed };
      })
      .filter(
        (r): r is { token: string; feed: string } =>
          !!r.token && r.token.startsWith('0x') && r.token.length === 42 &&
          !!r.feed && r.feed.startsWith('0x') && r.feed.length === 42
      );
  }, [addCsvData]);

  const removeAddresses = useMemo(() => {
    return removeCsvData
      .map((row) => Object.values(row)[0]?.trim())
      .filter((addr): addr is string => !!addr && addr.startsWith('0x') && addr.length === 42);
  }, [removeCsvData]);

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
      {/* ── Read panel ─────────────────────────────────────────────────────── */}
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

      {/* ── Write panels ───────────────────────────────────────────────────── */}
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
              onParsed={setAddCsvData}
              preview={
                <CsvPreviewTable
                  data={addCsvData}
                  variant="green"
                  label={`${addRows.length} row(s) parsed`}
                />
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
              onParsed={setRemoveCsvData}
              preview={
                <CsvPreviewTable
                  data={removeCsvData}
                  variant="red"
                  label={`${removeAddresses.length} parsed`}
                />
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
