"use client";
import React from "react";
import Image from "next/image";
import { motion } from "motion/react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-custom-secondary-color">
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          height={192}
          width={192}
          src={"/twoside-bold.png"}
          alt="Twoside Logo"
        />
      </motion.div>
    </div>
  );
}
