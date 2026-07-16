import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LockPanel from './LockPanel';
import UnlockPanel from './UnlockPanel';
import { useState, useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  selectedLockAtom,
  currentUserAtom,
  selectedBlockchainAtom,
  userLocks,
} from '@/store/global';
import { motion } from 'motion/react';
import { HowItWorks } from '@/components/HowItWorks';
import { UseCases } from '@/components/UseCases';
import ClaimRewardsPanel from './ClaimRewardsPanel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocks } from '@/features/dashboard/hooks/query/contract';
import { useTokenMetadata, useERCMetadata } from '@/features/dashboard/hooks/query/tokens';
import { ethers } from 'ethers';
import { Blockchain } from '@/types/global';
import React from 'react';
import { Loading } from '@/components/Loading';
import { CircleQuestionMark } from 'lucide-react';

const LockDropdownItem = React.forwardRef<
  React.ElementRef<typeof SelectItem>,
  React.ComponentPropsWithoutRef<typeof SelectItem> & { lock: any; chain: Blockchain }
>(({ lock, chain, ...props }, ref) => {
  const {
    data: metadata,
    isLoading: metadataLoading,
    isError: metadataError,
  } = useTokenMetadata(chain, lock.lockedToken);

  const isMetadataUnavailable = metadataLoading || metadataError || !metadata?.data;

  const { data: ercMetadata } = useERCMetadata(chain, lock.lockedToken, {
    enabled: !!isMetadataUnavailable,
  });

  const symbol =
    !isMetadataUnavailable && metadata?.data?.attributes?.symbol
      ? metadata.data.attributes.symbol
      : ercMetadata?.symbol || `${lock.lockedToken.slice(0, 6)}...${lock.lockedToken.slice(-4)}`;

  const decimals =
    !isMetadataUnavailable && metadata?.data?.attributes?.decimals
      ? metadata.data.attributes.decimals
      : ercMetadata?.decimals || 18;
  const logoUrl = metadata?.data?.attributes?.image_url;

  const logo =
    !isMetadataUnavailable && logoUrl ? (
      <img src={logoUrl} alt={symbol} className="w-4 h-4 object-contain rounded-full" />
    ) : (
      <CircleQuestionMark className="w-4 h-4 text-gray-400" />
    );

  const amount = ethers.formatUnits(lock.amount, decimals);
  const withdrawn = ethers.formatUnits(lock.withdrawn, decimals);
  const formattedAmount = (parseFloat(amount) - parseFloat(withdrawn)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });

  return (
    <SelectItem ref={ref as any} {...props}>
      <div className="flex items-center gap-2">
        {logo}
        <span className="font-semibold text-gray-900 dark:text-gray-100">{symbol}</span>
        <span className="text-gray-500 text-[10px] dark:text-gray-400 font-medium">
          ({formattedAmount})
        </span>
      </div>
    </SelectItem>
  );
});
LockDropdownItem.displayName = 'LockDropdownItem';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Lock');
  const [selectedLock, setSelectedLock] = useAtom(selectedLockAtom);
  const currentUser = useAtomValue(currentUserAtom);
  const selectedBlockchain = useAtomValue(selectedBlockchainAtom);
  const [userLocksValue, setUserLocksValue] = useAtom(userLocks);

  const { data: locksResponse, isLoading: locksLoading } = useLocks(
    selectedBlockchain,
    currentUser.address,
    {
      enabled: !!currentUser.loggedIn,
    },
  );

  useEffect(() => {
    if (currentUser.loggedIn && locksResponse) {
      setUserLocksValue(locksResponse?.data || []);
    }
  }, [currentUser, locksResponse]);

  useEffect(() => {
    if (
      userLocksValue.length > 0 &&
      (!selectedLock || parseInt(selectedLock) >= userLocksValue.length)
    ) {
      setSelectedLock('0');
    } else if (userLocksValue.length === 0 && selectedLock !== '') {
      setSelectedLock('');
    }
  }, [userLocksValue.length, selectedLock, setSelectedLock]);

  return (
    <div className="min-h-screen mx-auto">
      <motion.h1
        id="title"
        className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6
              leading-tight text-center mx-auto mt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        Yield Without
        <br />
        <span className="crypto-orange-gradient">Impermanent Loss</span>
      </motion.h1>
      <section
        className="mx-auto mt-6 mb-12 w-full md:w-130 rounded-2xl p-4
    bg-custom-bg border-2 border-custom-primary-color custom-box-shadow"
      >
        <Tabs defaultValue="Lock" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="w-full bg-transparent flex justify-between items-center border-b-2 border-gray-200 rounded-none pb-1">
            <div>
              <TabsTrigger
                key="Lock"
                value="Lock"
                className={`bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
            data-[state=active]:shadow-none text-base font-semibold text-gray-400 data-[state=active]:text-black relative
            rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-4px]
            data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black
            transition-colors hover:text-gray-600`}
              >
                Lock
              </TabsTrigger>
              <TabsTrigger
                key="Unlock"
                value="Unlock"
                className={`bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
            data-[state=active]:shadow-none text-base font-semibold text-gray-400 data-[state=active]:text-black relative
            rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-4px]
            data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black
            transition-colors hover:text-gray-600`}
              >
                Unlock
              </TabsTrigger>
              <TabsTrigger
                key="ClaimRewards"
                value="ClaimRewards"
                className={`bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
            data-[state=active]:shadow-none text-base font-semibold text-gray-400 data-[state=active]:text-black relative
            rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-4px]
            data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black
            transition-colors hover:text-gray-600`}
              >
                Claim Rewards
              </TabsTrigger>
            </div>
            {activeTab === 'ClaimRewards' && (
              <div className="flex items-center gap-2 mb-1">
                <Select value={selectedLock || undefined} onValueChange={setSelectedLock}>
                  <SelectTrigger
                    className="h-8 text-xs border-0 bg-white/50 cursor-pointer
                    backdrop-blur-sm dark:bg-black/50 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus:ring-0"
                  >
                    <SelectValue placeholder="Select Lock" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800">
                    {locksLoading ? (
                      <div className="flex justify-center p-2">
                        <Loading size="sm" type="spinner" />
                      </div>
                    ) : userLocksValue.length > 0 ? (
                      userLocksValue.map((lock, index) => (
                        <LockDropdownItem
                          key={index.toString()}
                          value={index.toString()}
                          lock={lock}
                          chain={selectedBlockchain}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800"
                        />
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500 text-center">No Locks Found</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsList>

          <div className="px-4">
            <TabsContent key="Lock" value="Lock">
              <LockPanel />
            </TabsContent>
            <TabsContent key="Unlock" value="Unlock">
              <UnlockPanel />
            </TabsContent>
            <TabsContent key="ClaimRewards" value="ClaimRewards">
              <ClaimRewardsPanel />
            </TabsContent>
          </div>
        </Tabs>
      </section>
      <motion.p
        className="text-lg md:text-md text-muted-foreground mb-8
                    lg:mx-0 text-center w-full mx-auto md:px-40 lg:px-80"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        Buffcat transforms any coin into tradeable derivatives. Lock tokens, mint liquid locked
        tokens at 1:1, and unlock new DeFi opportunities without selling your holdings.
      </motion.p>
      <HowItWorks />
      <UseCases />
    </div>
  );
}
