"use client";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  FileSearch,
} from "lucide-react";
import { Card } from "@/components/ui/card";

const resources = [
  {
    title: "Source Code",
    description:
      "Explore smart contracts, review architecture decisions, and verify every protocol interaction directly from the repository.",
    href: "https://github.com/Twoside-DeFi-Protocol/monorepo",
    cta: "View Repository",
    icon: Code2,
  },
  {
    title: "Litepaper",
    description:
      "Understand Twoside mechanics, derivative minting, unlock flows, and the economic design powering the protocol.",
    href: "/files/litepaper.pdf",
    cta: "Read Litepaper",
    icon: BookOpen,
  },
  {
    title: "Security Audit",
    description:
      "Review independent security findings, vulnerability analysis, and recommendations from external auditors.",
    href: "/files/audit.pdf",
    cta: "Open Audit",
    icon: FileSearch,
  },
];

export default function TrustSection() {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-10 md:py-24 lg:px-16">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.22) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative mx-auto max-w-[1350px]">
        <div className="mb-8 md:mb-10">
          <div
            className="mb-5 inline-flex flex-wrap items-center gap-2 rounded-full px-5 py-2.5 backdrop-blur-sm
            border-2 border-custom-primary-color custom-box-shadow-lite bg-custom-bg"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-[#f5424b] shadow-[0_0_12px_#36c4ff]" />

            <span className="text-[11px] sm:text-sm font-extrabold tracking-wide text-custom-primary-text">
              FULLY TRANSPARENT PROTOCOL
            </span>
          </div>

          <h1
            className="mb-4 text-[40px] font-extrabold leading-[0.95] tracking-[-2px]
            text sm:text-[52px] sm:tracking-[-3px] md:text-[72px] lg:text-[92px]
            lg:tracking-[-4px] text-custom-primary-text sm:text-[72px] lg:text-[92px]"
          >
            Built In Public.
            <br />
            <span className="crypto-orange-gradient bg-clip-text text-transparent">
              Verified By Anyone.
            </span>
          </h1>

          <p className="max-w-[720px] leading-7 sm:text-lg md:text-xl md:leading-8 text-muted-foreground md:text-xl">
            Twoside is fully open-source, independently audited, and designed
            for transparent on-chain verification. No hidden mechanics. No black
            boxes.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr] lg:gap-7">
          <Card
            className="relative overflow-hidden rounded-[24px] sm:rounded-[28px] lg:rounded-[34px]
            border-2 border-custom-primary-color bg-custom-bg p-5 sm:p-7 lg:p-9 custom-box-shadow"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(68,215,255,0.08),rgba(76,125,255,0.02))]" />

            <div className="relative">
              <div className="mb-6 flex flex-col gap-4 lg:mb-7 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-[24px] font-extrabold tracking-[-1px] text sm:text-[28px] lg:text-[32px] text-custom-primary-text">
                  Protocol Resources
                </h2>

                <div
                  className="inline-flex w-fit items-center gap-3 rounded-full bg-custom-bg px-4 py-2.5
                  border-2 border-custom-primary-color custom-box-shadow-lite"
                >
                  <div className="h-[9px] w-[9px] rounded-full bg-[#19d67c] shadow-[0_0_12px_#19d67c]" />

                  <span className="text-[13px] font-extrabold tracking-wide text-custom-primary-text">
                    LIVE & VERIFIED
                  </span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:gap-5">
                {resources.map((resource) => {
                  const Icon = resource.icon;

                  return (
                    <a
                      key={resource.title}
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-[20px] sm:rounded-[24px] border-2 border-custom-primary-color
                      bg-custom-bg p-5 sm:p-[22px] transition-all duration-200 hover:-translate-x-1
                      hover:-translate-y-1 hover:shadow-[8px_8px_0px_#000000]"
                    >
                      <div className="absolute bottom-[-90px] right-[-90px] h-[180px] w-[180px] rounded-full bg-[#44d7ff]/10" />

                      <div className="relative">
                        <div
                          className="mb-5 flex h-[54px] w-[54px] sm:h-[62px] sm:w-[62px] items-center justify-center rounded-[18px]
                          border-2 border-custom-primary-color bg-custom-bg shadow-[4px_4px_0px_#000000]"
                        >
                          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-custom-primary-text" />
                        </div>

                        <h3 className="mb-3 text-[20px] font-extrabold sm:text-[24px] tracking-[-1px] text-custom-primary-text">
                          {resource.title}
                        </h3>

                        <p className="mb-5 text-sm leading-6 sm:text-[15px] sm:leading-7 text-muted-foreground">
                          {resource.description}
                        </p>

                        <div
                          className="flex items-center justify-between gap-3 border-t border-custom-secondary-color
                          pt-[18px] text-sm font-extrabold text-custom-primary-text"
                        >
                          <span>{resource.cta}</span>

                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full
                            border-2 border-custom-primary-color bg-custom-bg
                            transition-transform duration-200 group-hover:translate-x-1 group-hover:-translate-y-1"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-5 sm:gap-6">
            <Card
              className="rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] border-2 border-custom-primary-color
              bg-[#181818] p-5 sm:p-7 lg:p-[30px] text-custom-tertiary-text shadow-[10px_10px_0px_rgba(0,0,0,0.2)]"
            >
              <h2 className="mb-4 text-[28px] sm:text-[32px] lg:text-[34px] font-extrabold leading-none tracking-[-2px]">
                Trustless By Design.
              </h2>

              <p className="mb-6 text-sm leading-7 text-custom-tertiary-text/70 sm:text-base sm:leading-8">
                Every lock, mint, and unlock event can be verified on-chain.
                Twoside is built around transparency-first infrastructure.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] sm:rounded-[22px] border border-custom-secondary-color/10 bg-custom-secondary-color/5 p-[18px]">
                  <div className="mb-2 text-[13px] text-custom-tertiary-text/50">
                    CONTRACTS
                  </div>

                  <div className="text-[22px] font-extrabold sm:text-[26px]">
                    Open
                  </div>
                </div>

                <div className="min-w-[120px] flex-1 rounded-[22px] border border-custom-secondary-color/10 bg-custom-secondary-color/5 p-[18px]">
                  <div className="mb-2 text-[13px] text-custom-tertiary-text/50">
                    AUDIT STATUS
                  </div>

                  <div className="flex items-center gap-2 text-[22px] sm:text-[26px] font-extrabold">
                    <Check className="h-5 w-5 text-[#19d67c]" />
                    Passed
                  </div>
                </div>
              </div>
            </Card>

            <Card
              className="rounded-[32px] bg-custom-bg p-5 sm:p-6 backdrop-blur-sm
              border-2 border-custom-primary-color custom-box-shadow"
            >
              <h4 className="mb-5 text-lg font-extrabold text-custom-primary-text">
                Quick Verification
              </h4>

              <div className="space-y-3 sm:space-y-4">
                <a
                  href="https://etherscan.io/address/0xda0C7529D534D133E85AF10aDC050da29540dE4C"
                  target="_blank"
                  className="flex items-center justify-between rounded-[18px] border-2 border-custom-primary-color
                  bg-custom-bg px-4 py-3.5 sm:px-[18px] sm:py-4 font-extrabold text-custom-primary-text
                  transition-transform duration-200 hover:translate-x-1"
                >
                  <span>Etherscan</span>
                  <ChevronRight className="h-5 w-5" />
                </a>
                <a
                  href="https://basescan.org/address/0xdD28610425F663D87F2ee938E238A394388Ed401"
                  target="_blank"
                  className="flex items-center justify-between rounded-[18px] border-2 border-custom-primary-color
                  bg-custom-bg px-4 py-3.5 sm:px-[18px] sm:py-4 font-extrabold text-custom-primary-text
                  transition-transform duration-200 hover:translate-x-1"
                >
                  <span>Basescan</span>
                  <ChevronRight className="h-5 w-5" />
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
