import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Settings,
  X,
  CalendarClock,
  CircleQuestionMark,
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
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ThemedButton from '@/components/themed/button';
import { useTransactionDialog } from '../hooks/transactionDialogHook';
import { useWriteContract } from 'wagmi';
import { CoinGeckoToken } from '@/types/global';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { envVariables } from '@/lib/envVariables';
import buffcatAbi from '../lib/evm/buffcat.json';
import { useTokenMetadata, useERCMetadata } from '../hooks/query/tokens';
import { Blockchain } from '@/types/global';

const ClaimTokenAvatar = ({
  tokenAddress,
  chain,
  index,
}: {
  tokenAddress: string;
  chain: Blockchain;
  index: number;
}) => {
  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(chain, tokenAddress);
  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;
  const { data: ercMetadata } = useERCMetadata(chain, tokenAddress, {
    enabled: !!isMetadataUnavailable,
  });

  const symbol =
    !isMetadataUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMetadata?.symbol || `${tokenAddress.slice(0, 6)}...`;
  const logoUrl = metadata?.data?.attributes?.image_url;

  return (
    <div className="relative border-1 rounded-4xl border-black" style={{ zIndex: 3 - index }}>
      {logoUrl ? (
        <ImageWithFallback
          height={24}
          width={24}
          src={logoUrl}
          alt={symbol}
          fallbackSrc={placeholders.tokenImage}
          className="rounded-full border-2 border-background"
        />
      ) : (
        <CircleQuestionMark
          size={24}
          className="w-[24px] h-[24px] rounded-full border-2 border-background bg-white text-gray-400 flex-shrink-0"
        />
      )}
    </div>
  );
};

const ClaimTokenModalItem = ({
  tokenAddress,
  chain,
  onRemove,
}: {
  tokenAddress: string;
  chain: Blockchain;
  onRemove: () => void;
}) => {
  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(chain, tokenAddress);

  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;

  const {
    data: ercMetadata,
    isLoading: ercMetadataLoading,
    isError: ercMetadataError,
  } = useERCMetadata(chain, tokenAddress, {
    enabled: !!isMetadataUnavailable,
  });

  const isERCMetadataUnavailable = ercMetadataLoading || ercMetadataError || !ercMetadata;

  const symbol =
    !isMetadataUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMetadata?.symbol || `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`;

  const name =
    !isMetadataUnavailable && metadata?.data?.attributes?.name
      ? metadata.data.attributes.name
      : ercMetadata?.name || symbol;

  const logoUrl = metadata?.data?.attributes?.image_url;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-custom-primary-color/30">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <ImageWithFallback
            height={32}
            width={32}
            src={logoUrl}
            alt={symbol}
            fallbackSrc={placeholders.tokenImage}
            className="rounded-full"
          />
        ) : (
          <CircleQuestionMark
            size={32}
            className="w-[32px] h-[32px] rounded-full bg-white text-gray-400 flex-shrink-0"
          />
        )}
        <div className="flex flex-col">
          <span className="font-semibold">{name}</span>
          {!isERCMetadataUnavailable && (
            <span className="text-xs text-custom-muted-text">{symbol}</span>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="hover:bg-red-500/20 cursor-pointer"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function ClaimRewardsPanel() {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const { writeContractAsync } = useWriteContract();
  const chosenRewardTokens = useMemo(() => {
    return selectedTokens.rewardTokens[selectedBlockchain.id] || [];
  }, [selectedTokens.rewardTokens[selectedBlockchain.id]]);
  const [isRewardsModalOpen, setIsRewardsModalOpen] = useState(false);
  const [claimDays, setClaimDays] = useState<number>(0);
  const lockId = useAtomValue(selectedLockAtom);

  const primaryToken = chosenRewardTokens[0];

  const setTokenSelectorState = useSetAtom(tokenSelectorAtom);

  const handleTokenSelectorTrigger = () => {
    setTokenSelectorState((prev) => ({
      isOpen: true,
      mode: 'claimable',
      onClose: () => setTokenSelectorState((prev) => ({ ...prev, isOpen: false })),
      onSelectLockToken: prev.onSelectLockToken,
      onSelectUnlockToken: prev.onSelectUnlockToken,
      onSelectRewardToken: handleSelectToken,
    }));
  };

  const handleSelectToken = (token: string) => {
    const isAlreadySelected = chosenRewardTokens.some((t) => t === token);
    if (!isAlreadySelected) {
      setSelectedTokens((prev) => ({
        ...prev,
        rewardTokens: {
          ...prev.rewardTokens,
          [selectedBlockchain.id]: [...(prev.rewardTokens[selectedBlockchain.id] || []), token],
        },
      }));
    }
    setTokenSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRemoveToken = (tokenAddress: string) => {
    setSelectedTokens((prev) => ({
      ...prev,
      rewardTokens: {
        ...prev.rewardTokens,
        [selectedBlockchain.id]: (prev.rewardTokens[selectedBlockchain.id] || []).filter(
          (token) => token !== tokenAddress,
        ),
      },
    }));
  };

  const handleAddRewardToken = () => {
    setTokenSelectorState((prev) => ({
      isOpen: true,
      mode: 'claimable',
      onClose: () => setTokenSelectorState((prev) => ({ ...prev, isOpen: false })),
      onSelectLockToken: prev.onSelectLockToken,
      onSelectUnlockToken: prev.onSelectUnlockToken,
      onSelectRewardToken: handleSelectToken,
    }));
  };

  const { withConfirmation } = useTransactionDialog();

  const handleClaimRewards = async () => {
    if (!currentUser.loggedIn) {
      toast.error('Connect a wallet first.');
      return;
    }
    if (chosenRewardTokens.length === 0) {
      toast.error('Select at least one reward token.');
      return;
    }
    if (!claimDays || claimDays <= 0 || isNaN(claimDays)) {
      toast.error('Claim days must be a valid number greater than 0.');
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
    const buffcatContract =
      selectedBlockchain.id == 'eth'
        ? envVariables.buffcatContract.eth
        : envVariables.buffcatContract.base;
    if (buffcatContract == '') {
      toast.error(`${selectedBlockchain.name} Buffcat contract address not set.`);
      return;
    }

    const tokenAddresses = chosenRewardTokens.map((t) => t);

    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: buffcatContract as `0x${string}`,
          abi: buffcatAbi.abi,
          functionName: 'claimRewards',
          args: [tokenAddresses, BigInt(lockId), BigInt(claimDays)],
          chainId: selectedBlockchain.chainId,
        });
        toast.success('Signature', {
          description: `${sig}`,
        });
      },
      {
        title: 'Claim Rewards?',
        description: `Do you want to claim rewards for ${claimDays} days?`,
        successMessage: 'Your rewards have been claimed successfully.',
        loadingTitle: 'Processing Transaction',
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      },
    );
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full md:w-112 rounded-2xl px-4 py-2">
        <div className="text-xs text-custom-muted-text">You Claim</div>
        <div className="flex justify-between">
          <Button
            onClick={handleTokenSelectorTrigger}
            variant="ghost"
            className="me-6 my-2 !py-6 !ps-0 hover:bg-custom-primary-color/20 cursor-pointer flex items-center"
          >
            <span className="flex flex-col items-start">
              <span className="flex flex-row">
                <span className="text-xl font-bold text-left text-custom-primary-text">Select</span>
                <span className="flex items-center">
                  <ChevronRight className="text-custom-primary-text" />
                </span>
              </span>
              <span className="text-sm text-custom-muted-text">A Token</span>
            </span>
          </Button>
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
          <div className="text-muted-foreground text-sm px-6 pb-4">
            Lock your token or any token and receive li tokens/liquid locked tokens that represent
            your locked position. Use li tokens in other DeFi protocols while earning rewards. Burn
            your liquid locked tokens to unlock your original tokens. No lock-up period required.
          </div>
        </CollapsibleContent>
      </Collapsible>
      <Card
        className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none
      border border-custom-primary-color/30"
      >
        <CardContent className="px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-custom-muted-text" />
            <span className="text-sm font-semibold text-custom-muted-text uppercase">
              Claim Unclaimed Days
            </span>
            <span className="text-xs text-custom-muted-text ml-auto">Unclaimed Days: 17</span>
          </div>
          <Input
            type="number"
            placeholder="0"
            value={claimDays}
            onChange={(e) => setClaimDays(parseInt(e.target.value) || 0)}
            className="h-12 rounded-xl border-custom-primary-color/30 focus-visible:ring-0"
          />
        </CardContent>
      </Card>
      <Card
        className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none
      border border-custom-primary-color/30"
      >
        <CardContent className="px-4">
          <div className="flex justify-between items-center">
            <div className="text-custom-muted-text">Chosen Tokens</div>
            <div className="flex items-center gap-2">
              {chosenRewardTokens.length > 0 ? (
                <>
                  <div
                    onClick={() => setIsRewardsModalOpen(true)}
                    className="flex -space-x-2 cursor-pointer"
                  >
                    {chosenRewardTokens.slice(0, 3).map((tokenAddress, index) => (
                      <ClaimTokenAvatar
                        key={tokenAddress}
                        tokenAddress={tokenAddress}
                        chain={selectedBlockchain}
                        index={index}
                      />
                    ))}
                    {chosenRewardTokens.length > 3 && (
                      <div
                        className="flex items-center justify-center h-6 w-6 p-3
                        rounded-full bg-custom-primary-color text-custom-secondary-text border-2 border-background text-sm"
                      >
                        +{chosenRewardTokens.length - 3}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div
                  className="text-xs cursor-pointer hover:underline text-custom-primary-text"
                  onClick={handleAddRewardToken}
                >
                  + Add A Token
                </div>
              )}
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
        onClick={handleClaimRewards}
      >
        <Sparkles /> Claim Rewards
      </ThemedButton>

      <Dialog open={isRewardsModalOpen} onOpenChange={setIsRewardsModalOpen}>
        <DialogContent className="max-w-md border-2 border-custom-primary-color custom-box-shadow rounded-2xl">
          <DialogHeader>
            <DialogTitle>Chosen Reward Tokens</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
            {chosenRewardTokens.length > 0 ? (
              chosenRewardTokens.map((tokenAddress) => (
                <ClaimTokenModalItem
                  key={tokenAddress}
                  tokenAddress={tokenAddress}
                  chain={selectedBlockchain}
                  onRemove={() => handleRemoveToken(tokenAddress)}
                />
              ))
            ) : (
              <div className="text-center py-8 text-custom-muted-text">
                No reward tokens selected
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
