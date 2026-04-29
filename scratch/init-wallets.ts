import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Initializing wallets for existing vendors...");
  
  const vendors = await prisma.vendor.findMany({
    where: {
      wallet: null
    }
  });

  console.log(`Found ${vendors.length} vendors without a wallet.`);

  for (const vendor of vendors) {
    await prisma.vendorWallet.create({
      data: {
        vendorId: vendor.id,
        balance: 0,
        pendingIn: 0,
        debt: 0,
        totalEarned: 0,
      }
    });
    console.log(`Created wallet for vendor: ${vendor.name}`);
  }

  console.log("Initialization complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
