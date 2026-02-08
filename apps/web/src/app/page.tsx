"use client";
import React, { useEffect } from "react";
import Dashboard from "@/features/dashboard/components/Dashboard";
import { useAtomValue } from "jotai";
import { TokenSelector } from "@/features/dashboard/components/TokenSelector";
import { tokenSelectorAtom } from "@/store/global";

export default function DashboardPage() {
  const tokenSelectorStateValue = useAtomValue(tokenSelectorAtom);
  useEffect(() => {
    if (tokenSelectorStateValue.isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [tokenSelectorStateValue]);

  return (
    <>
      <div className="container mx-auto min-h-screen flex items-center z-10">
        <Dashboard />
        <TokenSelector
          isOpen={tokenSelectorStateValue.isOpen}
          onClose={tokenSelectorStateValue.onClose}
          onSelectToken={tokenSelectorStateValue.onSelectToken}
        />
      </div>
    </>
  );
}
