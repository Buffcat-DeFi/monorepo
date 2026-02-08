import { motion } from "motion/react";
import { Lock, Coins, TrendingUp, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Lock,
    number: "01",
    title: "Lock Your Tokens",
    description:
      "Lock any token into Twoside's smart contracts. Your tokens are secured in a transparent, auditable vault.",
    color: "blue-500",
    textColor: "text-blue-500",
  },
  {
    icon: Coins,
    number: "02",
    title: "Mint Derivatives",
    description:
      "Receive liTOKENs at a 1:1 ratio. These derivatives represent your locked tokens and can be freely traded.",
    color: "yellow-500",
    textColor: "text-yellow-500",
  },
  {
    icon: TrendingUp,
    number: "03",
    title: "Use or Redeem",
    description:
      "Trade liTOKENs in liquidity pools, farm rewards, or redeem them for your original tokens anytime at 1:1.",
    color: "red-500",
    textColor: "text-red-500",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--crypto-blue)/0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,hsl(var(--deep-blue)/0.05),transparent_50%)]" />

      <div className="container max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How Twoside <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to unlock liquidity from your coins
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-1 bg-primary/20 z-0">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    whileInView={{ width: "100%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                  />
                </div>
              )}

              <motion.div
                className="bg-background rounded-2xl border-4 border-primary p-8 neo-shadow relative h-full
                hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all"
                whileHover={{ scale: 1.02 }}
              >
                {/* Step number badge */}
                <div
                  className={`absolute -top-4 -right-4 w-12 h-12 bg-${step.color} border-2 border-primary
                  flex items-center justify-center font-bold text-lg neo-shadow-sm rounded-full`}
                >
                  {step.number}
                </div>

                <div
                  className={`w-16 h-16 bg-${step.color}/10 border-2 border-primary flex items-center justify-center mb-6`}
                >
                  <step.icon className={`w-8 h-8 ${step.textColor}`} />
                </div>

                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Visual flow diagram */}
        <motion.div
          className="mt-16 bg-background rounded-4xl border-4 border-primary p-8 neo-shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex-1">
              <p className="text-sm font-bold mb-2">EXCHANGE RATE</p>
              <p className="text-3xl font-bold">1 TOKEN = 1 liTOKEN</p>
            </div>

            <ArrowRight className="w-8 h-8 text-crypto-blue rotate-90 md:rotate-0" />

            <div className="flex-1">
              <p className="text-sm font-bold mb-2">PLATFORM FEE</p>
              <p className="text-3xl font-bold text-accent-red">0.5%</p>
            </div>

            <ArrowRight className="w-8 h-8 text-crypto-blue rotate-90 md:rotate-0" />

            <div className="flex-1">
              <p className="text-sm font-bold mb-2">REDEMPTION</p>
              <p className="text-3xl font-bold text-crypto-blue">ANYTIME</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
