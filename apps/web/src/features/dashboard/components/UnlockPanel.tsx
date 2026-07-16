import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Unlock,
  ArrowRightLeft,
  Settings,
  CircleQuestionMark,
  TriangleAlert,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ImageWithFallback';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  currentUserAtom,
  selectedBlockchainAtom,
  selectedTokensAtom,
  tokenSelectorAtom,
  selectedLockAtom,
} from '@/store/global';
import { placeholders } from '@/constants/placeholders';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ThemedButton from '@/components/themed/button';
import { useTransactionDialog } from '../hooks/transactionDialogHook';
import { toast } from 'sonner';
import { envVariables } from '@/lib/envVariables';
import { useWriteContract } from 'wagmi';
import buffcatAbi from '../lib/evm/buffcat.json';
import { isValidFloat } from '../lib/utils';
import { useERCMetadata, useTokenMetadata } from '../hooks/query/tokens';
import { Lock } from '@/types/api';
import { useClaimable, useLocks } from '../hooks/query/contract';

export default function UnlockPanel() {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(true);
  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const [amount, setAmount] = useState<string>('1');
  const calculatedValue = useMemo(() => {
    if (!isValidFloat(amount)) return '0';
    const parsed = parseFloat(amount);
    const result = parsed - parsed * 0.005;
    return Number(result.toFixed(6)).toString();
  }, [amount]);
  const lockId = useAtomValue(selectedLockAtom);
  const { writeContractAsync } = useWriteContract();
  const { refresh: refreshClaimable } = useClaimable(selectedBlockchain);
  const { refresh: refreshLocks } = useLocks(selectedBlockchain, currentUser.address);

  const unlockToken = useMemo(() => {
    return selectedTokens.unlockToken[selectedBlockchain.id];
  }, [selectedTokens.unlockToken[selectedBlockchain.id]]);

  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(selectedBlockchain, unlockToken?.lockedToken ?? '');

  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;

  const { data: ercMetadata } = useERCMetadata(selectedBlockchain, unlockToken?.lockedToken ?? '', {
    enabled: !!isMetadataUnavailable,
  });

  const unlockTokenMetadata = useMemo(() => {
    if (isMetadataUnavailable)
      return {
        ...ercMetadata,
        logoURI: null,
      };
    else
      return {
        name: metadata.data.attributes.name,
        symbol: metadata.data.attributes.symbol,
        decimals: metadata.data.attributes.decimals,
        logoURI: metadata.data.attributes.image_url,
      };
  }, [metadata, isMetadataUnavailable, ercMetadata]);

  const setTokenSelectorState = useSetAtom(tokenSelectorAtom);

  const handletokenSelectorTrigger = () => {
    setTokenSelectorState((prev) => ({
      isOpen: true,
      mode: 'locks',
      onClose: () => setTokenSelectorState((prev) => ({ ...prev, isOpen: false })),
      onSelectLockToken: prev.onSelectLockToken,
      onSelectUnlockToken: handleSelectToken,
      onSelectRewardToken: prev.onSelectRewardToken,
    }));
  };

  const handleSelectToken = (token: Lock) => {
    setSelectedTokens((prev) => ({
      ...prev,
      unlockToken: {
        ...prev.unlockToken,
        [selectedBlockchain.id]: token,
      },
    }));
    setTokenSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const { withConfirmation } = useTransactionDialog();

  const handleUnlockTokens = async () => {
    if (!currentUser.loggedIn) {
      toast.error('Connect a wallet first.');
      return;
    }
    const tokenAddress = selectedTokens.unlockToken[selectedBlockchain.id]?.lockedToken;
    if (!tokenAddress) {
      toast.error('Select a token and try again.');
      return;
    }
    if (!isValidFloat(amount)) {
      toast.error('Invalid input.');
      return;
    }
    let parsedAmount = parseFloat(amount);
    if (parsedAmount == 0 || parsedAmount < 0) {
      toast.error('Invalid Amount Input');
      return;
    }
    if (
      !lockId ||
      lockId.trim() === '' ||
      isNaN(parseInt(lockId)) ||
      parseInt(lockId) < 0 ||
      !Number.isInteger(parseFloat(lockId))
    ) {
      toast.error('Invalid Lock ID.');
      return;
    }
    const decimals = unlockTokenMetadata?.decimals;
    let unlockAmount = parsedAmount;
    if (decimals) {
      unlockAmount = parsedAmount * 10 ** decimals;
    }
    const buffcatContract =
      selectedBlockchain.id == 'eth'
        ? envVariables.buffcatContract.eth
        : envVariables.buffcatContract.base;
    if (buffcatContract == '') {
      toast.error(`${selectedBlockchain.name} Buffcat contract address not set.`);
      return;
    }
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: buffcatContract as `0x${string}`,
          abi: buffcatAbi.abi,
          functionName: 'unlockAssets',
          args: [BigInt(lockId), BigInt(Math.floor(unlockAmount))],
          chainId: selectedBlockchain.chainId,
        });
        toast.success('Signature', {
          description: `${sig}`,
        });
        await refreshLocks();
        await refreshClaimable();
      },
      {
        title: 'Unlock Tokens?',
        description: `Do you want to unlock ${amount}
        ${unlockTokenMetadata?.name ?? ''}?`,
        successMessage: 'Your tokens have been unlocked successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      },
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full md:w-112 rounded-2xl px-4 py-2">
        <div className="text-xs text-custom-muted-text">You Unlock</div>
        <div className="flex justify-between">
          <Button
            onClick={handletokenSelectorTrigger}
            variant="ghost"
            className="me-6 my-2 !py-6 !ps-0 hover:bg-custom-primary-color/20 cursor-pointer flex items-center"
          >
            {unlockToken ? (
              <>
                <div className="mr-2 flex-shrink-0 flex items-center">
                  {unlockTokenMetadata.logoURI && unlockTokenMetadata.logoURI !== '' ? (
                    <ImageWithFallback
                      height={38}
                      width={38}
                      src={unlockTokenMetadata.logoURI}
                      alt={unlockTokenMetadata.name}
                      fallbackSrc={placeholders.tokenImage}
                      key={unlockToken.lockedToken}
                    />
                  ) : (
                    <CircleQuestionMark
                      size={38}
                      className="w-[38px] h-[38px] text-gray-400 flex-shrink-0"
                    />
                  )}
                </div>
                <span className="flex flex-col items-start">
                  <span className="flex flex-row">
                    <span className="text-xl font-bold text-left text-custom-primary-text">
                      {unlockTokenMetadata ? unlockTokenMetadata.symbol : placeholders.tokenSymbol}
                    </span>
                    <span className="flex items-center">
                      <ChevronRight className="text-custom-primary-text" />
                    </span>
                  </span>
                  <span className="text-sm text-custom-muted-text">
                    on {selectedBlockchain.name}
                  </span>
                </span>
              </>
            ) : (
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-xl font-bold text-left text-custom-primary-text">
                    Select
                  </span>
                  <span className="flex items-center">
                    <ChevronRight className="text-custom-primary-text" />
                  </span>
                </span>
                <span className="text-sm text-custom-muted-text">A Token</span>
              </span>
            )}
          </Button>
          <div>
            <Input
              type="text"
              pattern="^\d*\.?\d*$"
              min={0}
              inputMode="decimal"
              placeholder="1.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              aria-label="amount"
              step="any"
              className="h-9 my-2 !text-3xl font-bold flex items-center shadow-none
              border-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-transparent
              text-right placeholder:text-custom-primary-text p-0
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
              [-moz-appearance:textfield]"
            />
          </div>
        </div>
        <div className="text-sm text-custom-muted-text">
          {unlockTokenMetadata ? unlockTokenMetadata.name : 'N/A'}
        </div>
      </div>
      <Collapsible className="w-full md:w-112 mt-2 rounded-2xl border border-custom-primary-color/30">
        <CollapsibleTrigger
          onClick={() => {
            setIsCollapsibleOpen((val) => !val);
          }}
          className="w-full py-2 px-4 flex justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>How it works</span>
          </div>
          <div className="flex items-center">
            {isCollapsibleOpen ? (
              <ChevronDown className="text-custom-muted-text" />
            ) : (
              <ChevronRight className="text-custom-muted-text" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-6">
          <div className="h-24 rounded-2xl grid grid-cols-3 px-18">
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 flex items-center">
                {unlockTokenMetadata?.logoURI && unlockTokenMetadata.logoURI !== '' ? (
                  <ImageWithFallback
                    height={48}
                    width={48}
                    src={unlockTokenMetadata.logoURI}
                    alt={unlockTokenMetadata.name}
                    fallbackSrc={placeholders.tokenImage}
                    key={unlockToken?.lockedToken}
                  />
                ) : (
                  <CircleQuestionMark
                    size={48}
                    className="w-[48px] h-[48px] text-gray-400 flex-shrink-0"
                  />
                )}
              </div>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-sm font-bold text-left text-custom-primary-text">
                    {unlockTokenMetadata
                      ? 'li' + unlockTokenMetadata.symbol
                      : 'li' + placeholders.tokenSymbol}
                  </span>
                </span>
              </span>
            </div>
            <div className="flex flex-col items-center">
              1:1
              <ArrowRightLeft className="h-8 w-8" />
            </div>
            <div className="flex flex-col items-center">
              <div className="flex-shrink-0 flex items-center">
                {unlockTokenMetadata?.logoURI && unlockTokenMetadata.logoURI !== '' ? (
                  <ImageWithFallback
                    height={48}
                    width={48}
                    src={unlockTokenMetadata.logoURI}
                    alt={unlockTokenMetadata.name}
                    fallbackSrc={placeholders.tokenImage}
                    key={unlockToken?.lockedToken}
                  />
                ) : (
                  <CircleQuestionMark
                    size={48}
                    className="w-[48px] h-[48px] text-gray-400 flex-shrink-0"
                  />
                )}
              </div>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-sm font-bold text-left text-custom-primary-text">
                    {unlockTokenMetadata ? unlockTokenMetadata.symbol : placeholders.tokenSymbol}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <div className="text-muted-foreground text-sm px-6 pb-4">
            Lock your {unlockTokenMetadata ? unlockTokenMetadata.symbol : placeholders.tokenSymbol}{' '}
            or any token and receive li
            {unlockTokenMetadata ? unlockTokenMetadata.symbol : placeholders.tokenSymbol}/liquid
            locked tokens that represent your locked position. Use li
            {unlockTokenMetadata ? unlockTokenMetadata.symbol : placeholders.tokenSymbol} in other
            DeFi protocols while earning rewards. Burn your liquid locked tokens to unlock your
            original tokens. No lock-up period required.
          </div>
        </CollapsibleContent>
      </Collapsible>
      {!!unlockToken && !unlockTokenMetadata?.decimals && (
        <Collapsible
          open={isWarningOpen}
          onOpenChange={setIsWarningOpen}
          className="w-full md:w-112 mt-2 rounded-2xl border border-yellow-500/50 bg-yellow-500/10"
        >
          <CollapsibleTrigger className="w-full py-2 px-4 flex justify-between cursor-pointer">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
              <TriangleAlert className="h-4 w-4" />
              <span className="font-semibold">Warning</span>
            </div>
            <div className="flex items-center text-yellow-600 dark:text-yellow-500">
              {isWarningOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 px-4 pb-4 text-sm text-yellow-700 dark:text-yellow-400">
            We couldn't fetch the token metadata. The value you input above will be sent exactly
            as-is in the smart contract call, without the 10 ** decimals multiplication. Please look
            up the token's decimals yourself and input the raw value (e.g., if you want to send 1
            token with 18 decimals, input 1000000000000000000).
          </CollapsibleContent>
        </Collapsible>
      )}
      <Card
        className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none
      border border-custom-primary-color/30"
      >
        <CardContent className="px-4">
          <div className="w-full md:w-104 flex justify-between mt-2">
            <div className="text-custom-muted-text">Unlocked Value</div>
            <div>
              <span>
                {calculatedValue} {unlockTokenMetadata ? unlockTokenMetadata.symbol : '--'}
              </span>
            </div>
          </div>
          <div className="w-full md:w-104 flex justify-between mt-2">
            <div className="text-custom-muted-text">Platform Fee</div>
            <div>
              <span className="text-custom-muted-text">Auto </span>
              <span>0.5%</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <ThemedButton
        style="secondary"
        variant="outline"
        size="lg"
        className="w-74 md:w-112 mt-2"
        onClick={handleUnlockTokens}
      >
        <Unlock /> Unlock Tokens
      </ThemedButton>
    </div>
  );
}
