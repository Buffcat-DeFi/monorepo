'use client';
import { useState, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { selectedBlockchainAtom } from '@/store/global';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Download, Plus, Trash2, ExternalLink, Link2, CircleQuestionMark } from 'lucide-react';
import { useWriteContract } from 'wagmi';
import { toast } from 'sonner';
import { useTransactionDialog } from '@/hooks/transactionDialogHook';
import { useWhitelist } from '@/hooks/query/contract';
import TokenRow from './TokenRow';
import PoolDetailModal from './PoolDetailModal';
import { CsvUploadPanel, CsvPreviewTable } from './UploadInterface';
import buffcatAbi from '@/lib/evm/buffcat.json';
import { envVariables } from '@/lib/envVariables';
import Guide from './Guide';

export default function TokenPoolsPanel() {
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const {
    data: whitelistData,
    isLoading: wlLoading,
    isFetching: wlFetching,
    refresh: wlRefresh,
  } = useWhitelist(selectedBlockchain);
  const { writeContractAsync } = useWriteContract();
  const { withConfirmation } = useTransactionDialog();
  const buffcatContractAddress = envVariables.buffcatContract[selectedBlockchain.id];

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [addCsvData, setAddCsvData] = useState<Record<string, string>[]>([]);
  const [removeCsvData, setRemoveCsvData] = useState<Record<string, string>[]>([]);

  const addRows = useMemo(() => {
    return addCsvData
      .map((row) => {
        const token = row['Token Address']?.trim();
        const pool = row['Uniswap V3 Pool']?.trim();
        const pairedToken = row['Paired Token']?.trim();
        return { token, pool, pairedToken };
      })
      .filter(
        (r): r is { token: string; pool: string; pairedToken: string } =>
          !!r.token &&
          r.token.startsWith('0x') &&
          r.token.length === 42 &&
          !!r.pool &&
          r.pool.startsWith('0x') &&
          r.pool.length === 42 &&
          !!r.pairedToken &&
          r.pairedToken.startsWith('0x') &&
          r.pairedToken.length === 42,
      );
  }, [addCsvData]);

  const removeAddresses = useMemo(() => {
    return removeCsvData
      .map((row) => row['Token Address']?.trim())
      .filter((addr): addr is string => !!addr && addr.startsWith('0x') && addr.length === 42);
  }, [removeCsvData]);

  const handleAdd = async () => {
    if (!addRows.length) return toast.error('No valid rows in CSV.');
    await withConfirmation(
      async () => {
        const tokens = addRows.map((r) => r.token);
        const pools = addRows.map((r) => r.pool);
        const pairedTokens = addRows.map((r) => r.pairedToken);
        const sig = await writeContractAsync({
          address: buffcatContractAddress as `0x${string}`,
          abi: buffcatAbi.abi,
          functionName: 'addTokenPools',
          args: [tokens, pools, pairedTokens, BigInt(addRows.length)],
          chainId: selectedBlockchain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Add Token Pools?',
        description: `Add ${addRows.length} pool mapping(s).`,
        successMessage: 'Token pools added successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Adding ${addRows.length} pool mapping(s) on ${selectedBlockchain.name}...`,
      },
    );
  };

  const handleRemove = async () => {
    if (!removeAddresses.length) return toast.error('No valid addresses in CSV.');
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: buffcatContractAddress as `0x${string}`,
          abi: buffcatAbi.abi,
          functionName: 'removeTokenPools',
          args: [removeAddresses],
          chainId: selectedBlockchain.chainId,
        });
        toast.success('TX Submitted', { description: sig });
      },
      {
        title: 'Remove Token Pools?',
        description: `Remove ${removeAddresses.length} pool mapping(s).`,
        successMessage: 'Token pools removed successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Removing ${removeAddresses.length} pool mapping(s) on ${selectedBlockchain.name}...`,
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
                onClick={() => setIsGuideOpen(true)}
                className="border-custom-primary-color rounded-xl cursor-pointer"
              >
                <CircleQuestionMark className="w-3 h-3 mr-1" />
                Guide
              </Button>
              <Guide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
              <Button
                variant="outline"
                size="sm"
                onClick={wlRefresh}
                disabled={wlFetching}
                className="border-custom-primary-color rounded-xl cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${wlFetching ? 'animate-spin' : ''}`} />
                {wlFetching ? 'Reloading...' : 'Reload Whitelist'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="border-custom-primary-color rounded-xl cursor-pointer"
              >
                <a
                  href="/templates/token_uniswap_pools_template.csv"
                  download="token_uniswap_pools_template.csv"
                >
                  <Download className="w-3 h-3 mr-1" /> Template CSV
                </a>
              </Button>
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
                      chain={selectedBlockchain}
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
        chain={selectedBlockchain}
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
            <p className="text-xs text-custom-muted-text">
              CSV: Token Address, Uniswap V3 Pool, Paired Token
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Add Pools"
              hint="Format: Token Address,Uniswap V3 Pool,Paired Token"
              onParsed={setAddCsvData}
              expectedHeaders={['Token Address', 'Uniswap V3 Pool', 'Paired Token']}
              preview={<CsvPreviewTable data={addCsvData} variant="green" />}
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
            <p className="text-xs text-custom-muted-text">CSV: Token Address</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <CsvUploadPanel
              label="Upload CSV to Remove Pools"
              hint="Format: Token Address (one per line)"
              onParsed={setRemoveCsvData}
              expectedHeaders={['Token Address']}
              preview={<CsvPreviewTable data={removeCsvData} variant="red" />}
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
