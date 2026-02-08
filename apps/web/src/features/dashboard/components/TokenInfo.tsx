import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CoinGeckoTokenType } from "@/types/global";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  BadgeDollarSign,
} from "lucide-react";
import { useState } from "react";
import { useTokenDerivative } from "../hooks/query/contract";
import { selectedBlockchainAtom } from "@/store/global";
import { useAtomValue } from "jotai";

export default function TokenInfo({
  token,
}: {
  token: CoinGeckoTokenType | null;
}) {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const { data: tokenDerivativeData, isLoading } = useTokenDerivative({
    chain: selectedBlockchain,
    tokenAddressOrMint: token?.address ?? "",
  });

  const InfoRow = ({
    label,
    value,
    copyable = false,
    fieldName = "",
  }: {
    label: string;
    value: string | undefined;
    copyable?: boolean;
    fieldName?: string;
  }) => (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 min-w-fit">
        {label}
      </span>
      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm text-gray-900 break-all text-right">
          {value
            ? label == "Address"
              ? truncateAddress(value)
              : value
            : "N/A"}
        </span>
        {copyable && (
          <button
            onClick={() => copyToClipboard(value || "", fieldName)}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
            title="Copy to clipboard"
          >
            {copiedField === fieldName ? (
              <Check className="h-3.5 w-3.5 text-green-600" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Collapsible className="w-full md:w-112 mt-2 rounded-2xl border border-custom-primary-color/30 text-custom-primary-text">
        <CollapsibleTrigger className="w-full py-2 px-4 flex justify-between">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4" />
            <span>Loading...</span>
          </div>
        </CollapsibleTrigger>

        {isCollapsibleOpen && <CollapsibleContent>{null}</CollapsibleContent>}
      </Collapsible>
    );
  }

  if (!tokenDerivativeData) {
    return (
      <Collapsible className="w-full md:w-112 mt-2 rounded-2xl border border-custom-primary-color/30 text-custom-primary-text">
        <CollapsibleTrigger className="w-full py-2 px-4 flex justify-between">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4" />
            <span>Derivative Token Info: N/A</span>
          </div>
        </CollapsibleTrigger>

        {isCollapsibleOpen && <CollapsibleContent>{null}</CollapsibleContent>}
      </Collapsible>
    );
  }

  if (tokenDerivativeData == "0x0000000000000000000000000000000000000000") {
    return (
      <Collapsible className="w-full md:w-112 mt-2 rounded-2xl border border-custom-primary-color/30 text-custom-primary-text">
        <CollapsibleTrigger className="w-full py-2 px-4 flex justify-between">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-4 w-4" />
            <span>Derivative Token Info: Not Deployed Yet</span>
          </div>
        </CollapsibleTrigger>

        {isCollapsibleOpen && <CollapsibleContent>{null}</CollapsibleContent>}
      </Collapsible>
    );
  }

  return (
    <Collapsible className="w-full md:w-112 mt-2 rounded-2xl border border-custom-primary-color/30 text-custom-primary-text">
      <CollapsibleTrigger
        onClick={() => setIsCollapsibleOpen((val) => !val)}
        className="w-full py-2 px-4 flex justify-between cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-4 w-4" />
          <span>Derivative Token Info</span>
        </div>
        <div className="flex items-center">
          {isCollapsibleOpen ? (
            <ChevronDown className="text-custom-muted-text" />
          ) : (
            <ChevronRight className="text-custom-muted-text" />
          )}
        </div>
      </CollapsibleTrigger>

      {isCollapsibleOpen && (
        <CollapsibleContent>
          <div className="p-5">
            {/* Token Details */}
            <div className="space-y-0">
              <InfoRow label="Name" value={`Liquid ${token?.name}`} />
              <InfoRow label="Symbol" value={`li${token?.symbol}`} />
              <InfoRow label="Decimals" value={token?.decimals.toString()} />
              <InfoRow
                label="Address"
                value={tokenDerivativeData}
                copyable={true}
                fieldName="address"
              />
            </div>

            {/* Full Address Display (Mobile Friendly) */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Full Address</p>
              <p className="text-xs text-gray-700 break-all">
                {tokenDerivativeData}
              </p>
            </div>
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
