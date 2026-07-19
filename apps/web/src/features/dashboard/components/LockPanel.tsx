import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Lock,
  Settings,
  Clock,
  Minus,
  Plus,
  LockKeyhole,
  Unlock as UnlockIcon,
  Users,
  CircleQuestionMark,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ImageWithFallback';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { placeholders } from '@/constants/placeholders';
import { useMemo, useState } from 'react';
import {
  tokenSelectorAtom,
  selectedTokensAtom,
  selectedBlockchainAtom,
  currentUserAtom,
} from '@/store/global';
import { Card, CardContent } from '@/components/ui/card';
import ThemedButton from '@/components/themed/button';
import { toast } from 'sonner';
import { useTransactionDialog } from '../../../hooks/transactionDialogHook';
import { useWriteContract } from 'wagmi';
import erc20Abi from '../../../lib/evm/erc20.json';
import { envVariables } from '@/lib/envVariables';
import { LockType } from '@/types/global';
import { useClaimable, useLocks } from '../hooks/query/contract';
import { useTokenMetadata, useERCMetadata } from '../../../hooks/query/tokens';
import { getEvmAbi } from '@/lib/utils';
import { isValidFloat } from '@/features/dashboard/lib/utils';
import { Slider } from '@/components/ui/slider';
import { isAddress } from 'viem';

export default function LockPanel() {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
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
  const buffcatAbi = useMemo(() => {
    return getEvmAbi(selectedBlockchain.id);
  }, [selectedBlockchain]);
  const { writeContractAsync } = useWriteContract();
  const { refresh: refreshClaimable } = useClaimable(selectedBlockchain);
  const { refresh: refreshLocks } = useLocks(selectedBlockchain, currentUser.address);

  // Lock duration state (in days)
  const [lockDuration, setLockDuration] = useState<number>(1034);
  const [lockType, setLockType] = useState<LockType>(LockType.FLEXIBLE);
  const [referrerWallet, setReferrerWallet] = useState<string>('');

  const lockTokenAddress = selectedTokens.lockToken[selectedBlockchain.id];

  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(selectedBlockchain, lockTokenAddress || '');

  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;

  const {
    data: ercMetadata,
  } = useERCMetadata(selectedBlockchain, lockTokenAddress || '', {
    enabled: !!lockTokenAddress && !!isMetadataUnavailable,
  });

  const symbol =
    lockTokenAddress
      ? !isMetadataUnavailable && metadata?.data?.attributes?.symbol
        ? metadata.data.attributes.symbol
        : ercMetadata?.symbol || `${lockTokenAddress.slice(0, 6)}...${lockTokenAddress.slice(-4)}`
      : '';

  const name =
    lockTokenAddress
      ? !isMetadataUnavailable && metadata?.data?.attributes?.name
        ? metadata.data.attributes.name
        : ercMetadata?.name || symbol
      : '';

  const decimals =
    lockTokenAddress
      ? !isMetadataUnavailable && metadata?.data?.attributes?.decimals
        ? metadata.data.attributes.decimals
        : ercMetadata?.decimals || 18
      : 18;

  const logoUrl = metadata?.data?.attributes?.image_url;

  // Calculate unlock date
  const unlockDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + lockDuration);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [lockDuration]);

  // Calculate months
  const lockMonths = useMemo(() => {
    return (lockDuration / 30).toFixed(1);
  }, [lockDuration]);

  const handleDurationIncrement = () => {
    setLockDuration((prev) => Math.min(prev + 1, 3000));
  };

  const handleDurationDecrement = () => {
    setLockDuration((prev) => Math.max(prev - 1, 1));
  };

  const handleSliderChange = (value: number[]) => {
    setLockDuration(value[0]);
  };

  const setTokenSelectorState = useSetAtom(tokenSelectorAtom);

  const handletokenSelectorTrigger = () => {
    setTokenSelectorState((prev) => ({
      isOpen: true,
      mode: 'all',
      onClose: () => setTokenSelectorState((prev) => ({ ...prev, isOpen: false })),
      onSelectLockToken: handleSelectToken,
      onSelectUnlockToken: prev.onSelectUnlockToken,
      onSelectRewardToken: prev.onSelectRewardToken,
    }));
  };

  const handleSelectToken = (token: string) => {
    setSelectedTokens((prev) => ({
      ...prev,
      lockToken: {
        ...prev.lockToken,
        [selectedBlockchain.id]: token,
      },
    }));
    setTokenSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const { withConfirmation } = useTransactionDialog();

  const handleTokenApproval = async () => {
    if (!currentUser.loggedIn || currentUser.address === '') {
      toast.error('Connect a wallet first.');
      return;
    }
    const tokenAddress = selectedTokens.lockToken[selectedBlockchain.id];
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
    let approvalAmount = parsedAmount;
    if (!decimals) {
      toast.error('Token decimals not found, toggle to use raw values instead.');
      return;
    }
    approvalAmount = parsedAmount * 10 ** decimals;
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
          address: tokenAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: 'approve',
          args: [buffcatContract, BigInt(Math.floor(approvalAmount))],
          chainId: selectedBlockchain.chainId,
        });
        toast.success('Signature', {
          description: `${sig}`,
        });
      },
      {
        title: 'Approve Tokens?',
        description: `Do you want to approve ${amount} ${symbol || ''}?`,
        successMessage: 'Your tokens have been approved successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      },
    );
  };

  const handleLockTokens = async () => {
    if (!currentUser.loggedIn || currentUser.address === '') {
      toast.error('Connect a wallet first.');
      return;
    }
    const tokenAddress = selectedTokens.lockToken[selectedBlockchain.id];
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
    if (referrerWallet && referrerWallet !== '' && !isAddress(referrerWallet)) {
      toast.error('Invalid Referrer Wallet Address.');
      return;
    }
    let lockAmount = parsedAmount;
    if (!decimals) {
      toast.error('Token decimals not found, toggle to use raw values instead.');
      return;
    }
    lockAmount = parsedAmount * 10 ** decimals;
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
          abi: buffcatAbi,
          functionName: 'lockAssets',
          args: [
            tokenAddress,
            BigInt(Math.floor(lockAmount)),
            BigInt(lockDuration),
            lockType,
            referrerWallet === '' ? '0x0000000000000000000000000000000000000000' : referrerWallet,
          ],
          chainId: selectedBlockchain.chainId,
        });
        toast.success('Signature', {
          description: `${sig}`,
        });
        await refreshLocks();
        await refreshClaimable();
      },
      {
        title: 'Lock Tokens?',
        description: `Do you want to lock ${amount} ${symbol || ''}?`,
        successMessage: 'Your tokens have been locked successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      },
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full md:w-112 rounded-2xl px-4 py-2">
        <div className="text-xs text-custom-muted-text">You Lock</div>
        <div className="flex justify-between">
          <Button
            onClick={handletokenSelectorTrigger}
            variant="ghost"
            className="me-6 my-2 !py-6 !ps-0 hover:bg-custom-primary-color/20 cursor-pointer flex items-center"
          >
            {lockTokenAddress ? (
              <>
                <div className="mr-2 flex-shrink-0 flex items-center">
                  {!isMetadataUnavailable && logoUrl ? (
                    <ImageWithFallback
                      height={38}
                      width={38}
                      src={logoUrl}
                      alt={name}
                      fallbackSrc={placeholders.tokenImage}
                      key={lockTokenAddress}
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
                      {symbol || placeholders.tokenSymbol}
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
        <div className="text-sm text-custom-muted-text">{lockTokenAddress ? name : 'N/A'}</div>
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
          <div className="text-muted-foreground text-sm px-6 pb-4">
            Lock any token for a set period of time either fixed or flexible. With a fixed lock you
            can only unlock your tokens after set time period ends and with flexible you can unlock
            anytime. Adding a referral gives you additional 0.5% boost when claiming rewards.
          </div>
        </CollapsibleContent>
      </Collapsible>
      {/* Lock Duration Section */}
      <Card className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none border border-custom-primary-color/30">
        <CardContent className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-custom-muted-text" />
            <span className="text-sm font-semibold text-custom-muted-text uppercase">
              Lock Duration
            </span>
          </div>

          <div className="flex items-center gap-3 mb-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDurationDecrement}
              className="h-12 w-12 cursor-pointer rounded-xl border-custom-primary-color/30 hover:bg-custom-primary-color/20"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="flex-1 flex items-center justify-center bg-custom-primary-color/5 rounded-xl py-3 px-4">
              <Input
                type="number"
                value={lockDuration}
                onChange={(e) =>
                  setLockDuration(Math.max(1, Math.min(3000, parseInt(e.target.value) || 1)))
                }
                className="text-3xl font-bold text-center border-none shadow-none focus-visible:ring-0 bg-transparent p-0 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDurationIncrement}
              className="h-12 w-12 cursor-pointer rounded-xl border-custom-primary-color/30 hover:bg-custom-primary-color/20"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-custom-muted-text text-sm">days</span>
          </div>

          <div className="text-sm text-custom-muted-text text-center mb-4">
            ≈ {lockMonths} months · unlocks {unlockDate}
          </div>

          <div className="space-y-2">
            <Slider
              value={[lockDuration]}
              onValueChange={handleSliderChange}
              min={1}
              max={3000}
              step={1}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-xs text-custom-muted-text">
              <span>1d</span>
              <span>1yr</span>
              <span>3000d</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lock Type Section */}
      <Card className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none border border-custom-primary-color/30">
        <CardContent className="px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <LockKeyhole className="h-4 w-4 text-custom-muted-text" />
            <span className="text-sm font-semibold text-custom-muted-text uppercase">
              Lock Type
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Button
              variant={lockType === LockType.FIXED ? 'default' : 'outline'}
              onClick={() => setLockType(LockType.FIXED)}
              className={`h-14 rounded-xl text-base font-semibold cursor-pointer ${
                lockType === LockType.FIXED
                  ? 'bg-custom-primary-text text-background hover:bg-custom-primary-text/90'
                  : 'border-custom-primary-color/30 hover:bg-custom-primary-color/20'
              }`}
            >
              <LockKeyhole className="h-5 w-5 mr-2" />
              FIXED
            </Button>
            <Button
              variant={lockType === LockType.FLEXIBLE ? 'default' : 'outline'}
              onClick={() => setLockType(LockType.FLEXIBLE)}
              className={`h-14 rounded-xl text-base font-semibold cursor-pointer ${
                lockType === LockType.FLEXIBLE
                  ? 'bg-custom-primary-text text-background hover:bg-custom-primary-text/90'
                  : 'border-custom-primary-color/30 hover:bg-custom-primary-color/20'
              }`}
            >
              <UnlockIcon className="h-5 w-5 mr-2" />
              FLEXIBLE
            </Button>
          </div>

          <div className="text-sm text-custom-muted-text">
            {lockType === LockType.FIXED
              ? 'Tokens are locked until the exact end date. Early withdrawal is not possible.'
              : 'Tokens can be withdrawn early with a penalty fee. Rewards are earned dynamically.'}
          </div>
        </CardContent>
      </Card>

      {/* Referrer Wallet Section */}
      <Card className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none border border-custom-primary-color/30">
        <CardContent className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-custom-muted-text" />
            <span className="text-sm font-semibold text-custom-muted-text uppercase">
              Referrer Wallet
            </span>
            <span className="text-xs text-custom-muted-text ml-auto">Optional</span>
          </div>

          <Input
            type="text"
            placeholder="0x0000...0000"
            value={referrerWallet}
            onChange={(e) => setReferrerWallet(e.target.value)}
            className="h-12 rounded-xl border-custom-primary-color/30 focus-visible:ring-0"
          />
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none border border-custom-primary-color/30">
        <CardContent className="px-4">
          <div className="w-full md:w-104 flex justify-between mt-2">
            <div className="text-custom-muted-text">Locked Value</div>
            <div>
              <span>
                {calculatedValue} {lockTokenAddress ? symbol : '--'}
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
        style="primary"
        variant="outline"
        size="lg"
        className="w-74 md:w-112 mt-2"
        onClick={handleTokenApproval}
      >
        <CircleCheck /> Approve Tokens
      </ThemedButton>
      <ThemedButton
        style="secondary"
        variant="outline"
        size="lg"
        className="w-74 md:w-112 mt-2"
        onClick={handleLockTokens}
      >
        <Lock /> Lock Tokens
      </ThemedButton>
      <div className="p-2 text-sm text-muted-foreground text-center">
        Disclaimer: You'll have to pay for deploying the derivative of the token you are locking if
        it hasn't been locked before on buffcat even once on the specific chain you are on.
      </div>
    </div>
  );
}
