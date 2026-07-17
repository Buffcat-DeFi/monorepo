"use client";
import { motion } from "motion/react";
import { ArrowRight, Coins, Lock, ShieldCheck, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01",
    title: "Lock Assets",
    description:
      "Deposit supported tokens into transparent, auditable smart contracts secured fully on-chain.",
    icon: Lock,
    accent: "bg-[#4c8dff]",
    glow: "bg-[#4c8dff]/10",
    text: "text-[#4c8dff]",
  },
  {
    number: "02",
    title: "Mint liTOKENS",
    description:
      "Receive liquid derivatives at a 1:1 ratio that can move freely across DeFi ecosystems.",
    icon: Coins,
    accent: "bg-[#ffcc33]",
    glow: "bg-[#ffcc33]/10",
    text: "text-[#ffcc33]",
  },
  {
    number: "03",
    title: "Trade Or Redeem",
    description:
      "Use derivatives in liquidity pools, lending markets, or redeem anytime for underlying assets.",
    icon: TrendingUp,
    accent: "bg-[#e71d36]",
    glow: "bg-[#e71d36]/10",
    text: "text-[#e71d36]",
  },
];

const stats = [
  {
    label: "Mint Ratio",
    value: "1 TOKEN = 1 liTOKEN",
  },
  {
    label: "Protocol Fee",
    value: "0.5%",
    valueClass: "text-[#e71d36]",
  },
  {
    label: "Unlock Time",
    value: "ANYTIME",
    valueClass: "crypto-orange-gradient bg-clip-text text-transparent",
  },
];

export const HowItWorks = () => {
  return (
    <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-20 md:px-8 lg:px-10 lg:py-28">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative mx-auto max-w-[1400px]">
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
              SIMPLE · TRANSPARENT · ON-CHAIN
            </span>
          </div>

          <h2
            className="mb-5 text-[40px] font-extrabold leading-[0.95] tracking-[-2px]
        text-custom-primary-text sm:text-[56px] sm:tracking-[-3px]
        md:text-[72px] lg:text-[92px] lg:tracking-[-5px]"
          >
            How Twoside
            <br />
            <span className="crypto-orange-gradient bg-clip-text text-transparent">
              Unlocks Liquidity.
            </span>
          </h2>

          <p className="mx-auto max-w-[720px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:text-lg lg:text-xl lg:leading-9">
            Convert locked positions into composable liquid derivatives without
            giving up exposure to your original assets.
          </p>
        </motion.div>

        <div className="relative">
          <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-custom-primary-color/10 md:block xl:hidden" />

          <div className="relative grid gap-6 md:grid-cols-3 md:gap-5 xl:gap-7">
            <div className="pointer-events-none absolute left-0 right-0 top-1/2 hidden -translate-y-1/2 xl:block">
              <div className="relative mx-auto flex max-w-[980px] items-center justify-between px-[170px]">
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="h-[3px] w-[240px] origin-left rounded-full bg-gradient-to-r from-[#44d7ff] to-[#4c7dff]"
                />

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="absolute left-[48%] flex h-14 w-14 items-center justify-center rounded-full border-2 border-custom-primary-color bg-custom-bg shadow-[6px_6px_0px_#000000]"
                >
                  <ArrowRight className="h-6 w-6 text-[#44d7ff]" />
                </motion.div>

                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="h-[3px] w-[240px] origin-left rounded-full bg-gradient-to-r from-[#4c7dff] to-[#e71d36]"
                />
              </div>
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.12 }}
                  className="relative"
                >
                  <Card
                    className="group relative h-full overflow-hidden rounded-[26px]
                border-2 border-custom-primary-color bg-custom-bg
                p-5 shadow-[8px_8px_0px_#000000] transition-all duration-200
                hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[12px_12px_0px_#000000]
                sm:rounded-[28px] sm:p-6 md:p-6 lg:p-8"
                  >
                    <div
                      className={`absolute right-[-70px] top-[-70px] h-[160px] w-[160px] rounded-full ${step.glow} blur-3xl sm:h-[180px] sm:w-[180px]`}
                    />

                    <div className="relative">
                      <div className="mb-6 flex items-start justify-between gap-4 sm:mb-8">
                        <div
                          className="flex h-[64px] w-[64px] items-center justify-center rounded-[20px]
                      border-2 border-custom-primary-color bg-custom-bg shadow-[6px_6px_0px_#000000]
                      sm:h-[72px] sm:w-[72px]"
                        >
                          <Icon
                            className={`h-7 w-7 sm:h-8 sm:w-8 ${step.text}`}
                          />
                        </div>

                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-custom-primary-color
                      text-base font-black text-custom-primary-text shadow-[4px_4px_0px_#000000] sm:h-14 sm:w-14 sm:text-lg ${step.accent}`}
                        >
                          {step.number}
                        </div>
                      </div>

                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${step.accent}`}
                        />

                        <div className="text-[10px] font-extrabold tracking-[0.18em] text-custom-muted-text sm:text-xs sm:tracking-[0.2em]">
                          STEP {step.number}
                        </div>
                      </div>

                      <h3 className="mb-4 text-[26px] font-extrabold leading-tight tracking-[-1.5px] text-custom-primary-text sm:text-[30px] lg:text-[36px]">
                        {step.title}
                      </h3>

                      <p className="mb-7 text-sm leading-7 text-muted-foreground sm:mb-8 sm:text-base sm:leading-8">
                        {step.description}
                      </p>

                      {/*<div
                        className="flex items-center justify-between gap-3 rounded-[20px] border-2 border-custom-primary-color
                        bg-black px-4 py-4 text-custom-tertiary-text sm:rounded-[22px] sm:px-5"
                      >
                        <div>
                          <div className="mb-1 text-[10px] font-bold tracking-[0.18em] text-custom-tertiary-text/40 sm:text-[11px]">
                            TWOSIDE FLOW
                          </div>

                          <div className="text-sm font-extrabold sm:text-base">
                            Secured & Auditable
                          </div>
                        </div>

                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 transition-transform duration-200 group-hover:translate-x-1 sm:h-11 sm:w-11">
                          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                      </div>*/}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 sm:mt-12 lg:mt-14"
        >
          <Card
            className="relative overflow-hidden rounded-[28px] border-2 border-custom-primary-color bg-[#111111]
        p-5 text-custom-tertiary-text shadow-[10px_10px_0px_#000000] sm:rounded-[32px] sm:p-7 lg:p-10"
          >
            <div className="absolute right-[-80px] top-[-80px] h-[180px] w-[180px] rounded-full bg-[#44d7ff]/10 blur-3xl sm:h-[220px] sm:w-[220px]" />

            <div className="relative">
              <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <ShieldCheck className="h-4 w-4 text-[#19d67c]" />

                    <span className="text-[10px] font-extrabold tracking-[0.18em] text-custom-tertiary-text/70 sm:text-[11px]">
                      PROTOCOL GUARANTEES
                    </span>
                  </div>

                  <h3 className="text-[30px] font-extrabold leading-none tracking-[-2px] sm:text-[40px] lg:text-[54px]">
                    Designed For
                    <span className="block crypto-orange-gradient bg-clip-text text-transparent">
                      Flexible Liquidity.
                    </span>
                  </h3>
                </div>

                <p className="max-w-[520px] text-sm leading-7 text-custom-tertiary-text/60 sm:text-base sm:leading-8">
                  liTOKENS maintain 1:1 backing while enabling broader capital
                  efficiency across DeFi markets and liquidity layers.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3 lg:gap-5">
                {stats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className="rounded-[22px] border border-custom-secondary-color/10 bg-custom-primary-color/5 p-5 backdrop-blur-sm sm:rounded-[24px] sm:p-6"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="text-[11px] font-extrabold tracking-[0.18em] text-custom-tertiary-text/40 sm:text-xs">
                        {stat.label}
                      </div>

                      {index !== stats.length - 1 && (
                        <ArrowRight className="hidden h-5 w-5 text-[#44d7ff] md:block" />
                      )}
                    </div>

                    <div
                      className={`text-[24px] font-extrabold tracking-[-1px] sm:text-[28px] lg:text-[34px] ${stat.valueClass || "text-custom-tertiary-text"}`}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
