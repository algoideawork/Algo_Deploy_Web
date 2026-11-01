const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableRLS() {
  console.log("Enabling Row Level Security (RLS) on all tables...");
  const tables = [
    'User',
    'BrokerAccount',
    'Strategy',
    'Subscription',
    'SignalLog',
    'OrderExecution',
  ];

  for (const table of tables) {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
    console.log(`✓ RLS Enabled on "${table}"`);
  }

  console.log("All tables are now secured with RLS!");
  await prisma.$disconnect();
}

enableRLS().catch((err) => {
  console.error("Error enabling RLS:", err);
  process.exit(1);
});
