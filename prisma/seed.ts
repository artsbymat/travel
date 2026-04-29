import "dotenv/config";

import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const password = "password123";
const provinceName = "DKI Jakarta";
const provinceCode = "ID-JK";
const cityName = "Jakarta Selatan";
const cityCode = "31.74";
const vendorSlug = "dummy-travel";
const vendorEmail = "vendor@example.com";

const vendorData = {
  name: "Dummy Travel",
  slug: vendorSlug,
  description: "Vendor dummy untuk development dengan data yang mengikuti schema vendor terbaru.",
  address: "Jl. Raya Pasar Minggu No. 88, Pancoran, Jakarta Selatan",
  phone: "081234567890",
  email: vendorEmail,
  logo: "https://placehold.co/256x256?text=Dummy+Travel",
  isActive: true,
  isHeld: false,
  legalName: "PT Dummy Travel Nusantara",
  npwp: "123456789012345",
  siup: "SIUP/DUMMY/2026/0001",
  taxEnabled: true,
  taxRate: "11.00",
  taxName: "PPN",
  acceptCash: true,
  platformFeeRate: "5.00"
} as const;

async function main() {
  const hashedPassword = await hash(password, 10);

  const province = await prisma.province.upsert({
    where: { name: provinceName },
    update: {
      code: provinceCode
    },
    create: {
      name: provinceName,
      code: provinceCode
    }
  });

  const city = await prisma.city.upsert({
    where: { code: cityCode },
    update: {
      name: cityName,
      provinceId: province.id
    },
    create: {
      name: cityName,
      code: cityCode,
      provinceId: province.id
    }
  });

  const vendor = await prisma.vendor.upsert({
    where: { slug: vendorSlug },
    update: {
      ...vendorData,
      cityId: city.id
    },
    create: {
      ...vendorData,
      cityId: city.id
    }
  });

  await prisma.vendorWallet.upsert({
    where: { vendorId: vendor.id },
    update: {
      balance: "0",
      pendingIn: "0",
      debt: "0",
      totalEarned: "0",
      lockedAt: null
    },
    create: {
      vendorId: vendor.id,
      balance: "0",
      pendingIn: "0",
      debt: "0",
      totalEarned: "0"
    }
  });

  const users = [
    {
      name: "Super Admin",
      email: "superadmin@example.com",
      phone: "081111111111",
      role: Role.SUPER_ADMIN,
      vendorId: null
    },
    {
      name: "Owner Dummy Travel",
      email: "owner@example.com",
      phone: "082222222222",
      role: Role.OWNER,
      vendorId: vendor.id
    },
    {
      name: "Staff Dummy",
      email: "staff@example.com",
      phone: "083333333333",
      role: Role.STAFF,
      vendorId: vendor.id
    },
    {
      name: "Driver Dummy",
      email: "driver@example.com",
      phone: "084444444444",
      role: Role.DRIVER,
      vendorId: vendor.id
    }
  ];

  await Promise.all(
    users.map((user) =>
      prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          phone: user.phone,
          password: hashedPassword,
          role: user.role,
          vendorId: user.vendorId
        },
        create: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          password: hashedPassword,
          role: user.role,
          vendorId: user.vendorId
        }
      })
    )
  );

  console.log("Dummy accounts created:");
  console.table(
    users.map(({ email, role, vendorId }) => ({
      email,
      role,
      vendor: vendorId ? vendor.name : "-",
      password
    }))
  );

  console.log("Dummy vendor created:");
  console.table([
    {
      vendor: vendor.name,
      slug: vendor.slug,
      city: city.name,
      province: province.name,
      email: vendor.email,
      owner: "owner@example.com"
    }
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
