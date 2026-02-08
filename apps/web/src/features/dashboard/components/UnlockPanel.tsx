import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Unlock,
  ArrowRightLeft,
  Settings,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageWithFallback from "@/components/ImageWithFallback";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  currentUserAtom,
  selectedBlockchainAtom,
  selectedTokensAtom,
  tokenSelectorAtom,
} from "@/store/global";
import { placeholders } from "@/constants/placeholders";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import ThemedButton from "@/components/themed/button";
import { useTransactionDialog } from "../hooks/transactionDialogHook";
import { toast } from "sonner";
import { envVariables } from "@/lib/envVariables";
import { useWriteContract } from "wagmi";
import erc20Abi from "../lib/evm/erc20.json";
import twosideAbi from "../lib/evm/twoside.json";
import { useTokenDerivative } from "../hooks/query/contract";
import { CoinGeckoTokenType } from "@/types/global";
import TokenInfo from "./TokenInfo";
import { isValidFloat } from "../lib/utils";

export default function UnlockPanel() {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [selectedTokens, setSelectedTokens] = useAtom(selectedTokensAtom);
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const [amount, setAmount] = useState<string>("1");
  const { writeContractAsync } = useWriteContract();

  const unlockToken = useMemo(() => {
    return selectedTokens.unlockToken[selectedBlockchain.id];
  }, [selectedTokens.unlockToken[selectedBlockchain.id]]);

  const setTokenSelectorState = useSetAtom(tokenSelectorAtom);

  const handletokenSelectorTrigger = () => {
    setTokenSelectorState({
      isOpen: true,
      onClose: () =>
        setTokenSelectorState((prev) => ({ ...prev, isOpen: false })),
      onSelectToken: handleSelectToken,
    });
  };

  const handleSelectToken = (token: CoinGeckoTokenType) => {
    setSelectedTokens((prev) => ({
      ...prev,
      unlockToken: {
        ...prev.unlockToken,
        [selectedBlockchain.id]: token,
      },
    }));
    setTokenSelectorState((prev) => ({ ...prev, isOpen: false }));
  };

  const { data: tokenDerivativeData } = useTokenDerivative({
    chain: selectedBlockchain,
    tokenAddressOrMint:
      selectedTokens.unlockToken[selectedBlockchain.id]?.address ?? "",
  });

  const { withConfirmation } = useTransactionDialog();

  const handleTokenApproval = async () => {
    if (!currentUser.loggedIn) {
      toast.error("Connect a wallet first.");
      return;
    }
    const tokenAddress =
      selectedTokens.unlockToken[selectedBlockchain.id]?.address;
    if (!tokenAddress) {
      toast.error("Select a token and try again.");
      return;
    }
    if (!isValidFloat(amount)) {
      toast.error("Invalid input.");
      return;
    }
    let parsedAmount = parseFloat(amount);
    if (parsedAmount == 0 || parsedAmount < 0) {
      toast.error("Invalid Amount Input");
      return;
    }
    const decimals =
      selectedTokens.unlockToken[selectedBlockchain.id]?.decimals;
    let approvalAmount = parsedAmount;
    if (!decimals) {
      toast.error(
        "Token decimals not found, toggle to use raw values instead.",
      );
      return;
    }
    approvalAmount = parsedAmount * 10 ** decimals;
    const twosideContract =
      selectedBlockchain.id == "eth"
        ? envVariables.twosideContract.eth
        : envVariables.twosideContract.base;
    if (twosideContract == "") {
      toast.error(
        `${selectedBlockchain.name} Twoside contract address not set.`,
      );
      return;
    }
    const derivativeAddress = tokenDerivativeData;
    if (!derivativeAddress) {
      toast.error("Derivative address not found, try again.");
      return;
    }
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: derivativeAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [twosideContract, approvalAmount],
          chainId: selectedBlockchain.chainId
        });
        toast.success("Signature", {
          description: `${sig}`,
        });
      },
      {
        title: "Approve Tokens?",
        description: `Do you want to approve ${amount}
        Liquid ${selectedTokens.unlockToken[selectedBlockchain.id]?.name.toString()}?`,
        successMessage: "Your tokens have been approved successfully.",
        loadingTitle: "Processing Transaction",
        loadingDescription: `Please wait while your transaction is confirmed on ${selectedBlockchain.name}...`,
      },
    );
  };

  const handleUnlockTokens = async () => {
    if (!currentUser.loggedIn) {
      toast.error("Connect a wallet first.");
      return;
    }
    const tokenAddress =
      selectedTokens.unlockToken[selectedBlockchain.id]?.address;
    if (!tokenAddress) {
      toast.error("Select a token and try again.");
      return;
    }
    if (!isValidFloat(amount)) {
      toast.error("Invalid input.");
      return;
    }
    let parsedAmount = parseFloat(amount);
    if (parsedAmount == 0 || parsedAmount < 0) {
      toast.error("Invalid Amount Input");
      return;
    }
    const decimals =
      selectedTokens.unlockToken[selectedBlockchain.id]?.decimals;
    let unlockAmount = parsedAmount;
    if (!decimals) {
      toast.error(
        "Token decimals not found, toggle to use raw values instead.",
      );
      return;
    }
    unlockAmount = parsedAmount * 10 ** decimals;
    const twosideContract =
      selectedBlockchain.id == "eth"
        ? envVariables.twosideContract.eth
        : envVariables.twosideContract.base;
    if (twosideContract == "") {
      toast.error(
        `${selectedBlockchain.name} Twoside contract address not set.`,
      );
      return;
    }
    const derivativeAddress = tokenDerivativeData;
    if (!derivativeAddress) {
      toast.error("Derivative address not found, try again.");
      return;
    }
    await withConfirmation(
      async () => {
        const sig = await writeContractAsync({
          address: twosideContract as `0x${string}`,
          abi: twosideAbi.abi,
          functionName: "unlock",
          args: [tokenAddress, unlockAmount],
          chainId: selectedBlockchain.chainId
        });
        toast.success("Signature", {
          description: `${sig}`,
        });
      },
      {
        title: "Unlock Tokens?",
        description: `Do you want to unlock ${amount}
        ${selectedTokens.unlockToken[selectedBlockchain.id]?.name.toString()}?`,
        successMessage: "Your tokens have been unlocked successfully.",
        loadingTitle: "Processing Transaction",
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
                <span>
                  <ImageWithFallback
                    height={38}
                    width={38}
                    src={
                      unlockToken.logoURI
                        ? unlockToken.logoURI
                        : placeholders.tokenImage
                    }
                    alt={
                      unlockToken ? unlockToken.name : placeholders.tokenName
                    }
                    fallbackSrc={placeholders.tokenImage}
                    // Add key to force re-render when token changes
                    key={unlockToken?.address || "placeholder"}
                  />
                </span>
                <span className="flex flex-col items-start">
                  <span className="flex flex-row">
                    <span className="text-xl font-bold text-left text-custom-primary-text">
                      {unlockToken
                        ? unlockToken.symbol
                        : placeholders.tokenSymbol}
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
          {unlockToken ? unlockToken.name : "N/A"}
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
              <span>
                <ImageWithFallback
                  height={48}
                  width={48}
                  src={
                    unlockToken?.logoURI
                      ? unlockToken.logoURI
                      : placeholders.tokenImage
                  }
                  alt={unlockToken ? unlockToken.name : placeholders.tokenName}
                  fallbackSrc={placeholders.tokenImage}
                  // Add key to force re-render when token changes
                  key={unlockToken?.address || "placeholder"}
                />
              </span>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-sm font-bold text-left text-custom-primary-text">
                    {unlockToken
                      ? "li" + unlockToken.symbol
                      : "li" + placeholders.tokenSymbol}
                  </span>
                </span>
              </span>
            </div>
            <div className="flex flex-col items-center">
              1:1
              <ArrowRightLeft className="h-8 w-8" />
            </div>
            <div className="flex flex-col items-center">
              <span>
                <ImageWithFallback
                  height={48}
                  width={48}
                  src={
                    unlockToken?.logoURI
                      ? unlockToken.logoURI
                      : placeholders.tokenImage
                  }
                  alt={unlockToken ? unlockToken.name : placeholders.tokenName}
                  fallbackSrc={placeholders.tokenImage}
                  // Add key to force re-render when token changes
                  key={unlockToken?.address || "placeholder"}
                />
              </span>
              <span className="flex flex-col items-start">
                <span className="flex flex-row">
                  <span className="text-sm font-bold text-left text-custom-primary-text">
                    {unlockToken
                      ? unlockToken.symbol
                      : placeholders.tokenSymbol}
                  </span>
                </span>
              </span>
            </div>
          </div>
          <div className="text-muted-foreground text-sm px-6 pb-4">
            Lock your{" "}
            {unlockToken ? unlockToken.symbol : placeholders.tokenSymbol} or any
            token and receive li
            {unlockToken ? unlockToken.symbol : placeholders.tokenSymbol}/liquid
            locked tokens that represent your locked position. Use li
            {unlockToken ? unlockToken.symbol : placeholders.tokenSymbol} in
            other DeFi protocols while earning rewards. Burn your liquid locked
            tokens to unlock your original tokens. No lock-up period required.
          </div>
        </CollapsibleContent>
      </Collapsible>
      {selectedTokens.unlockToken[selectedBlockchain.id] && (
        <TokenInfo token={selectedTokens.unlockToken[selectedBlockchain.id]} />
      )}
      <Card
        className="w-full md:w-112 rounded-2xl text-custom-primary-text mt-2 bg-transparent shadow-none
      border border-custom-primary-color/30"
      >
        <CardContent className="px-4">
          {
            <div>
              {unlockToken
                ? `1 li${unlockToken.symbol} = 1 ${unlockToken.symbol}`
                : "1 Liquid Locked Token = 1 Original Token"}
            </div>
          }
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
        onClick={handleUnlockTokens}
      >
        <Unlock /> Unlock Tokens
      </ThemedButton>
    </div>
  );
}
