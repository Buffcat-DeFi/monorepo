'use client';

import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { selectedBlockchainAtom } from '@/store/global';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Plus, Trash2, Loader2, ExternalLink, Link2 } from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { getEvmAbi } from '@/lib/utils';
import { useTransactionDialog } from '@/hooks/transactionDialogHook';
import { useWhitelist } from '../hooks/query/contract';
import { downloadCsv, getContractAddress } from '../lib/utils';
import TokenRow from './TokenRow';
import PoolDetailModal from './PoolDetailModal';
import { CsvUploadPanel, CsvPreviewTable } from './UploadInterface';

export default function TokenPoolsPanel() {
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
        const pool = (row.pool || row.Pool || Object.values(row)[1])?.trim();
        const pairedToken = (row.pairedToken || row.pairedtoken || row.PairedToken || Object.values(row)[2])?.trim();
        return { token, pool, pairedToken };
      })
      .filter(
        (r): r is { token: string; pool: string; pairedToken: string } =>
          !!r.token && r.token.startsWith('0x') && r.token.length === 42 &&
          !!r.pool && r.pool.startsWith('0x') && r.pool.length === 42 &&
          !!r.pairedToken && r.pairedToken.startsWith('0x') && r.pairedToken.length === 42
      );
  }, [addCsvData]);

  const removeAddresses = useMemo(() => {
    return removeCsvData
      .map((row) => Object.values(row)[0]?.trim())
      .filter((addr): addr is string => !!addr && addr.startsWith('0x') && addr.length === 42);
  }, [removeCsvData]);

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
      {/* ── Read panel ─────────────────────────────────────────────────────── */}
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

      {/* ── Write panels ───────────────────────────────────────────────────── */}
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
              <Trash2 className="w-4 h-4 mr-2" /> Remove Pools{' '}
              {removeAddresses.length > 0 ? `(${removeAddresses.length})` : ''}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
