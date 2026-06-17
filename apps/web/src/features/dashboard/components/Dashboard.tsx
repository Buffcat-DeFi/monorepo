import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LockPanel from './LockPanel';
import UnlockPanel from './UnlockPanel';
import { useState } from 'react';
import { useAtom } from 'jotai';
import { selectedLockAtom } from '@/store/global';
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

const dummyLocks = [
  {
    id: '1',
    symbol: 'ETH',
    amount: '12.50',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    id: '2',
    symbol: 'wstETH',
    amount: '4.80',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    id: '3',
    symbol: 'rETH',
    amount: '35.00',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    id: '4',
    symbol: 'cbETH',
    amount: '8.25',
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Lock');
  const [selectedLock, setSelectedLock] = useAtom(selectedLockAtom);

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
        <span className="crypto-blue-gradient">Impermanent Loss</span>
      </motion.h1>
      <section
        className="mx-auto mt-6 mb-12 w-full md:w-120 rounded-2xl p-4
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
            <div className="flex items-center gap-2 mb-1">
              <Select value={selectedLock} onValueChange={setSelectedLock}>
                <SelectTrigger className="h-8 w-[140px] text-xs border-0 bg-white/50 backdrop-blur-sm dark:bg-black/50 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors focus:ring-0">
                  <SelectValue placeholder="Select Lock" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 dark:bg-neutral-900 dark:border-neutral-800">
                  {dummyLocks.map((lock) => (
                    <SelectItem
                      key={lock.id}
                      value={lock.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800"
                    >
                      <div className="flex items-center gap-2">
                        <img src={lock.logo} alt={lock.symbol} className="w-4 h-4 object-contain" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {lock.symbol}
                        </span>
                        <span className="text-gray-500 text-[10px] dark:text-gray-400 font-medium">
                          ({lock.amount})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
