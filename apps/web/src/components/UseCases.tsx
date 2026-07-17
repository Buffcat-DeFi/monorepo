"use client";
import { motion } from "motion/react";
import { ArrowRight, Droplets, Gem, Target, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";

const useCases = [
  {
    icon: Droplets,
    title: "Liquidity Provision",
    description:
      "Create new trading pairs with your liTOKENs while maintaining exposure to your favorite assets.",
    benefit: "Earn passive income without selling",
    accent: "#00bfff",
    wash: "bg-[#44d7ff]/15",
    direction: "left",
  },
  {
    icon: Gem,
    title: "Collateral For Lending",
    description:
      "Use liTOKENs as collateral to unlock liquidity and borrow against your holdings instantly.",
    benefit: "Access capital while HODLing",
    accent: "#4c7dff",
    wash: "bg-[#4c7dff]/15",
    direction: "right",
  },
  {
    icon: Target,
    title: "Yield Farming",
    description:
      "Deploy derivatives into farming pools and multiply opportunities across DeFi ecosystems.",
    benefit: "Stack yields on your holdings",
    accent: "#e71d36",
    wash: "bg-[#e71d36]/15",
    direction: "left",
  },
  {
    icon: Wallet,
    title: "Portfolio Hedging",
    description:
      "Reduce downside exposure and build flexible hedging strategies during volatile markets.",
    benefit: "Manage risk strategically",
    accent: "#44d7ff",
    wash: "bg-[#44d7ff]/15",
    direction: "right",
  },
];

function UseCaseCard({
  item,
  index,
}: {
  item: (typeof useCases)[number];
  index: number;
}) {
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      className="grid items-center gap-5 xl:grid-cols-[1fr_120px_1fr] xl:gap-8"
    >
      {/* MOBILE */}
      <div className="xl:hidden">
        <Card className="relative overflow-hidden rounded-[30px] border-2 border-custom-primary-color bg-custom-bg p-5 shadow-[10px_10px_0px_#000000] sm:p-6">
          <div
            className={`absolute -right-10 -top-10 h-[180px] w-[180px] rounded-full ${item.wash} blur-3xl`}
          />
          <div className="relative">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-[22px] border-2 border-custom-primary-color bg-custom-bg shadow-[6px_6px_0px_#000000]">
                  <Icon className="h-8 w-8" style={{ color: item.accent }} />
                </div>

                <div>
                  <div className="mb-2 text-[10px] font-black tracking-[0.18em] text-custom-muted-text">
                    USE CASE
                  </div>
                  <h3 className="text-[28px] font-extrabold leading-[0.95] tracking-[-1.5px] text-custom-primary-text">
                    {item.title}
                  </h3>
                </div>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-custom-primary-color bg-custom-bg shadow-[4px_4px_0px_#000000]">
                <span className="text-[11px] font-black tracking-[0.2em] text-custom-primary-text">
                  0{index + 1}
                </span>
              </div>
            </div>

            <p className="mb-6 max-w-[680px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8">
              {item.description}
            </p>

            <div
              className="flex flex-row gap-4 rounded-[24px] justify-between
              border-2 border-custom-primary-color bg-black p-5
              text-custom-tertiary-text sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col justify-start">
                <div className="mb-1 text-[10px] font-black tracking-[0.18em] text-custom-tertiary-text/40">
                  STRATEGIC ADVANTAGE
                </div>
                <div className="text-sm font-extrabold sm:text-base">
                  {item.benefit}
                </div>
              </div>

              <div
                className="flex h-11 w-11 items-center justify-center rounded-full
                border border-custom-secondary-color/10 bg-custom-bg/10"
              >
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* DESKTOP LEFT */}
      <div
        className={
          item.direction === "left" ? "hidden xl:block" : "hidden xl:block"
        }
      >
        <div className={item.direction === "left" ? "pr-6" : "pl-6 xl:order-3"}>
          {item.direction === "left" && (
            <Card
              className="group relative min-h-[360px] overflow-hidden rounded-[34px] border-2
              border-custom-primary-color bg-custom-bg p-8 shadow-[12px_12px_0px_#000000]
              transition-transform duration-200 hover:-translate-y-1 hover:-translate-x-1"
            >
              <div
                className={`absolute -right-10 -top-10 h-[240px] w-[240px] rounded-full ${item.wash} blur-3xl`}
              />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-90" />
              <div className="relative flex h-full flex-col">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div
                    className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px]
                    border-2 border-custom-primary-color bg-custom-bg shadow-[6px_6px_0px_#000000]"
                  >
                    <Icon className="h-8 w-8" style={{ color: item.accent }} />
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-custom-primary-color/10 bg-custom-primary-color/[0.03] px-3 py-2">
                    <span className="text-[10px] font-black tracking-[0.18em] text-custom-primary-color/40">
                      EXPLORE
                    </span>
                    <ArrowRight
                      className="h-4 w-4"
                      style={{ color: item.accent }}
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: item.accent }}
                  />
                  <div className="text-xs font-extrabold tracking-[0.2em] text-custom-muted-text">
                    USE CASE
                  </div>
                </div>

                <h3 className="mb-4 max-w-[460px] text-[34px] font-extrabold leading-tight tracking-[-1.5px] text-custom-primary-text">
                  {item.title}
                </h3>

                <p className="mb-8 max-w-[540px] text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8">
                  {item.description}
                </p>

                <div className="mt-auto rounded-[24px] border-2 border-custom-primary-color bg-black p-5 text-custom-tertiary-text">
                  <div className="mb-1 text-[10px] font-black tracking-[0.18em] text-custom-tertiary-text/40">
                    STRATEGIC ADVANTAGE
                  </div>
                  <div className="text-base font-extrabold">{item.benefit}</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* CENTER NODE */}
      <div className="hidden xl:flex xl:items-center xl:justify-center">
        <div
          className="relative flex h-[80px] w-[80px] items-center justify-center
          rounded-full border-2 border-custom-primary-color bg-custom-bg shadow-[8px_8px_0px_#000000]"
        >
          <span className="text-xl font-black tracking-[0.2em] text-custom-primary-text">
            0{index + 1}
          </span>
        </div>
        {/*<div
          className="relative flex h-[120px] w-[120px] items-center justify-center
          rounded-full border-2 border-custom-primary-color bg-custom-bg shadow-[8px_8px_0px_#000000]"
        >
          <div className="absolute inset-4 rounded-full border border-black/10" />
          <div className="absolute inset-7 rounded-full bg-black/[0.03]" />
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full
            border-2 border-custom-primary-color bg-custom-bg shadow-[4px_4px_0px_#000000]"
          >
            <span className="text-[12px] font-black tracking-[0.2em] text-custom-primary-text">
              0{index + 1}
            </span>
          </div>
        </div>*/}
      </div>

      {/* DESKTOP RIGHT */}
      <div className="hidden xl:block">
        <div className={item.direction === "right" ? "pl-6" : "pr-6"}>
          {item.direction === "right" && (
            <Card
              className="group relative min-h-[360px] overflow-hidden rounded-[34px]
              border-2 border-custom-primary-color bg-custom-bg p-8
              shadow-[12px_12px_0px_#000000] transition-transform duration-200
              hover:-translate-y-1 hover:translate-x-1"
            >
              <div
                className={`absolute -left-10 -top-10 h-[240px] w-[240px] rounded-full ${item.wash} blur-3xl`}
              />
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-90" />
              <div className="relative flex h-full flex-col">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div
                    className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px]
                    border-2 border-custom-primary-color bg-custom-bg shadow-[6px_6px_0px_#000000]"
                  >
                    <Icon className="h-8 w-8" style={{ color: item.accent }} />
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-custom-primary-color/10 bg-custom-primary-color/[0.03] px-3 py-2">
                    <span className="text-[10px] font-black tracking-[0.18em] text-custom-primary-text/40">
                      EXPLORE
                    </span>
                    <ArrowRight
                      className="h-4 w-4"
                      style={{ color: item.accent }}
                    />
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: item.accent }}
                  />
                  <div className="text-xs font-extrabold tracking-[0.2em] text-custom-muted-text">
                    USE CASE
                  </div>
                </div>

                <h3 className="mb-4 max-w-[460px] text-[34px] font-extrabold leading-tight tracking-[-1.5px] text-custom-primary-text">
                  {item.title}
                </h3>

                <p className="mb-8 max-w-[540px] text-[15px] leading-7 text-muted-foreground sm:text-base sm:leading-8">
                  {item.description}
                </p>

                <div className="mt-auto rounded-[24px] border-2 border-custom-primary-color bg-black p-5 text-custom-tertiary-text">
                  <div className="mb-1 text-[10px] font-black tracking-[0.18em] text-custom-tertiary-text/40">
                    STRATEGIC ADVANTAGE
                  </div>
                  <div className="text-base font-extrabold">{item.benefit}</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export const UseCases = () => {
  return (
    <section className="relative isolate overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
      <div
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative mx-auto max-w-[1450px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 max-w-[900px] text-center lg:mb-20"
        >
          <div
            className="mb-5 inline-flex items-center gap-3 rounded-full
            border-2 border-custom-primary-color bg-custom-bg
            px-5 py-2.5 shadow-[6px_6px_0px_#000000]"
          >
            <div className="h-2.5 w-2.5 rounded-full bg-[#00bfff] shadow-[0_0_12px_#00bfff]" />
            <span className="text-[11px] font-extrabold tracking-[0.18em] text-custom-primary-text sm:text-xs">
              INFINITE DEFI COMPOSABILITY
            </span>
          </div>

          <h2 className="mb-5 text-[42px] font-extrabold leading-[0.95] tracking-[-2px] text-custom-primary-text sm:text-[58px] md:text-[72px] lg:text-[92px]">
            Unlock Infinite
            <br />
            <span className="bg-gradient-to-r from-[#44d7ff] to-[#4c7dff] bg-clip-text text-transparent">
              Possibilities.
            </span>
          </h2>

          <p className="mx-auto max-w-[760px] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 md:text-xl">
            Twoside transforms locked positions into productive on-chain assets,
            enabling lending, farming, hedging, and liquidity generation.
          </p>
        </motion.div>

        <div className="relative">
          <div className="absolute left-1/2 top-0 hidden h-full w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#44d7ff] via-[#4c7dff] to-[#e71d36] xl:block" />

          <div className="space-y-8 lg:space-y-10 xl:space-y-12">
            {useCases.map((item, index) => (
              <UseCaseCard key={item.title} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
