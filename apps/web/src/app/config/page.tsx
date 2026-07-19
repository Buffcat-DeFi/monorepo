'use client';

import { motion } from 'motion/react';
import { Settings } from 'lucide-react';
import ConfigDashboard from '@/features/config/components/Dashboard';

export default function ConfigPage() {
  return (
    <div className="min-h-screen mx-auto px-4 pb-20">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <motion.div
        className="text-center mt-8 mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="inline-flex items-center gap-3 rounded-full border-2 border-custom-primary-color bg-custom-bg px-4 py-2.5 shadow-[4px_4px_0px_#000000] mb-5">
          <Settings className="w-4 h-4" />
          <span className="text-[10px] font-extrabold tracking-[0.16em] text-custom-primary-text sm:text-xs sm:tracking-[0.18em]">
            CONTRACT CONFIGURATION
          </span>
        </div>
        <motion.h1
          id="title"
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6
                leading-tight text-center mx-auto mt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          Buffcat <span className="crypto-orange-gradient">Config</span>
        </motion.h1>
        <p className="mt-4 text-base text-custom-muted-text max-w-xl mx-auto">
          Manage token whitelists, stable coins, Uniswap pool mappings, and Chainlink data feeds
          on-chain.
        </p>
      </motion.div>

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
      >
        <ConfigDashboard />
      </motion.div>
    </div>
  );
}
