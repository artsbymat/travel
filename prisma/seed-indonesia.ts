/* eslint-disable @typescript-eslint/no-explicit-any */
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
  console.log("Fetching provinces from wilayah.id...");
  try {
    const provincesRes = await fetch("https://wilayah.id/api/provinces.json");
    const provincesData: any = await provincesRes.json();
    const provinces = provincesData.data;

    console.log(`Found ${provinces.length} provinces. Seeding...`);

    for (const p of provinces) {
      try {
        const province = await prisma.province.upsert({
          where: { name: p.name },
          update: { code: p.code },
          create: {
            name: p.name,
            code: p.code,
          },
        });

        console.log(`- Fetching cities for ${p.name} (${p.code})...`);
        const citiesRes = await fetch(`https://wilayah.id/api/regencies/${p.code}.json`);
        const citiesData: any = await citiesRes.json();
        const regencies = citiesData.data;

        for (const r of regencies) {
          try {
            await prisma.city.upsert({
              where: {
                code: r.code,
              },
              update: {
                name: r.name,
                provinceId: province.id,
              },
              create: {
                name: r.name,
                code: r.code,
                provinceId: province.id,
              },
            });
          } catch (cityError) {
            console.error(`  x Error seeding city ${r.name}:`, cityError);
          }
        }
      } catch (provError) {
        console.error(`x Error seeding province ${p.name}:`, provError);
      }
    }

    console.log("Full Indonesia region seeding completed.");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
