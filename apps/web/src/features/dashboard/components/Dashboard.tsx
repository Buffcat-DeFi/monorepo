import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LockPanel from "./LockPanel";
import UnlockPanel from "./UnlockPanel";
import { useState } from "react";
import { motion } from "motion/react";
import { HowItWorks } from "@/components/HowItWorks";
import { UseCases } from "@/components/UseCases";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("Lock");

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
        className="mx-auto mt-6 mb-12 w-full md:w-120 min-h-119 rounded-2xl p-4
    bg-custom-root-bg border-2 border-custom-primary-color custom-box-shadow"
      >
        <Tabs
          defaultValue="Lock"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="w-full bg-transparent flex justify-between border-b-2 border-gray-200 rounded-none">
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
            </div>
          </TabsList>
          <div className="px-4">
            <TabsContent key="Lock" value="Lock">
              <LockPanel />
            </TabsContent>
            <TabsContent key="Unlock" value="Unlock">
              <UnlockPanel />
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
        Twoside transforms any coin into tradeable derivatives. Lock tokens,
        mint liquid locked tokens at 1:1, and unlock new DeFi opportunities
        without selling your holdings.
      </motion.p>
      <HowItWorks />
      <UseCases />
    </div>
  );
}
