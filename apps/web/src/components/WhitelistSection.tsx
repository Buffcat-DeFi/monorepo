"use client";
import { motion } from "motion/react";
import { Check, X, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const actions = ["Lock", "Unlock", "Claim"] as const;

// true = allowed, false = blocked
const whitelistedState: Record<(typeof actions)[number], boolean> = {
  Lock: true,
  Unlock: true,
  Claim: true,
};

const blacklistedState: Record<(typeof actions)[number], boolean> = {
  Lock: false,
  Unlock: true,
  Claim: false,
};

export const WhitelistSection = () => {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-8 lg:px-10 lg:py-8">
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative mx-auto max-w-[1400px]">
        {/* Header — same style as HowItWorks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-12 max-w-[850px] text-center sm:mb-14 lg:mb-20"
        >
          <div
            className="mb-5 inline-flex max-w-full items-center gap-3 rounded-full border-2 border-custom-primary-color
            bg-custom-bg px-4 py-2.5 shadow-[4px_4px_0px_#000000] sm:px-5"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-[#19d67c] shadow-[0_0_12px_#19d67c]" />
            <span className="text-[10px] font-extrabold tracking-[0.16em] text-custom-primary-text sm:text-xs sm:tracking-[0.18em]">
              CURATED · PROTECTED · ON-CHAIN
            </span>
          </div>

          <h2
            className="mb-5 text-[40px] font-extrabold leading-[0.95] tracking-[-2px]
            text-custom-primary-text sm:text-[56px] sm:tracking-[-3px]
            md:text-[72px] lg:text-[92px] lg:tracking-[-5px]"
          >
            Only Vetted
            <br />
            <span className="crypto-orange-gradient bg-clip-text text-transparent">
              Tokens Get In.
            </span>
          </h2>

          <p className="mx-auto max-w-[720px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:text-lg lg:text-xl lg:leading-9">
            Status can change without notice — here's exactly what flips.
          </p>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Card
            className="relative overflow-hidden rounded-[24px] border-2 border-custom-primary-color
            bg-custom-bg p-6 shadow-[8px_8px_0px_#000000]
            sm:rounded-[28px] sm:p-8 lg:p-10"
          >
            {/* Subtle glow */}
            <div className="pointer-events-none absolute left-[-60px] top-[-60px] h-[200px] w-[200px] rounded-full bg-[#19d67c]/6 blur-3xl" />
            <div className="pointer-events-none absolute right-[-60px] bottom-[-60px] h-[200px] w-[200px] rounded-full bg-[#ff6b35]/6 blur-3xl" />

            <div className="relative flex flex-col items-center gap-4 lg:flex-row lg:gap-6">
              {/* ── WHITELISTED card ── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.25 }}
                className="w-full flex-1 rounded-[18px] border border-[#19d67c]/20 bg-[#19d67c]/8 p-6"
              >
                {/* Status icon */}
                <div className="mb-5 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#19d67c]/20 border border-[#19d67c]/30 shadow-[0_0_24px_#19d67c33]">
                    <Check className="h-7 w-7 text-[#19d67c]" strokeWidth={3} />
                  </div>
                </div>

                {/* Label */}
                <div className="mb-5 text-center text-[13px] font-extrabold tracking-[0.2em] text-custom-primary-text">
                  WHITELISTED
                </div>

                {/* Action rows */}
                <div className="space-y-2">
                  {actions.map((action) => (
                    <div
                      key={action}
                      className="flex items-center justify-between rounded-[10px]
                      border border-[#19d67c]/10 bg-[#19d67c]/5 px-4 py-3"
                    >
                      <span className="text-sm font-semibold text-custom-primary-text">
                        {action}
                      </span>
                      <Check className="h-4 w-4 text-[#19d67c]" strokeWidth={2.5} />
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── Arrow + label ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: 0.38 }}
                className="flex shrink-0 flex-row items-center gap-3 lg:flex-col"
              >
                <span className="text-[9px] font-extrabold tracking-[0.2em] text-muted-foreground lg:text-[10px]">
                  BLACKLIST EVENT
                </span>
                <ArrowRight className="h-5 w-5 text-muted-foreground lg:rotate-0 rotate-0" />
              </motion.div>

              {/* ── BLACKLISTED card ── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.3 }}
                className="w-full flex-1 rounded-[18px] border border-[#ff6b35]/20 bg-[#ff6b35]/8 p-6"
              >
                {/* Status icon */}
                <div className="mb-5 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ff6b35]/20 border border-[#ff6b35]/30 shadow-[0_0_24px_#ff6b3533]">
                    <X className="h-7 w-7 text-[#ff6b35]" strokeWidth={3} />
                  </div>
                </div>

                {/* Label */}
                <div className="mb-5 text-center text-[13px] font-extrabold tracking-[0.2em] text-custom-primary-text">
                  BLACKLISTED
                </div>

                {/* Action rows */}
                <div className="space-y-2">
                  {actions.map((action) => {
                    const allowed = blacklistedState[action];
                    return (
                      <div
                        key={action}
                        className="flex items-center justify-between rounded-[10px]
                        border border-[#ff6b35]/10 bg-[#ff6b35]/5 px-4 py-3"
                      >
                        <span className="text-sm font-semibold text-custom-primary-text">
                          {action}
                        </span>
                        {allowed ? (
                          <Check className="h-4 w-4 text-[#19d67c]" strokeWidth={2.5} />
                        ) : (
                          <X className="h-4 w-4 text-[#ff6b35]" strokeWidth={2.5} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
