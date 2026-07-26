"use client";
import { motion } from "motion/react";
import { Droplets, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";

const DONUT_RADIUS = 80;
const DONUT_STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

// 80% teal, 20% orange
const tealDash = CIRCUMFERENCE * 0.8;
const orangeDash = CIRCUMFERENCE * 0.2;

const splits = [
  {
    label: "Reward Pools",
    sublabel: "Refills stable + non-stable pools every action",
    percentage: "80%",
    icon: Droplets,
    color: "#19d67c",
    iconBg: "bg-[#19d67c]/10 border-[#19d67c]/20",
    iconColor: "text-[#19d67c]",
    valueColor: "text-[#19d67c]",
  },
  {
    label: "Protocol Team",
    sublabel: "Funds development and operations",
    percentage: "20%",
    icon: BarChart3,
    color: "#ff6b35",
    iconBg: "bg-[#ff6b35]/10 border-[#ff6b35]/20",
    iconColor: "text-[#ff6b35]",
    valueColor: "crypto-orange-gradient bg-clip-text text-transparent",
  },
];

export const FeesSection = () => {
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
              FLAT · FAIR · TRANSPARENT
            </span>
          </div>

          <h2
            className="mb-5 text-[40px] font-extrabold leading-[0.95] tracking-[-2px]
            text-custom-primary-text sm:text-[56px] sm:tracking-[-3px]
            md:text-[72px] lg:text-[92px] lg:tracking-[-5px]"
          >
            One Flat Rate,
            <br />
            <span className="crypto-orange-gradient bg-clip-text text-transparent">
              Split Two Ways.
            </span>
          </h2>

          <p className="mx-auto max-w-[720px] text-sm leading-7 text-muted-foreground sm:text-base sm:leading-8 md:text-lg lg:text-xl lg:leading-9">
            Every lock, unlock and claim carries the same 5% — here's exactly where it goes.
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
            {/* Subtle glow top-right */}
            <div className="pointer-events-none absolute right-[-60px] top-[-60px] h-[200px] w-[200px] rounded-full bg-[#19d67c]/8 blur-3xl" />

            <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:gap-16">
              {/* ── Donut chart ── */}
              <div className="relative shrink-0">
                <svg
                  width={DONUT_RADIUS * 2 + DONUT_STROKE * 2 + 4}
                  height={DONUT_RADIUS * 2 + DONUT_STROKE * 2 + 4}
                  viewBox={`0 0 ${DONUT_RADIUS * 2 + DONUT_STROKE * 2 + 4} ${DONUT_RADIUS * 2 + DONUT_STROKE * 2 + 4}`}
                  className="rotate-[-90deg]"
                >
                  {/* Track */}
                  <circle
                    cx={DONUT_RADIUS + DONUT_STROKE + 2}
                    cy={DONUT_RADIUS + DONUT_STROKE + 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={DONUT_STROKE}
                    className="text-custom-primary-color/10"
                  />

                  {/* Teal segment — 80% */}
                  <circle
                    cx={DONUT_RADIUS + DONUT_STROKE + 2}
                    cy={DONUT_RADIUS + DONUT_STROKE + 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke="#19d67c"
                    strokeWidth={DONUT_STROKE}
                    strokeDasharray={`${tealDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                  />

                  {/* Orange segment — 20%, starts where teal ends */}
                  <circle
                    cx={DONUT_RADIUS + DONUT_STROKE + 2}
                    cy={DONUT_RADIUS + DONUT_STROKE + 2}
                    r={DONUT_RADIUS}
                    fill="none"
                    stroke="#ff6b35"
                    strokeWidth={DONUT_STROKE}
                    strokeDasharray={`${orangeDash} ${CIRCUMFERENCE}`}
                    strokeDashoffset={-tealDash}
                    strokeLinecap="round"
                  />
                </svg>

                {/* Centre label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[36px] font-black leading-none tracking-[-2px] crypto-orange-gradient bg-clip-text text-transparent">
                    5%
                  </span>
                  <span className="mt-1 text-[9px] font-extrabold tracking-[0.2em] text-muted-foreground">
                    TOTAL FEE
                  </span>
                </div>
              </div>

              {/* ── Legend rows ── */}
              <div className="w-full flex-1 space-y-4">
                {splits.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.25 + index * 0.1 }}
                      className="flex items-center gap-4 rounded-[18px] border border-custom-primary-color/30
                        bg-custom-primary-color/5 px-5 py-4 backdrop-blur-sm
                        transition-all duration-200 hover:border-custom-primary-color/60
                        hover:bg-custom-primary-color/10 sm:gap-5 sm:px-6 sm:py-5"
                    >
                      {/* Icon */}
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center
                          rounded-[14px] border ${item.iconBg} sm:h-12 sm:w-12`}
                      >
                        <Icon className={`h-5 w-5 ${item.iconColor} sm:h-5 sm:w-5`} />
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-extrabold text-custom-primary-text sm:text-base">
                          {item.label}
                        </div>
                        <div className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                          {item.sublabel}
                        </div>
                      </div>

                      {/* Percentage */}
                      <div
                        className={`shrink-0 text-[28px] font-black leading-none tracking-[-1.5px]
                          sm:text-[36px] lg:text-[40px] ${item.valueColor}`}
                      >
                        {item.percentage}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};
