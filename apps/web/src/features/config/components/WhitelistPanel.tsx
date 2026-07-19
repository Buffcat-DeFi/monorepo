'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { selectedBlockchainAtom } from '@/store/global';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Plus, Trash2, AlertCircle, Loader2, Database } from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { getEvmAbi } from '@/lib/utils';
import { useTransactionDialog } from '@/hooks/transactionDialogHook';
import { useWhitelist } from '../hooks/query/contract';
import { downloadCsv, getContractAddress } from '../lib/utils';
import TokenRow from './TokenRow';
import { CsvUploadPanel, CsvPreviewTable } from './UploadInterface';

export default function WhitelistPanel() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const { data, isLoading, isError, refresh } = useWhitelist(chain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatAbi = useMemo(() => getEvmAbi(chain.id), [chain.id]);
  const contractAddress = getContractAddress(chain.id);

  const [addCsvData, setAddCsvData] = useState<Record<string, string>[]>([]);
  const [removeCsvData, setRemoveCsvData] = useState<Record<string, string>[]>([]);

  const addAddresses = useMemo(() => {
    return addCsvData
      .map((row) => Object.values(row)[0]?.trim())
      .filter((addr): addr is string => !!addr && addr.startsWith('0x') && addr.length === 42);
  }, [addCsvData]);

  const removeAddresses = useMemo(() => {
    return removeCsvData
      .map((row) => Object.values(row)[0]?.trim())
      .filter((addr): addr is string => !!addr && addr.startsWith('0x') && addr.length === 42);
  }, [removeCsvData]);

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
      {/* ── Read panel ─────────────────────────────────────────────────────── */}
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

      {/* ── Write panels ───────────────────────────────────────────────────── */}
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
              onParsed={setAddCsvData}
              preview={
                <CsvPreviewTable
                  data={addCsvData}
                  variant="green"
                  label={`${addAddresses.length} address(es) parsed`}
                />
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
              onParsed={setRemoveCsvData}
              preview={
                <CsvPreviewTable
                  data={removeCsvData}
                  variant="red"
                  label={`${removeAddresses.length} address(es) parsed`}
                />
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
