import React from "react";
import { Twitter } from "lucide-react";
import { typography } from "@/styles/typography";
import { motion } from "motion/react";
import { Separator } from "./ui/separator";

export const Footer: React.FC = () => {
  return (
    <div className="pt-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="bg-custom-primary-color text-custom-secondary-color
        rounded-t-4xl"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 md:flex md:justify-between lg:grid-cols-4 gap-8">
            {/* Logo and description */}
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                <span className={typography.h1}>TWOSIDE</span>
              </div>
              <p className="mb-6">
                Twoside transforms any coin into tradeable derivatives. Lock
                tokens, mint liquid locked tokens at 1:1, and unlock new DeFi
                opportunities without selling your holdings.
              </p>
              <Separator className="text-white mb-6" />
              <div className="flex space-x-4">
                <a
                  href="https://x.com/TwosideFinance"
                  target="_blank"
                  className="hover:text-white text-gray-400 transition-colors duration-200"
                >
                  <Twitter size={20} className="text-custom-secondary-color" />
                </a>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="mb-4 md:mb-0">
              © 2025 Twoside. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
