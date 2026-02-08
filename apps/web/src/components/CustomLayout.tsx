"use client";
import React, { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { wagmiConfig } from "@/features/wallet/config/wagmiConfig";
import { Toaster } from "./ui/sonner";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { DialogProvider } from "./Dialog";
import { TooltipProvider } from "./ui/tooltip";

export function CustomLayout({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        console.log("Something went wrong!");
        console.log(`More Details: ${error.message}`);
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        console.log("Something went wrong!");
        console.log(`More Details: ${error.message}`);
      },
    }),
  });

  return (
    <DialogProvider>
      <TooltipProvider>
        <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>
            <Header />
            {children}
            <Footer />
            <Toaster position="bottom-right" richColors />
          </QueryClientProvider>
        </WagmiProvider>
      </TooltipProvider>
    </DialogProvider>
  );
}
