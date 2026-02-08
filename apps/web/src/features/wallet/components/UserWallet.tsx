"use client";
import React from "react";
import dynamic from "next/dynamic";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

const WalletContent = dynamic(() => import("./WalletContent"), {
  ssr: false,
  loading: () => (
    <Button
      variant="outline"
      size="lg"
      className="cursor-none p-4 w-42 rounded-lg text-black"
      disabled
    >
      <Loader2Icon className="animate-spin text-black" />
      Please wait
    </Button>
  ),
});

export const UserWallet: React.FC = () => {
  return <WalletContent />;
};
