import { motion } from "motion/react";
import { Droplets, Gem, Target, Wallet } from "lucide-react";

const useCases = [
  {
    icon: Droplets,
    title: "Liquidity Provision",
    description:
      "Create new trading pairs with your liTOKENs. Earn fees while maintaining exposure to your favorite coins.",
    benefit: "Earn passive income without selling",
    gradient: "from-crypto-blue to-crypto-blue-dark",
  },
  {
    icon: Gem,
    title: "Collateral for Lending",
    description:
      "Use liTOKENs as collateral to borrow stablecoins or other assets. Leverage without liquidating your position.",
    benefit: "Access capital while HODLing",
    gradient: "from-deep-blue to-crypto-blue",
  },
  {
    icon: Target,
    title: "Yield Farming",
    description:
      "Stake liTOKENs in farming pools to earn additional rewards. Multiply your returns while tokens stay locked.",
    benefit: "Stack yields on your holdings",
    gradient: "from-red-800 to-deep-blue",
  },
  {
    icon: Wallet,
    title: "Portfolio Hedging",
    description:
      "Lock tokens during volatile periods. Use liTOKENs to establish hedging positions without market exposure.",
    benefit: "Manage risk strategically",
    gradient: "from-primary to-crypto-blue",
  },
];

export const UseCases = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="container max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Unlock <span className="gradient-text">Infinite Possibilities</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Don't just hold your coins—put them to work. Twoside opens up a
            parallel DeFi ecosystem for speculative assets.
          </p>
        </motion.div>

        {/* make left column narrower and right column wider on md+ screens */}
        <div className="grid grid-cols-1 md:[grid-template-columns:1fr_1.4fr] gap-6">
          {useCases.slice(0, 2).map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <motion.div
                className="bg-background border-4 border-primary p-8
                neo-shadow-card h-full group hover:translate-x-1
                hover:translate-y-1 transition-all rounded-2xl"
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${useCase.gradient} flex items-center
                  justify-center mb-6 border-2 border-primary`}
                >
                  <useCase.icon className="w-8 h-8 text-background" />
                </div>

                <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="pt-4 border-t-2 border-primary/20">
                  <p className="text-sm font-bold text-crypto-blue">
                    ✦ {useCase.benefit}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:[grid-template-columns:1.4fr_1fr] gap-6 md:mt-4">
          {useCases.slice(2, 4).map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <motion.div
                className="bg-background border-4 border-primary p-8
                neo-shadow-card h-full group hover:translate-x-1
                hover:translate-y-1 transition-all rounded-2xl"
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${useCase.gradient} flex items-center justify-center mb-6 border-2 border-primary`}
                >
                  <useCase.icon className="w-8 h-8 text-background" />
                </div>

                <h3 className="text-2xl font-bold mb-3">{useCase.title}</h3>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {useCase.description}
                </p>

                <div className="pt-4 border-t-2 border-primary/20">
                  <p className="text-sm font-bold text-crypto-blue">
                    ✦ {useCase.benefit}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
