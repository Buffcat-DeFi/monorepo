'use client';

import React from 'react';
import { typography } from '@/styles/typography';
import Link from 'next/link';
import { Menu, Settings, LayoutDashboard } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { blockchains } from '@/constants/blockchains';
import { selectedBlockchainAtom } from '@/store/global';
import { useAtom } from 'jotai';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { UserWallet } from '@/features/wallet/components/UserWallet';

const BlockchainSelector = () => {
  const [selectedBlockchain, setSelectedBlockchain] = useAtom(selectedBlockchainAtom);

  return (
    <Select
      value={selectedBlockchain.id}
      onValueChange={(val: string) => {
        const sel = blockchains.find((b) => String(b.id) === val);
        if (sel) setSelectedBlockchain(sel);
      }}
      defaultValue={selectedBlockchain.id}
    >
      <SelectTrigger
        className="w-full lg:w-[180px] cursor-pointer shadow-none
                   border border-custom-primary-color rounded-2xl"
      >
        <SelectValue placeholder="Select a blockchain" />
      </SelectTrigger>
      <SelectContent className="bg-custom-bg">
        <SelectGroup>
          <SelectLabel>Blockchains</SelectLabel>
          {blockchains.map((b) => (
            <SelectItem key={b.id} value={String(b.id)} className="cursor-pointer">
              {b.name}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const isConfigPage = pathname === '/config';

  return (
    <>
      <div className="h-22 min-w-full px-12 flex items-center justify-between">
        <div className="flex items-center">
          <Image src="/twoside-bold.png" alt="Buffcat Logo" height={56} width={56} />
          <Link className="no-underline ms-2" href={'/'}>
            <span className={typography.h1}>BUFFCAT</span>
          </Link>
        </div>
        <div className="items-center gap-2 hidden lg:flex">
          {isConfigPage ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border border-custom-primary-color/30
                hover:border-custom-primary-color hover:bg-black/5 transition-all mr-1"
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
          ) : (
            <Link
              href="/config"
              className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border border-custom-primary-color/30
                hover:border-custom-primary-color hover:bg-black/5 transition-all mr-1"
            >
              <Settings className="w-3.5 h-3.5" /> Config
            </Link>
          )}
          <BlockchainSelector />
          <UserWallet />
        </div>
        <div className="lg:hidden block">
          <Sheet>
            <SheetTrigger>
              <Menu />
            </SheetTrigger>
            <SheetContent className="w-full">
              <SheetHeader>
                <SheetTitle className="text-left mb-6">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3">
                {isConfigPage ? (
                  <Link
                    href="/"
                    className="flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border border-custom-primary-color/30 hover:bg-black/5 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/config"
                    className="flex items-center justify-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border border-custom-primary-color/30 hover:bg-black/5 transition-all"
                  >
                    <Settings className="w-4 h-4" /> Config
                  </Link>
                )}
                <BlockchainSelector />
                <UserWallet />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
};
