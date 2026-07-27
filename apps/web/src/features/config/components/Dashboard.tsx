'use client';
import { AnimatePresence, motion } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Coins, BarChart3, Link2 } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { selectedBlockchainAtom } from '@/store/global';
import { useState } from 'react';
import WhitelistPanel from './WhitelistPanel';
import StableCoinsPanel from './StableCoinsPanel';
import TokenPoolsPanel from './TokenPoolsPanel';
import DataFeedsPanel from './DataFeedsPanel';

const tabs = [
  { value: 'whitelist', label: 'Whitelist', icon: Database },
  { value: 'stable', label: 'Stable Coins', icon: Coins },
  { value: 'pools', label: 'Token Pools', icon: Link2 },
  { value: 'feeds', label: 'Data Feeds', icon: BarChart3 },
];

export default function ConfigDashboard() {
  const chain = useAtomValue(selectedBlockchainAtom);
  const [activeTab, setActiveTab] = useState('whitelist');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="w-full bg-transparent flex justify-start items-center border-b-2 border-gray-200 rounded-none pb-1 mb-6 gap-1 overflow-x-auto no-scrollbar">
        {tabs.map(({ value, label, icon: Icon }) => (
          <TabsTrigger
            key={value}
            value={value}
            className="bg-transparent border-0 shadow-none data-[state=active]:bg-transparent cursor-pointer
              data-[state=active]:shadow-none text-sm font-semibold text-gray-400 data-[state=active]:text-black relative
              rounded-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute
              data-[state=active]:after:bottom-[-4px] data-[state=active]:after:left-0
              data-[state=active]:after:right-0 data-[state=active]:after:h-0.5
              data-[state=active]:after:bg-black transition-colors hover:text-gray-600 flex items-center gap-1.5 px-3 whitespace-nowrap"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <AnimatePresence mode="wait">
        <TabsContent key="whitelist" value="whitelist" className="mt-0">
          <motion.div
            key="whitelist"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <WhitelistPanel />
          </motion.div>
        </TabsContent>

        <TabsContent key="stable" value="stable" className="mt-0">
          <motion.div
            key="stable"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <StableCoinsPanel />
          </motion.div>
        </TabsContent>

        <TabsContent key="pools" value="pools" className="mt-0">
          <motion.div
            key="pools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <TokenPoolsPanel />
          </motion.div>
        </TabsContent>

        <TabsContent key="feeds" value="feeds" className="mt-0">
          <motion.div
            key="feeds"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DataFeedsPanel />
          </motion.div>
        </TabsContent>
      </AnimatePresence>
    </Tabs>
  );
}
