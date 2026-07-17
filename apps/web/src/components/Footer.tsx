"use client";

import {
  ArrowUpRight,
  FileCheck2,
  FileText,
  Mail,
  Twitter,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import Image from "next/image";

const footerLinks = [
  {
    label: "X / Twitter",
    href: "https://x.com/TwosideFinance",
    icon: Twitter,
  },
  {
    label: "Email",
    href: "mailto:twosidefinance@gmail.com",
    icon: Mail,
  },
  {
    label: "Audit Report",
    href: "/files/audit.pdf",
    icon: FileCheck2,
  },
  {
    label: "Litepaper",
    href: "/files/litepaper.pdf",
    icon: FileText,
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden px-4 pb-6 pt-10 sm:px-6 sm:pb-8 sm:pt-12 md:px-8 md:pb-10 md:pt-14 lg:px-16 lg:pb-10 lg:pt-16">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <Card className="relative overflow-hidden rounded-[24px] border-[3px] border-[#1f1f1f] bg-[#181818] p-5 text-custom-tertiary-text shadow-[8px_8px_0px_#0f0f0f] sm:rounded-[28px] sm:p-7 md:p-8 lg:rounded-[34px] lg:p-12 lg:shadow-[10px_10px_0px_#0f0f0f]">
        <div className="absolute right-[-140px] top-[-140px] h-[220px] w-[220px] rounded-full bg-[#44d7ff]/10 blur-3xl sm:h-[260px] sm:w-[260px] lg:h-[280px] lg:w-[280px]" />

        <div className="relative">
          <div className="grid gap-8 md:gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:gap-14">
            <div>
              <div className="mb-5 inline-flex max-w-full items-center gap-3 rounded-full border-2 border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm">
                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#36c4ff] shadow-[0_0_12px_#36c4ff]" />

                <span className="text-[10px] font-extrabold tracking-[0.18em] text-custom-tertiary-text sm:text-xs sm:tracking-[0.2em]">
                  ON-CHAIN TRANSPARENCY
                </span>
              </div>

              <h2 className="mb-4 text-[34px] font-extrabold leading-[0.95] tracking-[-1px] text-custom-tertiary-text sm:text-[44px] sm:tracking-[-2px] md:text-[56px] lg:text-[72px] lg:tracking-[-4px]">
                TWOSIDE
              </h2>

              <p className="max-w-[900px] text-sm font-medium leading-7 text-custom-tertiary-text/70 sm:text-base sm:leading-8 md:max-w-[760px] lg:text-[20px] lg:leading-9">
                Twoside transforms any coin into tradeable derivatives. Lock
                tokens, mint liquid locked tokens at 1:1, and unlock new DeFi
                opportunities without selling your holdings.
              </p>
            </div>

            <div className="flex flex-col justify-between gap-6 lg:gap-8">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-[10px] w-[10px] shrink-0 rounded-full bg-[#19d67c] shadow-[0_0_14px_#19d67c]" />

                  <span className="text-sm font-extrabold tracking-wide text-custom-tertiary-text/80">
                    VERIFIED RESOURCES
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {footerLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex min-h-[72px] items-center justify-between gap-3 rounded-[20px] border-2 border-white/10 bg-white/5 px-4 py-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#44d7ff]/40 hover:bg-white/[0.08] sm:px-4 sm:py-4"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-white/10 bg-black/20 sm:h-11 sm:w-11">
                            <Icon className="h-4 w-4 text-custom-tertiary-text sm:h-5 sm:w-5" />
                          </div>

                          <span className="truncate text-sm font-bold text-custom-tertiary-text sm:text-[15px]">
                            {link.label}
                          </span>
                        </div>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 sm:h-9 sm:w-9">
                          <ArrowUpRight className="h-3.5 w-3.5 text-custom-tertiary-text sm:h-4 sm:w-4" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-10 sm:w-10">
                    <Image
                      height={40}
                      width={40}
                      src="/favicon-96x96.png"
                      alt="Twoside Logo"
                      className="rounded-full"
                    />
                  </div>

                  <div>
                    <div className="text-sm font-extrabold tracking-wide text-custom-tertiary-text">
                      TWOSIDE
                    </div>

                    <div className="text-[11px] text-custom-tertiary-text/50 sm:text-xs">
                      Built in public.
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-medium tracking-wide text-custom-tertiary-text/50 sm:text-sm">
                  © 2025 Twoside. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </footer>
  );
}
