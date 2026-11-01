const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log("Connecting to Supabase...");
  const user = await prisma.user.upsert({
    where: { email: "trader@algodeploy.in" },
    update: {},
    create: {
      email: "trader@algodeploy.in",
      name: "Kushal Algo Master",
      role: "LEADER",
    },
  });

  console.log("User ready:", user.email);

  const sampleStrategies = [
    {
      name: "Nifty 50 Supertrend Surge",
      description: "Automated multi-timeframe Supertrend + EMA 20 breakout strategy for Nifty 50 Futures and Intraday options.",
      symbol: "NIFTY",
      exchange: "NFO",
      webhookToken: "nifty_supertrend_token_9921",
      isPublic: true,
      isLive: true,
      riskMultiplierDefault: 1.0,
      tags: ["Nifty", "Intraday", "F&O", "Supertrend"],
      winRate: 68.4,
      roi: 142.5,
      maxDrawdown: 8.2,
      totalTrades: 320,
    },
    {
      name: "BankNifty VWAP Reversal",
      description: "Mean-reversion strategy trading BankNifty price exhaustion above/below VWAP bands with strict trailing SL.",
      symbol: "BANKNIFTY",
      exchange: "NFO",
      webhookToken: "banknifty_vwap_token_3341",
      isPublic: true,
      isLive: true,
      riskMultiplierDefault: 1.5,
      tags: ["BankNifty", "Options", "Scalping", "VWAP"],
      winRate: 71.2,
      roi: 185.0,
      maxDrawdown: 11.4,
      totalTrades: 450,
    },
    {
      name: "Reliance Momentum Breakout",
      description: "High-momentum swing & intraday breakout system on Reliance equity (MIS / CNC).",
      symbol: "RELIANCE",
      exchange: "NSE",
      webhookToken: "reliance_breakout_token_7712",
      isPublic: true,
      isLive: true,
      riskMultiplierDefault: 1.0,
      tags: ["Equity", "Breakout", "Intraday"],
      winRate: 64.0,
      roi: 94.2,
      maxDrawdown: 6.8,
      totalTrades: 195,
    },
  ];

  for (const s of sampleStrategies) {
    await prisma.strategy.upsert({
      where: { webhookToken: s.webhookToken },
      update: {},
      create: {
        userId: user.id,
        ...s,
      },
    });
  }

  console.log("Seeded 3 live strategies into Supabase successfully!");
  await prisma.$disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
